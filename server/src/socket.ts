import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';

let io: Server | null = null;

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      userId: string;
      email: string;
    };
  };
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Accept requests from any origin or configured frontend
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Handshake JWT Authentication Middleware
  io.use((socket, next) => {
    try {
      let token: string | undefined = socket.handshake.auth?.token;

      // Also check query param
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token as string;
      }

      // Also check cookie if passed
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of cookies) {
          const [name, val] = cookie.trim().split('=');
          if (name === 'accessToken') {
            token = decodeURIComponent(val);
            break;
          }
        }
      }

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        userId: string;
        email: string;
      };

      socket.data.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    // console.log(`🔌 Client connected via Socket.io: ${socket.data.user.email} (${socket.id})`);

    socket.on('disconnect', () => {
      // console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

/**
 * Broadcast real-time attendance update to all connected team members
 */
export function broadcastAttendanceUpdate(data: any): void {
  if (io) {
    io.emit('attendance_update', data);
  }
}

/**
 * Broadcast real-time chat message to all connected team members
 */
export function broadcastChatMessage(message: any): void {
  if (io) {
    io.emit('new_message', message);
  }
}
