import { useEffect } from 'react';
import { connectSocket, getSocket } from '../../lib/socket';

export function useSocketEvent<T = unknown>(event: string, handler: (data: T) => void): void {
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);
}
