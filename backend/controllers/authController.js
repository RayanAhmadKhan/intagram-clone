const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateToken, cookieOptions } = require('../utils/generateToken');

const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || '',
    });

    const token = generateToken(user._id);
    res.cookie(process.env.COOKIE_NAME || 'ig_token', token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          isPrivate: user.isPrivate,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};




const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.cookie(process.env.COOKIE_NAME || 'ig_token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          isPrivate: user.isPrivate,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie(process.env.COOKIE_NAME || 'ig_token', cookieOptions);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: { user: req.user } });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
