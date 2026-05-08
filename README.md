# TaskFlow

A modern, high-performance Kanban  built for real-time collaboration.

## Features

- **Secure Authentication**: JWT-based authentication with httpOnly cookies and password hashing using bcryptjs.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Admins and Members.
- **Kanban Board**: Drag-and-drop task management powered by `@hello-pangea/dnd`.
- **Real-Time Updates**: Instant synchronization across clients using Socket.io.
- **Admin Panel**: Full user management suite (activate/deactivate users, assign roles).
- **Password Recovery**: Secure password reset flow via email.
- **UI/UX Polish**: Responsive design with Tailwind CSS and smooth animations using Framer Motion.

## Tech Stack

### Frontend
- **React 18** & **Vite** (Next-gen build tooling)
- **Tailwind CSS** (Utility-first styling)
- **Framer Motion** (Layout animations)
- **Lucide React** (Beautifully simple icons)
- **React Hot Toast** (Elegant notifications)

### Backend
- **Node.js** & **Express**
- **MongoDB** with **Mongoose** (ODM)
- **Socket.io** (WebSockets for real-time)
- **JWT** (Authentication)

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance

### Backend Setup
1. Navigate to the server directory (if separate) or root:
   ```bash
   # Install dependencies
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your MONGODB_URI and JWT_SECRET
   ```
3. Start the server:
   ```bash
   # Development
   npm run dev
   # Production
   npm start
   ```

### Frontend Setup
1. From the root directory:
   ```bash
   npm run dev
   ```
2. Open your browser at `http://localhost:3000`.

---

## Deployment

- **Frontend**: Easily deploy to **Vercel** or **Netlify**. Ensure `VITE_API_URL` is set in environment variables.
- **Backend**: Deploy to **Railway**, **Render**, or **Cloud Run**.
- **Database**: Use **MongoDB Atlas** for a scalable cloud database.

---

## Live Demo
[Link to your live demo placeholder]

## Demo Video
[Link to your demo video placeholder]
