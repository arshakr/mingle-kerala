/* ============================================================
   MINGLE KERALA — Express + Socket.io Backend
   ============================================================ */

'use strict';

const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');

const app    = express();
const server = http.createServer(app);

/* ── CORS Configuration ──────────────────────────────────── */
const ALLOWED_ORIGINS = [
  'https://arshakr.github.io',    // GitHub Pages production
  'http://localhost:3000',          // Local dev
  'http://localhost:5500',          // VS Code Live Server
  'http://127.0.0.1:5500',          // VS Code Live Server (alt)
  'http://localhost:8080',          // Any local HTTP server
  'http://127.0.0.1:8080',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

/* ── Socket.io Server ────────────────────────────────────── */
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

/* ── In-memory state ─────────────────────────────────────── */
// Maps userId -> socket.id
const activeUsers = new Map();
// Maps userId -> { district, interests, gender } (optional extra data)
const userMeta    = new Map();

/* ── Socket.io Events ────────────────────────────────────── */
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  /* Register user */
  socket.on('register_user', (userId, meta = {}) => {
    if (!userId || typeof userId !== 'string') return;

    activeUsers.set(userId, socket.id);
    userMeta.set(userId, meta);
    socket.userId = userId;

    console.log(`[Socket] User registered: ${userId} (${socket.id})`);

    // Broadcast online status to everyone else
    socket.broadcast.emit('user_status_change', {
      userId,
      status: 'online',
      district: meta.district || null,
    });

    // Send current online count to newly connected user
    socket.emit('online_count', { count: activeUsers.size });
  });

  /* Private message */
  socket.on('private_message', ({ toUserId, text, sessionId }) => {
    if (!toUserId || !text || typeof text !== 'string') return;
    if (text.length > 2000) return; // max message length

    const toSocketId = activeUsers.get(toUserId);
    if (toSocketId) {
      io.to(toSocketId).emit('new_message', {
        senderId:  socket.userId,
        sessionId: sessionId || null,
        text:      text.trim(),
        timestamp: new Date().toISOString(),
      });
    }
    // If user is offline, we just silently drop (no persistence in free tier)
  });

  /* Typing indicator */
  socket.on('typing', ({ toUserId }) => {
    if (!toUserId) return;
    const toSocketId = activeUsers.get(toUserId);
    if (toSocketId) {
      io.to(toSocketId).emit('user_typing', {
        senderId: socket.userId,
      });
    }
  });

  /* Read receipt */
  socket.on('message_read', ({ toUserId, sessionId }) => {
    const toSocketId = activeUsers.get(toUserId);
    if (toSocketId) {
      io.to(toSocketId).emit('message_read_receipt', {
        sessionId,
        readBy: socket.userId,
      });
    }
  });

  /* Request online user list (for a district) */
  socket.on('get_online_users', ({ district } = {}) => {
    const onlineUsers = [];
    for (const [uid, sid] of activeUsers.entries()) {
      const meta = userMeta.get(uid) || {};
      if (!district || meta.district === district) {
        onlineUsers.push({ userId: uid, district: meta.district });
      }
    }
    socket.emit('online_users_list', { users: onlineUsers });
  });

  /* Disconnect */
  socket.on('disconnect', (reason) => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      userMeta.delete(socket.userId);

      io.emit('user_status_change', {
        userId: socket.userId,
        status: 'offline',
      });

      io.emit('online_count', { count: activeUsers.size });
      console.log(`[Socket] User disconnected: ${socket.userId} (${reason})`);
    }
  });
});

/* ── REST API Endpoints ──────────────────────────────────── */

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'Mingle Kerala Backend',
    version: '1.0.0',
    status: 'operational',
    onlineUsers: activeUsers.size,
    timestamp: new Date().toISOString(),
  });
});

// Health ping (for Render.com keepalive)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Online count endpoint
app.get('/api/online-count', (req, res) => {
  res.json({
    count: activeUsers.size,
    timestamp: new Date().toISOString(),
  });
});

// Optional: Prisma DB routes (uncomment when Neon.tech is connected)
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();
//
// app.post('/api/users', async (req, res) => {
//   const { generatedName, district, gender, interests } = req.body;
//   try {
//     const user = await prisma.user.create({
//       data: { generatedName, district, gender }
//     });
//     res.json(user);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

/* ── Start Server ────────────────────────────────────────── */
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║     Mingle Kerala Backend v1.0.0      ║
  ║   Socket.io + Express on port ${PORT}    ║
  ╚═══════════════════════════════════════╝
  `);
  console.log(`  🌊 Server running at: http://localhost:${PORT}`);
  console.log(`  📡 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔐 CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

/* ── Graceful shutdown ───────────────────────────────────── */
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received — shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});
