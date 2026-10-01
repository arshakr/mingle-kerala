'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Module = require('node:module');
const { after, before, test } = require('node:test');

const database = {
  links: [],
  sessions: [],
  users: [],
  interests: [],
};

function matches(row, where = {}) {
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'interests') return true;
    if (key === 'expiresAt' || key === 'createdAt') {
      if (expected.gt) return row[key] > expected.gt;
      if (expected.gte) return row[key] >= expected.gte;
      return true;
    }
    if (key === 'id' && expected.not) return row.id !== expected.not;
    if (key === 'id' && expected.in) return expected.in.includes(row.id);
    return row[key] === expected;
  });
}

function makePrisma() {
  return {
    emailLoginLink: {
      count: async ({ where }) => database.links.filter((row) => matches(row, where)).length,
      create: async ({ data }) => {
        const link = { id: crypto.randomUUID(), createdAt: new Date(), usedAt: null, ...data };
        database.links.push(link);
        return link;
      },
      findFirst: async ({ where }) => database.links.find((row) => matches(row, where)) || null,
      update: async ({ where, data }) => {
        const link = database.links.find((row) => matches(row, where));
        Object.assign(link, data);
        return link;
      },
      deleteMany: async ({ where }) => {
        const previous = database.links.length;
        database.links = database.links.filter((row) => !matches(row, where));
        return { count: previous - database.links.length };
      },
      updateMany: async ({ where, data }) => {
        const links = database.links.filter((row) => matches(row, where));
        links.forEach((link) => Object.assign(link, data));
        return { count: links.length };
      },
    },
    authSession: {
      create: async ({ data }) => {
        const session = { id: crypto.randomUUID(), createdAt: new Date(), ...data };
        database.sessions.push(session);
        return session;
      },
      findFirst: async ({ where }) => {
        const session = database.sessions.find((row) => matches(row, where));
        if (!session) return null;
        const user = database.users.find((row) => row.id === session.userId);
        return user ? { ...session, user } : null;
      },
      deleteMany: async ({ where }) => {
        const previous = database.sessions.length;
        database.sessions = database.sessions.filter((row) => !matches(row, where));
        return { count: previous - database.sessions.length };
      },
    },
    user: {
      upsert: async ({ where, update, create }) => {
        let user = database.users.find((row) => row.email === where.email);
        if (user) Object.assign(user, update);
        else {
          user = {
            id: crypto.randomUUID(),
            createdAt: new Date(),
            interests: [],
            profileComplete: false,
            isOnline: false,
            ...create,
          };
          database.users.push(user);
        }
        return user;
      },
      findUnique: async ({ where }) => database.users.find((row) => row.id === where.id) || null,
      findFirst: async ({ where }) => database.users.find((row) => matches(row, where)) || null,
      findMany: async ({ where, orderBy, take }) => {
        let users = database.users.filter((user) => {
          if (!matches(user, where)) return false;
          if (where.interests?.some?.interest?.name &&
              !user.interests.some(({ interest }) => interest.name === where.interests.some.interest.name)) return false;
          return true;
        });
        for (const order of [...orderBy].reverse()) {
          const [key, direction] = Object.entries(order)[0];
          users.sort((a, b) => direction === 'desc'
            ? Number(b[key]) - Number(a[key])
            : Number(a[key]) - Number(b[key]));
        }
        return users.slice(0, take);
      },
      update: async ({ where, data }) => {
        const user = database.users.find((row) => row.id === where.id);
        Object.assign(user, data);
        return user;
      },
      delete: async ({ where }) => {
        const index = database.users.findIndex((row) => row.id === where.id);
        const [user] = database.users.splice(index, 1);
        database.sessions = database.sessions.filter((session) => session.userId !== where.id);
        return user;
      },
    },
    userInterest: {
      deleteMany: async ({ where }) => {
        const user = database.users.find((row) => row.id === where.userId);
        if (user) user.interests = [];
        return { count: 0 };
      },
      create: async ({ data }) => {
        const user = database.users.find((row) => row.id === data.userId);
        const interest = database.interests.find((row) => row.id === data.interestId);
        user.interests.push({ userId: user.id, interestId: interest.id, interest });
        return user.interests.at(-1);
      },
    },
    interest: {
      upsert: async ({ where, create }) => {
        let interest = database.interests.find((row) => row.name === where.name);
        if (!interest) {
          interest = { id: crypto.randomUUID(), ...create };
          database.interests.push(interest);
        }
        return interest;
      },
    },
    $transaction: async (action) => action(makePrisma()),
    $disconnect: async () => {},
  };
}

