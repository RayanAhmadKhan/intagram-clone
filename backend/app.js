const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { initSocket } = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const followRoutes = require('./routes/followRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const storyRoutes = require('./routes/storyRoutes');
const feedRoutes = require('./routes/feedRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io integration with HTTP server
initSocket(server);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/feed', feedRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = { app, server };