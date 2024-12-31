
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

interface BroadcastMessage {
  type: string;
  data?: any;
  senderId: string;
}

export function setupWebSocket(server: Server, app: Express) {
  const wss = new WebSocketServer({ noServer: true });
  let clients: Client[] = [];

  function broadcast(message: BroadcastMessage, senderId: string) {
    broadcastToRoom(message, senderId);
  }

  function broadcastToRoom(message: BroadcastMessage, senderId: string, roomId?: number) {
    const outbound = JSON.stringify({ ...message, senderId });

    clients.forEach(client => {
      const shouldSendToClient = 
        client.id !== senderId && 
        client.ws.readyState === WebSocket.OPEN &&
        (!roomId || client.typing?.id === roomId);

      if (shouldSendToClient) {
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

  function handleMessage(rawMessage: string, client: Client) {
    try {
      const message = JSON.parse(rawMessage);
      const messageHandlers = {
        'typing_start': () => handleTypingStatus(message, client),
        'typing_end': () => handleTypingStatus(message, client),
        'annotation_created': () => broadcastToRoom(message, client.id, message.data.intelligenceId),
        'annotation_updated': () => broadcastToRoom(message, client.id, message.data.intelligenceId),
        'filter_change': () => broadcastToRoom(message, client.id),
        'default': () => broadcast(message, client.id)
      };

      (messageHandlers[message.type] || messageHandlers.default)();
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  server.on('upgrade', (request, socket, head) => {
    if (request.headers['sec-websocket-protocol'] === 'vite-hmr') return;

    app.request.sessionParser(request as any, {} as any, () => {
      if (!(request as any).session?.passport?.user) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
      });
    });
  });

  wss.on('connection', (ws, request: any) => {
    const { user: userId, username } = request.session.passport;
    const clientId = Math.random().toString(36).substring(7);
    const client: Client = { id: clientId, ws, userId, username };
    
    clients.push(client);

    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      activeUsers: clients.map(c => c.username),
    }));

    broadcast({ type: 'user_active', data: { username } }, clientId);

    ws.on('message', message => handleMessage(message.toString(), client));

    ws.on('close', () => {
      clients = clients.filter(c => c.id !== clientId);
      broadcast({ type: 'user_inactive', data: { username } }, clientId);
    });
  });
}
