# Real-Time Chat Application

A responsive one-to-one messaging application built with React, Vite, Express, MongoDB, and Socket.IO. Users can create accounts, find other users, exchange messages in real time, and manage their profile and appearance.

## Features

- JWT-authenticated registration, login, session persistence, and logout
- Password hashing with bcryptjs and rate-limited authentication endpoints
- User search, one-to-one conversations, paginated message history, and message deletion
- Real-time messages, typing indicators, online presence, read receipts, and unread counts
- Profile editing with optional avatar upload
- Responsive desktop/mobile chat layout, light/dark themes, loading and error states
- Input validation, protected routes, conversation membership checks, and centralized API errors

## Tech Stack

- **Client:** React, Vite, JavaScript, Tailwind CSS, Axios, React Router, Socket.IO Client
- **Server:** Node.js, Express, Socket.IO, Mongoose, MongoDB, JWT, bcryptjs

## Project Structure

```text
.
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── .env.example
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── uploads/
│   └── .env.example
├── package.json
└── README.md
```

## Installation

Requirements: Node.js 20 or later, npm, and a MongoDB instance (local or hosted).

Install each package's dependencies from the repository root:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

The root package coordinates the two apps; it does not use npm workspaces, so the server and client dependencies are installed separately.

## Environment Variables

Create local environment files from the examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Configure `server/.env`:

```dotenv
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/real-time-chat
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

Set `JWT_SECRET` to a private random value of at least 32 characters. `CLIENT_URL` may contain comma-separated allowed origins.

Configure `client/.env` when using non-default URLs:

```dotenv
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

Never commit real `.env` files or secrets.

## MongoDB Setup

Start a local MongoDB server and use the example URI, or create a database on MongoDB Atlas and place its connection URI in `MONGO_URI`. Mongoose creates the collections and indexes when the server connects. The server exits with a clear startup error if MongoDB or the required JWT secret is unavailable.

## Run the Application

From the repository root, start both development servers:

```bash
npm run dev
```

The Vite client is available at `http://localhost:5173`; the API and Socket.IO server use `http://localhost:4000` by default.

Run either app independently:

```bash
npm run dev:server
npm run dev:client
```

Create a production client bundle with `npm run build`. Start the backend with `npm start` after configuring its environment.

## API Overview

All endpoints except registration and login require `Authorization: Bearer <token>` unless noted.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register; accepts multipart form data and optional `profilePicture` |
| POST | `/api/auth/login` | Authenticate with email or username and password |
| POST | `/api/auth/logout` | End the authenticated client session |
| GET | `/api/auth/me` | Return the current user |
| GET | `/api/users` | List users |
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/:id` | Get a user's public profile |
| PUT | `/api/users/profile` | Update profile and optional avatar |
| GET | `/api/conversations` | List the current user's conversations |
| POST | `/api/conversations` | Find or create a one-to-one conversation |
| GET | `/api/conversations/:id` | Get a conversation |
| GET | `/api/messages/:conversationId` | Load a page of conversation messages |
| POST | `/api/messages` | Persist and broadcast a message |
| PUT | `/api/messages/:id/read` | Mark a received message as read |
| DELETE | `/api/messages/:id` | Delete a message sent by the current user |

## How Socket.IO Works

Clients authenticate their socket handshake with the JWT. The server maps each authenticated user ID to their connected sockets, tracks presence and the active conversation, and checks conversation membership before joining rooms or relaying typing events. Messages are persisted through a shared service before being broadcast to the recipient; REST message submission uses the same service. Read state is persisted through the API and then announced to the conversation room.

Events include `presence:snapshot`, `user:online`, `user:offline`, `conversation:join`, `conversation:leave`, `message:send`, `message:receive`, `message:sent`, `typing:start`, `typing:stop`, `message:read`, `message:deleted`, and `unread:update`.

## Screenshots

Screenshots can be added here after capturing the application in desktop and mobile layouts.

## Future Improvements

- Automated API and browser end-to-end tests
- Multi-device session revocation and token refresh
- Image and file attachments in conversations
- Group conversations and message reactions
- Deployment configuration and hosted image storage

## Author

Maintained by the project owner.