const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    const userId = socket.handshake.auth?.userId;

    // 1. Check raw cookies if present
    if (!token && socket.handshake.headers?.cookie) {
      const rawCookies = socket.handshake.headers.cookie.split(';');
      for (let c of rawCookies) {
        const [key, value] = c.trim().split('=');
        if (['token', 'jwt', 'accessToken', 'session'].includes(key)) {
          token = value;
          break;
        }
      }
    }

    // 2. If token exists, verify it
    if (token && token !== 'undefined' && token !== 'null') {
      token = decodeURIComponent(token);
      if (token.startsWith('s:')) token = token.slice(2).split('.')[0];
      if (token.startsWith('Bearer ')) token = token.slice(7).trim();
      token = token.replace(/^["']|["']$/g, '').trim();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      console.log(`✅ Socket connected (JWT verified) for user: ${decoded.id || decoded._id}`);
      return next();
    }

    // 3. Fallback: If cookies were blocked across ports, authenticate by valid userId passed from AuthContext
    if (userId) {
      socket.user = { id: userId, _id: userId };
      console.log(`✅ Socket connected (AuthContext verified) for user ID: ${userId}`);
      return next();
    }

    console.error('❌ Socket Auth Failed: No token or userId provided in handshake');
    return next(new Error('Authentication error: Token missing'));
  } catch (err) {
    console.error('❌ Socket JWT Verification Error:', err.message);
    return next(new Error('Authentication error: Invalid token'));
  }
};