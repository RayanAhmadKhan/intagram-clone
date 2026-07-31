# Instagram Clone 📸

A full-stack Instagram-inspired social media application built with **React, Node.js, Express, MongoDB, Cloudinary, and Socket.IO**. The application provides a modern social networking experience with secure authentication, media sharing, real-time interactions, private accounts, and responsive design.

---

## 🚀 Features

### 🔐 Authentication

* User Registration
* Secure Login & Logout
* JWT Authentication
* HTTP-only Cookie Authentication
* Protected Routes
* Current User Session

### 👤 User Profiles

* Public & Private Profiles
* Edit Profile Information
* Upload Profile Picture
* Bio Management
* Followers & Following Lists

### 🤝 Follow System

* Follow / Unfollow Users
* Follow Requests
* Accept or Reject Requests
* Private Account Support

### 📝 Posts

* Create Posts
* Edit Posts
* Delete Posts
* Image & Video Uploads
* View User Posts

### ❤️ Likes

* Like & Unlike Posts
* Live Like Count Updates

### 💬 Comments & Replies

* Add Comments
* Delete Comments
* Reply to Comments
* Like Replies
* Threaded Conversations

### 📖 Stories

* Upload Stories
* View Stories
* Automatic Expiry after 10 Minutes
* Soft Delete
* Scheduled Cleanup

### 📰 Personalized Feed

* Feed from Followed Users
* Latest Posts First
* Private Account Visibility Rules

### ⚡ Real-Time Features

Powered by **Socket.IO**

* Instant Like Updates
* Live Comments
* Story Updates
* Follow Request Notifications
* Follow Acceptance Notifications
* Feed Synchronization

### 📱 Responsive UI

* Mobile Friendly
* Tablet Support
* Desktop Support
* Loading States
* Error Handling
* Empty States
* Instagram-inspired Design

---

# 🛠 Tech Stack

## Frontend

* React (Vite)
* Tailwind CSS
* React Router
* Axios
* Socket.IO Client

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* Express Validator
* Multer
* Cloudinary
* Socket.IO

---

# 🏗 Architecture

```
                React (Vite)
                      │
          Axios & Socket.IO Client
                      │
                      ▼
              Express REST API
                      │
      ┌───────────────┴───────────────┐
      │                               │
 MongoDB Atlas                 Cloudinary
(Database Storage)           (Media Storage)
      │
      ▼
 Socket.IO Server
(Real-Time Communication)
```

---

# 📂 Project Structure

```
instagram-clone/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── utils/
│   ├── validators/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

# 🔒 Security

* Password Hashing using **bcrypt**
* JWT Authentication
* HTTP-only Cookies
* Protected Routes
* Input Validation with Express Validator
* Secure Media Uploads
* Authentication Middleware
* Error Handling Middleware

---

# ☁️ Media Storage

All images and videos are uploaded to **Cloudinary**, providing:

* Secure Cloud Storage
* Optimized Image Delivery
* Video Support
* Automatic CDN Distribution

---

# ⚡ Real-Time Communication

Socket.IO enables instant updates throughout the application including:

* Likes
* Comments
* Stories
* Follow Requests
* Follow Acceptances
* Feed Updates

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/your-username/instagram-clone.git

cd instagram-clone
```

---

## Backend Setup

```bash
cd backend

npm install

cp .env.example .env
```

```env

CLIENT_URL= https://intagram-clone-zeta.vercel.app
```

Run the server:

```bash
npm run dev
```

Backend:
headover to .env.example for env details

```
link : https://intagram-clone-tje9.onrender.com
```

---

## Frontend Setup

```bash
cd frontend

npm install

headover to .env.example for env details

```



Run:

```bash
npm run dev
```

Frontend:

```
link: https://intagram-clone-zeta.vercel.app

```

---

# 🌐 API Overview

## Authentication

* Register
* Login
* Logout
* Get Current User

## Users

* View Profile
* Update Profile
* Upload Avatar

## Follow System

* Follow User
* Unfollow User
* Accept Request
* Reject Request

## Posts

* Create Post
* Update Post
* Delete Post
* Get Post

## Comments

* Add Comment
* Delete Comment
* Reply to Comment

## Stories

* Upload Story
* View Stories
* Delete Story


---

# 🚀 Deployment

| Service  | URL           |
| -------- | ------------- |
| Frontend | link: https://intagram-clone-zeta.vercel.app |
| Backend  | https://intagram-clone-tje9.onrender.com     |

---

# 🧪 Demo Account

```
Email: test4@gmail.com
Password: Pakistan123
```

---

# 📈 Future Improvements

* Infinite Scrolling
* Saved Posts
* Explore Page
* Search Users
* Hashtags
* Reels
* Email Verification
* Password Reset
* Two-Factor Authentication

---

# 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to fork the repository and submit a pull request.

---

# 📄 License

This project was developed as part of the **Intenrship** and is intended for educational and portfolio purposes.

---

## ⭐ If you found this project helpful, consider giving it a star!
