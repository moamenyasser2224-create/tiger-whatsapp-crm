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
    // Join personal user room for direct notifications
    const userId = socket.data.user.userId;
    socket.join(`user:${userId}`);

    // Join channel room
    socket.on('join_channel', (channelId: string) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('leave_channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('disconnect', () => {
      // client disconnected
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
 * Broadcast real-time chat message to all connected team members or channel
 */
export function broadcastChatMessage(message: any): void {
  if (io) {
    if (message.channelId) {
      io.to(`channel:${message.channelId}`).emit('channel_message', message);
    }
    io.emit('new_message', message);
  }
}

/**
 * Emit real-time notification to a specific user
 */
export function emitNotification(userId: string, notification: any): void {
  if (io) {
    io.to(`user:${userId}`).emit('new_notification', notification);
  }
}
