// Middleware to check if the user is authenticated
const isLogin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
  
    try {
      const decoded = verifyToken(token);
      req.user = decoded; // Attach decoded payload to req.user
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid token.' });
    }
  };
  
  // Middleware to redirect if the user is already logged in
  const isLogout = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        verifyToken(token); // If token is valid, redirect
        return res.redirect('/');
      } catch (error) {
        next(); // Token is invalid, proceed to the next middleware
      }
    } else {
      next();
    }
  };

  
  export default {
    isLogin,
    isLogout
  };
  