# Mingle Kerala - Backend Architecture

This directory contains the foundational backend code for **Mingle Kerala**, designed using **Next.js (App Router)**, **Prisma (PostgreSQL)**, and **Socket.io**.

Since the local environment did not have Node.js installed, this codebase acts as a blueprint. You can copy this folder to any environment with Node.js installed to run the backend API and real-time chat server.

## Architecture

1.  **Next.js API Routes (`src/app/api/...`)**
    *   Acts as the REST API for the frontend.
    *   Handles authentication, onboarding, discovering users, and saving preferences.
2.  **Prisma ORM (`prisma/schema.prisma`)**
    *   Defines the database schema for PostgreSQL.
    *   Manages relationships between Users, Interests, ChatSessions, Messages, and Reports.
3.  **Socket.io Server (`server.js`)**
    *   Runs as a separate Express server.
    *   Handles stateful WebSocket connections for real-time private messaging, online/offline status broadcasting, and typing indicators.

## Setup Instructions

Once you move this folder to an environment with Node.js (v18+ recommended):

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Create a `.env` file in the root of this folder and add your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/minglekerala?schema=public"
```

### 3. Initialize Prisma
Run the following command to push the schema to your database and generate the Prisma Client:
```bash
npm run db:push
```
*Optional: You can view your database tables visually by running `npm run db:studio`.*

### 4. Run the Servers

You will need to run both the Next.js API server and the WebSocket server simultaneously.

**Terminal 1 (Next.js API):**
```bash
npm run dev
```
*(Runs on http://localhost:3000)*

**Terminal 2 (WebSocket Server):**
```bash
npm run socket
```
*(Runs on http://localhost:3001)*

## Connecting the Frontend

To connect the HTML/JS frontend prototype to this backend:

1.  **API Calls:** Update the mock JavaScript functions (like `window.checkAuth` and `window.generateUsername` in `utils.js`) to make `fetch()` POST requests to `http://localhost:3000/api/auth`.
2.  **WebSockets:** In `chat.html`, include the Socket.io client script (`<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>`) and connect it to `http://localhost:3001`. Replace the simulated `simulateResponse()` logic with real socket events (`socket.emit('private_message', ...)` and `socket.on('new_message', ...)`).
# mingle-kerala
