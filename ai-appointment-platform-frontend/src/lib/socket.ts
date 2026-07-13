import { io, Socket } from 'socket.io-client';
import { auth } from './auth';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

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

  static connect() {
    const socket = this.getInstance();
    socket.auth = { token: auth.getToken() };
    if (!socket.connected) {
      socket.connect();
    }
  }

  static disconnect() {
    if (SocketManager.instance) {
      SocketManager.instance.disconnect();
    }
  }
}

export const getSocket = () => SocketManager.getInstance();
export const connectSocket = () => SocketManager.connect();
export const disconnectSocket = () => SocketManager.disconnect();
