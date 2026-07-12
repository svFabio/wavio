import { useEffect } from 'react';
import { getSocket } from '../../lib/socket';

export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler, ...deps]);
}
