import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import type { Express } from 'express';

interface Client {
  id: string;
  ws: WebSocket;
  userId: number;
}

let clients: Client[] = [];

export function setupWebSocket(server: Server, app: Express) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade of HTTP connection to WebSocket
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
    const clientId = Math.random().toString(36).substring(7);
    
    const client: Client = {
      id: clientId,
      ws,
      userId,
    };
    
    clients.push(client);

    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
    }));

    ws.on('message', (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        
        // Broadcast to all other clients
        broadcast(message, clientId);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    ws.on('close', () => {
      clients = clients.filter(c => c.id !== clientId);
    });
  });

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
