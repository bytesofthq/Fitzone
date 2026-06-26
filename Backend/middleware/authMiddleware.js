import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for Token in Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitzone_super_secret_jwt_key_98765');

      // Fetch admin details and exclude password field
      req.admin = await Admin.findById(decoded.id).select('-password');
      
      if (!req.admin) {
        return res.status(401).json({ message: 'Not authorized, admin user not found' });
      }

      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
