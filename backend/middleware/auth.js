import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isDbConnected, mockUsers } from '../utils/mockDb.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'scheduler_jwt_secure_secret_key_2026');

      // Attach user object without password to request
      if (!isDbConnected()) {
        const mockUser = mockUsers.find((u) => u._id === decoded.id);
        if (!mockUser) {
          return res.status(401).json({ message: 'User not found, unauthorized' });
        }
        const { password, ...userWithoutPassword } = mockUser;
        req.user = userWithoutPassword;
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found, unauthorized' });
      }
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
