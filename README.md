# 💬 Real-Time Chat App

A modern **real-time chat application** built with the MERN stack and Socket.IO. Users can create accounts, search for other users, start conversations, exchange messages in real time, manage their profiles, and delete messages.

## 🚀 Live Demo

**Live Application:**
https://real-time-chat-app-sepia-zeta.vercel.app

**GitHub Repository:**
https://github.com/codewithvijay01/real-time-chat-app

---

## ✨ Features

### 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Protected routes
- Persistent login session

### 💬 Real-Time Messaging

- Real-time one-to-one messaging using Socket.IO
- Instant message delivery
- Online user status
- Conversation history
- Automatic chat updates

### 👤 User Profile

- Update username and profile information
- Upload profile picture
- Remove profile picture
- Circular avatar display
- User initials fallback when no profile picture is available

### 🗑️ Message Management

- Delete message for yourself
- Delete message for everyone
- Deleted messages are handled separately for each participant
- Conversation previews respect deleted messages

### 📱 Responsive Design

- Desktop-friendly chat interface
- Mobile-responsive layout
- Mobile conversation sidebar
- Full-screen mobile chat experience
- Responsive authentication and profile pages

### 🎨 UI

- Clean modern interface
- Light/Dark theme support
- Responsive layout
- Smooth transitions and animations

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Socket.IO Client
- Lucide React
- CSS

### Backend

- Node.js
- Express.js
- Socket.IO
- JWT
- Multer
- bcrypt

### Database

- MongoDB
- Mongoose

### Deployment

- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

---

## 📂 Project Structure

```text
real-time-chat-app/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── styles.css
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── package.json
└── README.md
```

---

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/codewithvijay01/real-time-chat-app.git
cd real-time-chat-app
```

### 2. Install dependencies

```bash
npm install
npm --prefix client install
npm --prefix server install
```

### 3. Configure environment variables

Create:

```text
server/.env
```

Example:

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5176
```

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

> Never commit your `.env` files or secret keys to GitHub.

### 4. Start the application

From the project root:

```bash
npm run dev
```

The frontend will run on:

```text
http://localhost:5176
```

The backend will run on:

```text
http://localhost:4000
```

---

## 🌐 Deployment

The application is deployed using:

```text
Frontend  → Vercel
Backend   → Render
Database  → MongoDB Atlas
```

Environment variables must be configured separately on Vercel and Render.

---

## 🔄 Real-Time Architecture

```text
React Client
     │
     │ HTTP / Axios
     ▼
Express API ─────────► MongoDB Atlas
     │
     │ Socket.IO
     ▼
Real-Time Messaging
     │
     ▼
Other Connected Client
```

---

## 🔒 Security

- Passwords are hashed before storage
- JWT authentication is used for protected requests
- Password fields are excluded from public user responses
- Environment variables are used for sensitive configuration
- Authentication-protected API routes

---

## 📱 Mobile Experience

The application is fully responsive for mobile devices.

On mobile:

```text
Conversation List
       ↓
Tap User
       ↓
Full-Screen Chat
       ↓
Back
       ↓
Conversation List
```

---

## 🎯 Future Improvements

Possible future improvements include:

- Group conversations
- Typing indicators
- Message reactions
- Image/file sharing
- Read receipts
- Push notifications
- Voice/video calling
- Message search
- Emoji picker

---

## 👨‍💻 Author

**Vijay Kumar**

GitHub:
https://github.com/codewithvijay01

---

## 📄 License

This project is available for educational and personal use.

---

⭐ If you find this project useful, consider giving the repository a star.
