import { useEffect, useRef, useCallback, useState } from 'react';
import { useUser } from './use-user';

type WebSocketMessage = {
  type: string;
  data?: any;
  senderId?: string;
};

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const messageQueue = useRef<WebSocketMessage[]>([]);

  const connect = useCallback(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);

      // Send queued messages
      while (messageQueue.current.length > 0) {
        const message = messageQueue.current.shift();
        if (message) sendMessage(message);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);

      // Attempt to reconnect after 2 seconds
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, 2000);
    };
  }, [user]);

  useEffect(() => {
    connect();
    return () => {
      reconnectTimeout.current && clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      messageQueue.current.push(message);
      return;
    }
    ws.current.send(JSON.stringify(message));
  }, []);

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

  const startTyping = useCallback((type: 'intelligence' | 'alert') => {
    sendMessage({
      type: 'typing_start',
      data: { type }
    });
  }, [sendMessage]);

  const stopTyping = useCallback((type: 'intelligence' | 'alert') => {
    sendMessage({
      type: 'typing_end',
      data: { type }
    });
  }, [sendMessage]);

  return {
    sendMessage,
    subscribe,
    startTyping,
    stopTyping,
    isConnected,
  };
}