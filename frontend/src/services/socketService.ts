import { io, Socket } from 'socket.io-client';

// Support both build-time (Vite) and runtime (Docker) configuration
const getSocketUrl = () => {
  // Check for runtime config (injected by Docker entrypoint)
  if (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SOCKET_URL) {
    return (window as any).__ENV__.VITE_SOCKET_URL;
  }
  // Fallback to build-time config (Vite)
  const apiUrl = (import.meta as any).env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace('/api', '');
  }
  return 'http://localhost:5002';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      // Get auth token for socket connection
      const token = localStorage.getItem('token');
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
        autoConnect: true,
        auth: {
          token: token
        }
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinDoctorQueue(doctorId: string) {
    if (this.socket) {
      this.socket.emit('join-doctor-queue', doctorId);
    }
  }

  leaveDoctorQueue(doctorId: string) {
    if (this.socket) {
      this.socket.emit('leave-doctor-queue', doctorId);
    }
  }

  onQueueUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('queue-updated', callback);
    }
  }

  onDoctorQueueUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('doctor-queue-updated', callback);
    }
  }

  offQueueUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('queue-updated', callback);
    }
  }

  offDoctorQueueUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('doctor-queue-updated', callback);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
