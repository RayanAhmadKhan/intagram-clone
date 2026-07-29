const jwt = require('jsonwebtoken');

// Authenticates a socket exactly like authMiddleware.js authenticates a
// normal HTTP request: read the real auth cookie, verify its signature,
// trust nothing the client merely *claims* about its own identity.
module.exports = (socket, next) => {
  try {
    const cookieName = process.env.COOKIE_NAME || 'ig_token';
    const cookieHeader = socket.handshake.headers?.cookie || '';

    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${cookieName}=`));

    let token = match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;

    // Optional fallback for non-browser clients that can't send cookies
    // (e.g. a future mobile app) — still a real, signed token, never a
    // bare user id.
    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id };
    return next();
  } catch (err) {
    console.error('Socket auth failed:', err.message);
    return next(new Error('Authentication error: invalid token'));
  }
};
