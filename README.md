# Instagram Clone — TechPrysm Evaluation Project

A full-stack Instagram-style social media application built using **React**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB**, **Cloudinary**, and **Socket.IO**.

The project demonstrates authentication, media uploads, social interactions, real-time updates, and responsive UI while following a scalable backend architecture.

---

# Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* React Router
* Axios
* Socket.IO Client

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Express Validator
* Multer
* Cloudinary
* Socket.IO

---

# Architecture

```text
React (Vite) ── axios / Socket.IO ──► Express API ──► MongoDB
                                          │
                                          ├── Cloudinary (Media Storage)
                                          └── Socket.IO Server
```

---

# Project Structure

## Backend

```text
backend/
│
├── config/          # Database & Cloudinary configuration
├── controllers/     # Business logic
├── middlewares/     # Authentication & error handling
├── models/          # Mongoose schemas
├── routes/          # API routes
├── socket/          # Socket.IO event handlers
├── utils/           # Helper utilities
├── validators/      # express-validator rules
└── server.js
```

## Frontend

```text
frontend/src/
│
├── components/      # Reusable UI
├── contexts/        # Auth context
├── hooks/           # Custom hooks
├── layouts/         # Shared layouts
├── pages/           # Route pages
├── services/        # Axios instance
└── main.jsx
```

---

# Features

## Authentication

* User Registration
* User Login
* Secure Logout
* JWT Authentication
* httpOnly Cookie Authentication
* Protected Routes
* Current User Endpoint

---

## User Profiles

* View Profile
* Edit Profile
* Upload Avatar
* Public / Private Accounts
* Bio & Profile Information

---

## Follow System

* Follow Users
* Unfollow Users
* Follow Requests
* Accept Requests
* Reject Requests
* Private Account Support

---

## Media Uploads

* Cloudinary Integration
* Image Uploads
* Video Uploads
* Optimized Media Delivery

---

## Posts

* Create Post
* Edit Post
* Delete Post
* View User Posts
* Image Posts
* Video Posts

---

## Likes

* Like Posts
* Unlike Posts
* Live Like Count

---

## Comments

* Add Comments
* Delete Comments
* View Comments

---

## Replies

* Reply to Comments
* Like Replies
* Threaded Conversations

---

## Stories

* Upload Stories
* View Stories
* Automatic Expiry (10 Minutes)
* Soft Delete
* Scheduled Cleanup

---

## Feed

* Personalized Feed
* Posts from Followed Users
* Latest Content First

---

## Real-Time Features

Implemented using **Socket.IO**

* Instant Likes
* Live Comments
* Story Updates
* Follow Request Notifications
* Follow Acceptance Notifications
* Feed Updates

---

## Frontend

* Responsive Design
* Mobile Friendly
* Loading States
* Error States
* Empty States
* Modern Instagram-inspired UI

---

# Local Setup

## Backend

```bash
cd backend
cp .env.example .env

# Fill in
# MONGO_URI
# JWT_SECRET
# CLOUDINARY_CLOUD_NAME
# CLOUDINARY_API_KEY
# CLOUDINARY_API_SECRET

npm install
npm run dev
```

Runs on:

```
http://localhost:5000
```

---

## Frontend

```bash
cd frontend
cp .env.example .env

npm install
npm run dev
```

Runs on:

```
http://localhost:5173
```

---

# API Endpoints

## Authentication

| Method | Endpoint           | Access  |
| ------ | ------------------ | ------- |
| POST   | /api/auth/register | Public  |
| POST   | /api/auth/login    | Public  |
| POST   | /api/auth/logout   | Private |
| GET    | /api/auth/me       | Private |

---

## User

| Method | Endpoint             |
| ------ | -------------------- |
| GET    | /api/users/:username |
| PUT    | /api/users/profile   |
| PUT    | /api/users/avatar    |

---

## Follow

| Method | Endpoint                      |
| ------ | ----------------------------- |
| POST   | /api/users/:id/follow         |
| DELETE | /api/users/:id/unfollow       |
| POST   | /api/users/:id/request/accept |
| POST   | /api/users/:id/request/reject |

---

## Posts

| Method | Endpoint       |
| ------ | -------------- |
| POST   | /api/posts     |
| GET    | /api/posts/:id |
| PUT    | /api/posts/:id |
| DELETE | /api/posts/:id |

---

## Likes

| Method | Endpoint            |
| ------ | ------------------- |
| POST   | /api/posts/:id/like |
| DELETE | /api/posts/:id/like |

---

## Comments

| Method | Endpoint                |
| ------ | ----------------------- |
| POST   | /api/posts/:id/comments |
| DELETE | /api/comments/:id       |

---

## Stories

| Method | Endpoint         |
| ------ | ---------------- |
| POST   | /api/stories     |
| GET    | /api/stories     |
| DELETE | /api/stories/:id |

---

# Progress

* [x] Step 1 — Requirements & Planning
* [x] Step 2 — Architecture
* [x] Step 3 — Project Setup
* [x] Step 4 — Authentication
* [x] Step 5 — User Profiles
* [x] Step 6 — Follow System
* [x] Step 7 — Cloudinary Integration
* [x] Step 8 — Posts
* [x] Step 9 — Likes
* [x] Step 10 — Comments
* [x] Step 11 — Replies & Comment Likes
* [x] Step 12 — Stories
* [x] Step 13 — Feed
* [x] Step 14 — Socket.IO Real-Time Features
* [x] Step 15 — Frontend Polish
* [ ] Step 16 — Deployment
* [ ] Step 17 — Final README
* [ ] Bonus — Direct Messaging

---

# Security

* Password hashing with bcrypt
* JWT Authentication
* httpOnly Cookies
* Request Validation
* Protected API Routes
* Cloudinary-secured media uploads

---

# Deployment

To be added after deployment.

* Frontend
* Backend
* MongoDB Atlas

---

# Demo Credentials

To be added before submission.

---

# Future Improvements

* Direct Messaging
* Notifications Center
* Infinite Scrolling
* Saved Posts
* Search Users
* Explore Page
* Hashtags
* Video Reels
* Push Notifications
