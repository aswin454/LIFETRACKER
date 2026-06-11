import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { isDbConnected, mockUsers } from '../utils/mockDb.js';

const router = express.Router();

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'scheduler_jwt_secure_secret_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Database Offline Fallback
    if (!isDbConnected()) {
      const userExists = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return res.status(400).json({ message: 'User already exists with this email (Offline Mode)' });
      }

      const newUser = {
        _id: 'mock-user-' + Date.now(),
        name,
        email: email.toLowerCase(),
        password: password,
      };

      mockUsers.push(newUser);

      return res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        token: generateToken(newUser._id),
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    // Database Offline Fallback
    if (!isDbConnected()) {
      const mockUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!mockUser) {
        return res.status(400).json({ message: 'Invalid email or password (Offline Mode)' });
      }

      const isMatch = (password === mockUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password (Offline Mode)' });
      }

      return res.json({
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        token: generateToken(mockUser._id),
      });
    }

    // Find user (Database Online)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @desc    Authenticate user with Google
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  try {
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    let googleId;
    let email;
    let name;

    // Check if it's a mock token
    if (credential.startsWith('mock-google-token-')) {
      const dataBase64 = credential.replace('mock-google-token-', '');
      try {
        const decodedPayload = JSON.parse(Buffer.from(dataBase64, 'base64').toString('utf8'));
        googleId = decodedPayload.googleId;
        email = decodedPayload.email;
        name = decodedPayload.name;
      } catch (e) {
        console.error('Failed to parse mock Google token:', e);
        return res.status(400).json({ message: 'Invalid mock Google token' });
      }
    } else {
      // Real Google OAuth verification using Google API tokeninfo endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!response.ok) {
        return res.status(400).json({ message: 'Google token verification failed' });
      }
      const data = await response.json();
      googleId = data.sub;
      email = data.email;
      name = data.name;
    }

    if (!email) {
      return res.status(400).json({ message: 'Google account has no email address associated' });
    }

    // Database Offline Fallback
    if (!isDbConnected()) {
      let mockUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!mockUser) {
        mockUser = {
          _id: 'mock-user-' + Date.now(),
          name,
          email: email.toLowerCase(),
          googleId,
        };
        mockUsers.push(mockUser);
      }

      return res.json({
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        token: generateToken(mockUser._id),
      });
    }

    // Online Database Mode
    // Find user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Link Google Account if not linked yet
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user (password is optional now since they log in with Google)
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google login route error:', error);
    res.status(500).json({ message: 'Server error during Google auth' });
  }
});

// @desc    Get user profile details
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json(req.user);
    }

    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
