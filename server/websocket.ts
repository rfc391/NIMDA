
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
    id?: number;
    timestamp: number;
  };
}

export function setupWebSocket(server: Server, app: Express) {
  const wss = new WebSocketServer({ noServer: true });
  let clients: Client[] = [];

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

  function broadcastToRoom(message: any, senderId: string, roomId?: number) {
    const outbound = JSON.stringify({
      ...message,
      senderId,
    });

    clients.forEach(client => {
      if (client.id !== senderId && 
          client.ws.readyState === WebSocket.OPEN &&
          (!roomId || client.typing?.id === roomId)) {
        client.ws.send(outbound);
      }
    });
  }

  function handleTypingStatus(message: any, client: Client) {
    const now = Date.now();
    client.typing = message.type === 'typing_start' 
      ? {
          type: message.data.type,
          id: message.data.id,
          timestamp: now,
        }
      : undefined;

    broadcast({
      type: message.type,
      data: {
        username: client.username,
        type: message.data.type,
        id: message.data.id,
      }
    }, client.id);
  }

  server.on('upgrade', (request, socket, head) => {
    if (request.headers['sec-websocket-protocol'] === 'vite-hmr') {
      return;
    }

    app.request.sessionParser(request as any, {} as any, () => {
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

    const client: Client = { id: clientId, ws, userId, username };
    clients.push(client);

    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      activeUsers: clients.map(c => c.username),
    }));

    broadcast({ type: 'user_active', data: { username } }, clientId);

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
      broadcast({ type: 'user_inactive', data: { username } }, clientId);
    });
  });
}
