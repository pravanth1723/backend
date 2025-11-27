const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

/**
 * JWT validation middleware that checks for tokens in both the Authorization header ("Bearer ...")
 * and cookies (e.g., httpOnly cookies set by backend).
 *
 * Usage: Add cookie-parser middleware in your app!
 *    const cookieParser = require('cookie-parser');
 *    app.use(cookieParser());
 */
const validateToken = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // If not in header, check for token in cookies (e.g., "jwt" cookie)
  if (!token && req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
    console.log("token from cookie:", token);
  }

  if (!token) {
    res.status(401);
    throw new Error('Unauthorized: No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded JWT:", decoded);
    req.user = decoded.user || decoded; // support both {user, ...} and plain payloads
    next();
  } catch (err) {
    res.status(401);
    throw new Error('User is not authorized: Invalid token');
  }
});

module.exports = validateToken;
