/* ============================================================
   MINGLE KERALA — Express + Socket.IO Backend
   ============================================================ */

'use strict';

require('dotenv').config();

const crypto = require('node:crypto');
const express = require('express');
const http = require('node:http');
const { Prisma, PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 3001);
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:8081').split(',')[0].trim().replace(/\/+$/, '');
const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];
const FRONTEND_ORIGINS = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)
  .map((origin) => new URL(origin.trim()).origin)
  .filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...LOCAL_ORIGINS, ...FRONTEND_ORIGINS])];
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DISTRICTS = new Set([
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
  'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
  'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod',
]);
const GENDERS = new Set(['Male', 'Female', 'Other']);
const INTERESTS = new Set([
  'Music', 'Movies', 'Food', 'Travel', 'Sports', 'Books',
  'Gaming', 'Art', 'Nature', 'Tech', 'Fashion', 'Cooking',
]);
const SESSION_COOKIE = 'mk_session';
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_LINK_LIFETIME_MS = 15 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const AUTH_SECRET = process.env.AUTH_SECRET || 'local-development-only-auth-secret';
const googleOAuthClient = new OAuth2Client();

function smtpConfiguration() {
  const port = Number(process.env.SMTP_PORT);
  if (!process.env.SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 ||
      !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_FROM) {
    return null;
  }
  return {
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };
}

app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));
app.use((_request, response, next) => {
  response.set({
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  });
  next();
});
app.use(express.json({ limit: '16kb' }));

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashIp(value) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(value).digest('hex');
}

