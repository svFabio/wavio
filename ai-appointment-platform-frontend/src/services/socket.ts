import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Socket.IO is hosted on the root server, so we strip '/api'
const urlBase = API_URL.replace('/api', '');

export const socket = io(urlBase, {
  transports: ['websocket', 'polling'],
  reconnection: true
});
