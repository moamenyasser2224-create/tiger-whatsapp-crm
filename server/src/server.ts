import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { initSocket } from './socket.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(env.PORT, () => {
  console.log(`🚀 WhatsApp & Workspace CRM Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`📡 Frontend URL allowed: ${env.FRONTEND_URL}`);
  console.log(`🔌 Socket.io Real-time engine ready on port ${env.PORT}`);
});

// Graceful Shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🔒 HTTP server closed.');
    await prisma.$disconnect();
    console.log('💾 Database disconnected.');
    process.exit(0);
  });

  // Force close if graceful shutdown takes longer than 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcefully terminating after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
