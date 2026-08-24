import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { auth } from './auth';

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api(\/v1)?$/, '') || 'http://localhost:3000';

class SocketManager {
  private static instance: Socket | null = null;

  static getInstance(): Socket {
    if (!SocketManager.instance) {
      SocketManager.instance = io(SOCKET_URL, {
        autoConnect: false,
        reconnection: true,
        transports: ['websocket', 'polling'],
      });
    }
    return SocketManager.instance;
  }

  static connect(): void {
    const socket = this.getInstance();
    const token = auth.getToken();
    if (!token) {
      return;
    }
    const activeNegocioId = auth.getActiveNegocioId();
    socket.auth = {
      token,
      negocioId: activeNegocioId ?? undefined,
    };
    if (!socket.connected) {
      socket.connect();
    }
  }

  static disconnect(): void {
    if (SocketManager.instance) {
      SocketManager.instance.disconnect();
    }
  }
}

export const getSocket = (): Socket => SocketManager.getInstance();
export const connectSocket = (): void => SocketManager.connect();
export const disconnectSocket = (): void => SocketManager.disconnect();