function readCookie(request, name) {
  const cookieHeader = request.headers.cookie || '';
  for (const item of cookieHeader.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0 || item.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(item.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

function sessionCookie(value) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(SESSION_LIFETIME_MS / 1000)}${secure}`;
}

function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

function publicProfile(user) {
  return {
    id: user.id,
    name: user.generatedName,
    district: user.district,
    gender: user.gender,
    lang: user.language,
    online: user.isOnline,
    interests: user.interests.map(({ interest }) => interest.name),
    profileComplete: user.profileComplete,
    createdAt: user.createdAt,
  };
}

async function findSession(sessionToken) {
  if (!sessionToken || sessionToken.length > 256) return null;
  return prisma.authSession.findFirst({
    where: { tokenHash: hash(sessionToken), expiresAt: { gt: new Date() } },
    include: {
      user: { include: { interests: { include: { interest: true } } } },
    },
  });
}

async function requireSession(request, response, next) {
  try {
    const session = await findSession(readCookie(request, SESSION_COOKIE));
    if (!session) {
      response.status(401).json({ error: 'Please sign in to continue.' });
      return;
    }
    request.user = session.user;
    request.authSessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(request, response, next) {
  requireSession(request, response, (error) => {
    if (error) return next(error);
    if (!request.user.profileComplete) {
      response.status(403).json({ error: 'Complete your profile to continue.' });
      return;
    }
    next();
  });
}

function requireAllowedOrigin(request, response, next) {
  const origin = request.get('origin');
  if (!origin || !ALLOWED_ORIGINS.includes(origin.replace(/\/+$/, ''))) {
    response.status(403).json({ error: 'Request origin is not allowed.' });
    return;
  }
  next();
}

app.get('/', (_request, response) => {
  response.json({ service: 'Mingle Kerala API', status: 'operational' });
});

app.get('/health', async (_request, response, next) => {
  try {
    if (process.env.NODE_ENV === 'production') await prisma.$queryRaw`SELECT 1`;
    response.json({ status: 'ok', uptime: process.uptime() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/config', (_request, response) => {
  response.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    emailEnabled: Boolean(smtpConfiguration()),
  });
});

app.post('/api/auth/google', async (request, response, next) => {
  try {
    if (request.body.ageConfirmed !== true) {
      response.status(400).json({ error: 'You must confirm that you are at least 18 years old.' });
      return;
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      response.status(503).json({ error: 'Google sign-in is not configured yet. Please try again later.' });
      return;
    }
    if (process.env.NODE_ENV === 'production' && Buffer.byteLength(AUTH_SECRET) < 32) {
      response.status(503).json({ error: 'Sign-in is not configured yet. Please try again later.' });
      return;
    }
    if (typeof request.body.credential !== 'string' || request.body.credential.length > 8192) {
      response.status(400).json({ error: 'Google sign-in could not be verified. Please try again.' });
      return;
    }

    let identity;
    try {
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken: request.body.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      identity = ticket.getPayload();
    } catch {
      response.status(401).json({ error: 'Google sign-in could not be verified. Please try again.' });
      return;
    }
    if (!identity?.sub || !identity.email || identity.email_verified !== true ||
        !EMAIL_PATTERN.test(identity.email) || identity.email.length > 254) {
      response.status(401).json({ error: 'A verified Google email is required to sign in.' });
      return;
    }

    const now = new Date();
    const sessionToken = crypto.randomBytes(32).toString('base64url');
    const result = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.upsert({
        where: { email: identity.email.toLowerCase() },
        update: { emailVerifiedAt: now, ageConfirmedAt: now, lastSeen: now },
        create: {
          email: identity.email.toLowerCase(),
          emailVerifiedAt: now,
          ageConfirmedAt: now,
          generatedName: `NewMember${crypto.randomBytes(6).toString('hex')}`,
        },
      });
      const session = await transaction.authSession.create({
        data: {
          tokenHash: hash(sessionToken),
          userId: user.id,
          expiresAt: new Date(now.getTime() + SESSION_LIFETIME_MS),
        },
      });
      return { session, user };
    });

    response.setHeader('Set-Cookie', sessionCookie(sessionToken));
    response.json({ user: publicProfile({ ...result.user, interests: [] }) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/link', async (request, response, next) => {
  try {
    if (typeof request.body.email !== 'string' || !EMAIL_PATTERN.test(request.body.email.trim()) || request.body.email.trim().length > 254) {
      response.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }
    if (request.body.ageConfirmed !== true) {
      response.status(400).json({ error: 'You must confirm that you are at least 18 years old.' });
      return;
    }
    const smtpOptions = smtpConfiguration();
    if (!smtpOptions) {
      response.status(503).json({ error: 'Email sign-in is not configured yet. Please try again later.' });
      return;
    }
    if (process.env.NODE_ENV === 'production' && Buffer.byteLength(AUTH_SECRET) < 32) {
      response.status(503).json({ error: 'Email sign-in is not configured yet. Please try again later.' });
      return;
    }

    const email = request.body.email.trim().toLowerCase();
    const now = new Date();
    const cutoff = new Date(now.getTime() - RATE_WINDOW_MS);
    const ipHash = hashIp(request.ip || 'unknown');
    const [emailRequests, ipRequests] = await Promise.all([
      prisma.emailLoginLink.count({ where: { email, createdAt: { gte: cutoff } } }),
      prisma.emailLoginLink.count({ where: { ipHash, createdAt: { gte: cutoff } } }),
    ]);
    if (emailRequests >= 3 || ipRequests >= 10) {
      response.status(429).json({ error: 'Too many sign-in links requested. Please try again later.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + LOGIN_LINK_LIFETIME_MS);
    await prisma.emailLoginLink.create({
      data: { email, tokenHash: hash(token), ipHash, ageConfirmedAt: now, expiresAt },
    });

    const verificationUrl = `${FRONTEND_URL}/verify.html#token=${encodeURIComponent(token)}`;
    try {
      const transporter = nodemailer.createTransport(smtpOptions);
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Your Mingle Kerala sign-in link',
        text: `Use this link to sign in to Mingle Kerala. It expires in 15 minutes and can only be used once:\n\n${verificationUrl}\n\nIf you did not request this link, you can ignore this email.`,
      });
    } catch (error) {
      await prisma.emailLoginLink.update({
        where: { tokenHash: hash(token) },
        data: { usedAt: now },
      });
      console.error(`[Auth] SMTP sign-in email failed (${error.code || error.name || 'unknown error'}).`);
      response.status(502).json({ error: 'Could not send the sign-in email. Please try again later.' });
      return;
    }
    response.status(202).json({ message: 'If the address can receive email, a sign-in link will arrive shortly.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/verify', async (request, response, next) => {
  try {
    const token = request.body.token;
    if (typeof token !== 'string' || token.length > 128) {
      response.status(400).json({ error: 'This sign-in link is invalid or expired. Request a new one.' });
      return;
    }
    const tokenHash = hash(token);
    const sessionToken = crypto.randomBytes(32).toString('base64url');
    const now = new Date();
    const session = await prisma.$transaction(async (transaction) => {
      const loginLink = await transaction.emailLoginLink.findFirst({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      });
      if (!loginLink) return null;

      const claimed = await transaction.emailLoginLink.updateMany({
        where: { id: loginLink.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) return null;

      const user = await transaction.user.upsert({
        where: { email: loginLink.email },
        update: { emailVerifiedAt: now, lastSeen: now },
        create: {
          email: loginLink.email,
          emailVerifiedAt: now,
          ageConfirmedAt: loginLink.ageConfirmedAt,
          generatedName: `NewMember${crypto.randomBytes(6).toString('hex')}`,
        },
      });
      return transaction.authSession.create({
        data: {
          tokenHash: hash(sessionToken),
          userId: user.id,
          expiresAt: new Date(now.getTime() + SESSION_LIFETIME_MS),
        },
      });
    });

    if (!session) {
      response.status(410).json({ error: 'This sign-in link has expired or was already used. Request a new one.' });
      return;
    }
    response.setHeader('Set-Cookie', sessionCookie(sessionToken));
    response.json({ redirect: `${FRONTEND_URL}/login.html?verified=1` });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', requireSession, (request, response) => {
  response.json({ user: publicProfile(request.user) });
});

app.post('/api/auth/logout', requireAllowedOrigin, async (request, response, next) => {
  try {
    const sessionToken = readCookie(request, SESSION_COOKIE);
    if (sessionToken) {
      await prisma.authSession.deleteMany({ where: { tokenHash: hash(sessionToken) } });
    }
    response.setHeader('Set-Cookie', clearSessionCookie());
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.put('/api/profile', requireSession, requireAllowedOrigin, async (request, response, next) => {
  try {
    const { name, district, gender, interests, language = 'en' } = request.body;
    if (typeof name !== 'string' || !/^[A-Za-z][A-Za-z0-9]{2,31}$/.test(name)) {
      response.status(400).json({ error: 'Choose a username with 3–32 letters or numbers.' });
      return;
    }
    if (typeof district !== 'string' || !DISTRICTS.has(district)) {
      response.status(400).json({ error: 'Choose a valid Kerala district.' });
      return;
    }
    if (typeof gender !== 'string' || !GENDERS.has(gender)) {
      response.status(400).json({ error: 'Choose a valid gender option.' });
      return;
    }
    if (!Array.isArray(interests) || interests.length < 1 || interests.length > 5 ||
        interests.some((interest) => typeof interest !== 'string' || !INTERESTS.has(interest)) ||
        new Set(interests).size !== interests.length) {
      response.status(400).json({ error: 'Choose between 1 and 5 valid interests.' });
      return;
    }
    if (typeof language !== 'string' || !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(language)) {
      response.status(400).json({ error: 'Choose a valid language.' });
      return;
    }

    const user = await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: request.user.id },
        data: {
          generatedName: name,
          district,
          gender,
          language,
          profileComplete: true,
          ageConfirmedAt: request.user.ageConfirmedAt || new Date(),
          isOnline: activeUsers.has(request.user.id),
          lastSeen: new Date(),
        },
      });
      await transaction.userInterest.deleteMany({ where: { userId: request.user.id } });
      for (const interestName of interests) {
        const interest = await transaction.interest.upsert({
          where: { name: interestName },
          update: {},
          create: { name: interestName },
        });
        await transaction.userInterest.create({
          data: { userId: request.user.id, interestId: interest.id },
        });
      }
      return transaction.user.findUnique({
        where: { id: request.user.id },
        include: { interests: { include: { interest: true } } },
      });
    });
    response.json({ user: publicProfile(user) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      response.status(409).json({ error: 'That username is already in use. Choose another one.' });
      return;
    }
    next(error);
  }
});

app.get('/api/users', requireAuth, async (request, response, next) => {
  try {
    const { district, gender, interest, onlineOnly } = request.query;
    const users = await prisma.user.findMany({
      where: {
        profileComplete: true,
        id: { not: request.user.id },
        ...(typeof district === 'string' && DISTRICTS.has(district) ? { district } : {}),
        ...(typeof gender === 'string' && GENDERS.has(gender) ? { gender } : {}),
        ...(onlineOnly === 'true' ? { isOnline: true } : {}),
        ...(typeof interest === 'string' && INTERESTS.has(interest)
          ? { interests: { some: { interest: { name: interest } } } }
          : {}),
      },
      take: 100,
      orderBy: [{ isOnline: 'desc' }, { lastSeen: 'desc' }],
      include: { interests: { include: { interest: true } } },
    });
    response.json({ users: users.map(publicProfile) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/profile', requireAuth, requireAllowedOrigin, async (request, response, next) => {
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.emailLoginLink.deleteMany({ where: { email: request.user.email } });
      await transaction.user.delete({ where: { id: request.user.id } });
    });
    response.setHeader('Set-Cookie', clearSessionCookie());
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/online-count', (_request, response) => {
  response.json({ count: activeUsers.size, timestamp: new Date().toISOString() });
});

const activeUsers = new Map();

function socketSessionToken(socket) {
  const cookieHeader = socket.handshake.headers.cookie || '';
  for (const item of cookieHeader.split(';')) {
    const separator = item.indexOf('=');
    if (separator >= 0 && item.slice(0, separator).trim() === SESSION_COOKIE) {
      try {
        return decodeURIComponent(item.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

io.use(async (socket, next) => {
  try {
    const session = await findSession(socketSessionToken(socket));
    if (!session || !session.user.profileComplete) {
      next(new Error('Authentication required'));
      return;
    }
    socket.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  const previous = activeUsers.get(user.id);
  activeUsers.set(user.id, socket.id);
  if (previous && previous !== socket.id) {
    io.sockets.sockets.get(previous)?.disconnect(true);
  }
  socket.join(`user:${user.id}`);
  prisma.user.update({
    where: { id: user.id },
    data: { isOnline: true, lastSeen: new Date() },
  }).catch((error) => console.error('[Socket] Could not update online status:', error));

  socket.emit('online_count', { count: activeUsers.size });
  socket.broadcast.emit('user_status_change', {
    userId: user.id,
    status: 'online',
    district: user.district,
  });
  io.emit('online_count', { count: activeUsers.size });

  socket.on('private_message', async (payload) => {
    try {
      if (!payload || typeof payload.toUserId !== 'string' ||
          typeof payload.text !== 'string' || !payload.text.trim() ||
          payload.text.length > 2000) return;
      const recipient = await prisma.user.findFirst({
        where: { id: payload.toUserId, profileComplete: true },
        select: { id: true },
      });
      if (!recipient) return;
      io.to(`user:${recipient.id}`).emit('new_message', {
        senderId: user.id,
        sessionId: null,
        text: payload.text.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Socket] Could not deliver private message:', error);
      socket.emit('message_error', { error: 'Message could not be delivered.' });
    }
  });

  socket.on('typing', (payload) => {
    if (typeof payload?.toUserId === 'string') {
      io.to(`user:${payload.toUserId}`).emit('user_typing', { senderId: user.id });
    }
  });

  socket.on('get_online_users', async (payload = {}) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          profileComplete: true,
          ...(typeof payload.district === 'string' && DISTRICTS.has(payload.district)
            ? { district: payload.district }
            : {}),
          id: { in: [...activeUsers.keys()] },
        },
        select: { id: true, district: true },
      });
      socket.emit('online_users_list', { users: users.map(({ id, district }) => ({ userId: id, district })) });
    } catch (error) {
      console.error('[Socket] Could not list online users:', error);
      socket.emit('server_error', { error: 'Online users could not be loaded.' });
    }
  });

  socket.on('disconnect', async (reason) => {
    if (activeUsers.get(user.id) !== socket.id) return;
    activeUsers.delete(user.id);
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: false, lastSeen: new Date() },
      });
      io.emit('user_status_change', { userId: user.id, status: 'offline' });
      io.emit('online_count', { count: activeUsers.size });
    } catch (error) {
      console.error('[Socket] Could not update offline status:', error);
    }
    console.log(`[Socket] User disconnected: ${user.id} (${reason})`);
  });
});

app.use((error, _request, response, _next) => {
  if (response.headersSent) return;
  if (error.message === 'Origin is not allowed by CORS') {
    response.status(403).json({ error: 'Origin is not allowed.' });
    return;
  }
  if (error.type === 'entity.parse.failed') {
    response.status(400).json({ error: 'Request body must contain valid JSON.' });
    return;
  }
  if (error.type === 'entity.too.large') {
    response.status(413).json({ error: 'Request body is too large.' });
    return;
  }
  console.error('[Server] Request failed:', error.code || error.name || 'UnknownError');
  response.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Mingle Kerala API listening on port ${PORT}`);
    console.log(`[Server] CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
  });

  const authCleanupTimer = setInterval(async () => {
    const now = new Date();
    try {
      await prisma.$transaction([
        prisma.emailLoginLink.deleteMany({ where: { expiresAt: { lt: now } } }),
        prisma.authSession.deleteMany({ where: { expiresAt: { lt: now } } }),
      ]);
    } catch (error) {
      console.error('[Auth] Could not remove expired sign-in records:', error.code || error.name);
    }
  }, 60 * 60 * 1000);
  authCleanupTimer.unref();

  async function shutdown(signal) {
    console.log(`[Server] ${signal} received; shutting down...`);
    io.close();
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, io, prisma, server };
