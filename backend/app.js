const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const followRoutes = require('./routes/followRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const postRoutes = require('./routes/postRoutes');
//const commentRoutes = require('./routes/commentRoutes');
//const storyRoutes = require('./routes/storyRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/media', mediaRoutes); // test-upload route — safe to delete now that Posts is live
app.use('/api/posts', postRoutes);
//app.use('/api/comments', commentRoutes);
//app.use('/api/stories', storyRoutes);
// app.use('/api/feed', feedRoutes);        // Step 13

app.use(notFound);
app.use(errorHandler);

module.exports = app;
