import { useEffect, useRef, useCallback } from 'react';
import { useUser } from './use-user';

type WebSocketMessage = {
  type: string;
  data?: any;
  senderId?: string;
};

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const { user } = useUser();

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    return () => {
      ws.current?.close();
    };
  }, [user]);

  const subscribe = useCallback((callback: (message: WebSocketMessage) => void) => {
    if (!ws.current) return;

    const handler = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        callback(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.addEventListener('message', handler);
    return () => ws.current?.removeEventListener('message', handler);
  }, []);

  return {
    sendMessage,
    subscribe,
  };
}
