const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  setupStatus,
  createInitialAdmin,
  login,
  logout,
  checkAuth,
  getDashboardStats,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { loginRules, setupRules, handleValidation } = require('../middleware/validate');

// Rate limit for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many setup attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/setup-status', setupStatus);
router.post('/setup', setupLimiter, setupRules, handleValidation, createInitialAdmin);
router.post('/login', loginLimiter, loginRules, handleValidation, login);
router.post('/logout', logout);
router.get('/check', verifyToken, checkAuth);
router.get('/dashboard', verifyToken, getDashboardStats);

module.exports = router;
