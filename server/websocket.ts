import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import type { Express } from 'express';

interface Client {
  id: string;
  ws: WebSocket;
  userId: number;
  username: string;
  typing?: {
    type: 'intelligence' | 'alert' | 'annotation';
    id?: number; // Intelligence or annotation ID for context
    timestamp: number;
  };
}

let clients: Client[] = [];

export function setupWebSocket(server: Server, app: Express) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.headers['sec-websocket-protocol'] === 'vite-hmr') {
      return;
    }

    const sessionParser = app.request.sessionParser;
    sessionParser(request as any, {} as any, () => {
      if (!(request as any).session?.passport?.user) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  });

  wss.on('connection', (ws, request: any) => {
    const userId = request.session.passport.user;
    const username = request.session.passport.username;
    const clientId = Math.random().toString(36).substring(7);

    const client: Client = {
      id: clientId,
      ws,
      userId,
      username,
    };

    clients.push(client);

    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      activeUsers: clients.map(c => c.username),
    }));

    // Broadcast new user to others
    broadcastUserStatus('user_active', username, clientId);

    ws.on('message', (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());

        switch (message.type) {
          case 'typing_start':
          case 'typing_end':
            handleTypingStatus(message, client);
            break;
          case 'annotation_created':
          case 'annotation_updated':
            broadcastToRoom(message, clientId, message.data.intelligenceId);
            break;
          case 'filter_change':
            broadcastToRoom(message, clientId);
            break;
          default:
            broadcast(message, clientId);
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    ws.on('close', () => {
      clients = clients.filter(c => c.id !== clientId);
      broadcastUserStatus('user_inactive', username, clientId);
    });
  });

  function broadcastUserStatus(type: 'user_active' | 'user_inactive', username: string, senderId: string) {
    const message = {
      type,
      data: { username }
    };
    broadcast(message, senderId);
  }

  function handleTypingStatus(message: any, client: Client) {
    const now = Date.now();
    if (message.type === 'typing_start') {
      client.typing = {
        type: message.data.type,
        id: message.data.id,
        timestamp: now,
      };
    } else {
      client.typing = undefined;
    }

    // Broadcast typing status
    broadcast({
      type: message.type,
      data: {
        username: client.username,
        type: message.data.type,
        id: message.data.id,
      }
    }, client.id);
  }

  function broadcastToRoom(message: any, senderId: string, roomId?: number) {
    const outbound = JSON.stringify({
      ...message,
      senderId,
    });

    // Only send to clients viewing the same content
    clients.forEach(client => {
      if (client.id !== senderId && 
          client.ws.readyState === WebSocket.OPEN &&
          (!roomId || client.typing?.id === roomId)) {
        client.ws.send(outbound);
      }
    });
  }

  function broadcast(message: any, senderId: string) {
    const outbound = JSON.stringify({
      ...message,
      senderId,
    });

    clients.forEach(client => {
      if (client.id !== senderId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(outbound);
      }
    });
  }
}