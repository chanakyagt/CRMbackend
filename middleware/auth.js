const jwt = require('jsonwebtoken');

const auth = (requiredRoles) => {
  return (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).send({ error: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;

      if (requiredRoles && !requiredRoles.includes(req.user.type)) {
        return res.status(403).send({ error: 'Access denied' });
      }

      next();
    } catch (error) {
      res.status(401).send({ error: 'Invalid token' });
    }
  };
};

module.exports = auth;