let server;
let baseUrl;
let emailPayload;
const originalFetch = global.fetch;

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.EMAIL_FROM = 'Mingle Kerala <signin@example.test>';
  process.env.FRONTEND_URL = 'http://localhost:8081';
  process.env.AUTH_SECRET = 'test-auth-secret-longer-than-32-bytes';

  const originalLoad = Module._load;
  Module._load = function(request, parent, isMain) {
    if (request === '@prisma/client') {
      return { PrismaClient: function PrismaClient() { return makePrisma(); }, Prisma: {} };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    ({ server } = require('../server'));
  } finally {
    Module._load = originalLoad;
  }

  global.fetch = async (url, options) => {
    if (url !== 'https://api.resend.com/emails') return originalFetch(url, options);
    emailPayload = JSON.parse(options.body);
    return new Response(null, { status: 200 });
  };

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  global.fetch = originalFetch;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('email sign-in links are age gated, single use, and issue an HttpOnly session', async () => {
  const protectedDiscovery = await fetch(`${baseUrl}/api/users`);
  assert.equal(protectedDiscovery.status, 401);

  const missingAge = await fetch(`${baseUrl}/api/auth/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'member@example.test' }),
  });
  assert.equal(missingAge.status, 400);

  const sent = await fetch(`${baseUrl}/api/auth/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'Member@example.test', ageConfirmed: true }),
  });
  assert.equal(sent.status, 202);
  assert.match((await sent.json()).message, /sign-in link will arrive/i);
  assert.deepEqual(emailPayload.to, ['member@example.test']);
  assert.doesNotMatch(JSON.stringify(database.links), /token=[A-Za-z0-9_-]{30,}/);

  const token = emailPayload.text.match(/verify\.html#token=([A-Za-z0-9_-]{40,64})/)[1];
  assert.match(emailPayload.text, /verify\.html#token=/);
  assert.doesNotMatch(emailPayload.text, /\/api\/auth\/verify\?token=/);
  const scannerPreview = await fetch(`${baseUrl}/api/auth/verify?token=${token}`);
  assert.equal(scannerPreview.status, 404);
  assert.equal(database.links[0].usedAt, null);

  const verified = await fetch(`${baseUrl}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8081' },
    body: JSON.stringify({ token }),
    redirect: 'manual',
  });
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).redirect, 'http://localhost:8081/login.html?verified=1');
  const cookie = verified.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.doesNotMatch(cookie, /Secure/);
  globalThis.__testSessionCookie = cookie.split(';')[0];
  assert.notEqual(cookie.split(';')[0].slice('mk_session='.length), database.sessions[0].tokenHash);

  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie.split(';')[0] } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.profileComplete, false);

  const replay = await fetch(`${baseUrl}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8081' },
    body: JSON.stringify({ token }),
  });
  assert.equal(replay.status, 410);
});

test('failed email delivery invalidates the pending token and reports a provider error', async () => {
  const workingFetch = global.fetch;
  global.fetch = async (url, options) => {
    if (url === 'https://api.resend.com/emails') return new Response(null, { status: 503 });
    return originalFetch(url, options);
  };
  try {
    const response = await fetch(`${baseUrl}/api/auth/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'delivery-failed@example.test', ageConfirmed: true }),
    });
    assert.equal(response.status, 502);
    const link = database.links.find((row) => row.email === 'delivery-failed@example.test');
    assert.ok(link.usedAt);
  } finally {
    global.fetch = workingFetch;
  }
});

test('profiles persist, validate input, and are discoverable only after completion', async () => {
  const verifiedCookie = globalThis.__testSessionCookie;
  assert.ok(verifiedCookie);

  const invalid = await fetch(`${baseUrl}/api/profile`, {
    method: 'PUT',
    headers: {
      Cookie: verifiedCookie,
      Origin: 'http://localhost:8081',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Name123', district: 'Not Kerala', gender: 'Other', interests: ['Music'] }),
  });
  assert.equal(invalid.status, 400);

  const saved = await fetch(`${baseUrl}/api/profile`, {
    method: 'PUT',
    headers: {
      Cookie: verifiedCookie,
      Origin: 'http://localhost:8081',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'MistyRiver4821',
      district: 'Kozhikode',
      gender: 'Other',
      interests: ['Music', 'Travel'],
      language: 'en',
    }),
  });
  assert.equal(saved.status, 200);
  const ownProfile = (await saved.json()).user;
  assert.equal(ownProfile.name, 'MistyRiver4821');
  assert.deepEqual(ownProfile.interests, ['Music', 'Travel']);
  assert.equal(ownProfile.profileComplete, true);
  assert.equal('email' in ownProfile, false);

  database.users.push({
    id: 'peer-user',
    email: 'peer@example.test',
    generatedName: 'CalmTide9901',
    district: 'Kozhikode',
    gender: 'Female',
    language: 'en',
    profileComplete: true,
    isOnline: false,
    interests: [],
    createdAt: new Date(),
  });
  const discovered = await fetch(`${baseUrl}/api/users?district=Kozhikode`, {
    headers: { Cookie: verifiedCookie },
  });
  assert.equal(discovered.status, 200);
  const profiles = (await discovered.json()).users;
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].id, 'peer-user');
});

test('profile writes enforce same-origin requests and sessions can be revoked', async () => {
  const storedSession = database.sessions[0];
  assert.ok(storedSession);
  const user = database.users.find((row) => row.id === storedSession.userId);
  assert.ok(user.profileComplete);

  const sessionCookie = globalThis.__testSessionCookie;
  const csrf = await fetch(`${baseUrl}/api/profile`, {
    method: 'PUT',
    headers: {
      Cookie: sessionCookie,
      Origin: 'https://attacker.example',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'NewName123', district: 'Kozhikode', gender: 'Other', interests: ['Music'] }),
  });
  assert.equal(csrf.status, 403);

  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: sessionCookie, Origin: 'http://localhost:8081' },
  });
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  const afterLogout = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: sessionCookie } });
  assert.equal(afterLogout.status, 401);

  const signInAgain = await fetch(`${baseUrl}/api/auth/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'member@example.test', ageConfirmed: true }),
  });
  assert.equal(signInAgain.status, 202);
  const token = emailPayload.text.match(/verify\.html#token=([A-Za-z0-9_-]{40,64})/)[1];
  const signedIn = await fetch(`${baseUrl}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8081' },
    body: JSON.stringify({ token }),
  });
  assert.equal(signedIn.status, 200);
  const accountCookie = signedIn.headers.get('set-cookie').split(';')[0];

  const deleted = await fetch(`${baseUrl}/api/profile`, {
    method: 'DELETE',
    headers: { Cookie: accountCookie, Origin: 'http://localhost:8081' },
  });
  assert.equal(deleted.status, 204);
  assert.match(deleted.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal(database.users.some((row) => row.email === 'member@example.test'), false);
  assert.equal(database.sessions.some((row) => row.userId === user.id), false);
  assert.equal(database.links.some((row) => row.email === 'member@example.test'), false);
});
