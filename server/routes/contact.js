const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { submitContact, getMessages, markAsRead, deleteMessage } = require('../controllers/contactController');
const { verifyToken } = require('../middleware/auth');
const { contactRules, idParamRule, handleValidation } = require('../middleware/validate');
const { body } = require('express-validator');

// Rate limit for contact form submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public
router.post('/', contactLimiter, contactRules, handleValidation, submitContact);

// Admin only
router.get('/', verifyToken, getMessages);
router.patch(
  '/:id/read',
  verifyToken,
  idParamRule,
  body('is_read').optional().isBoolean().withMessage('Read status must be true or false.'),
  handleValidation,
  markAsRead
);
router.delete('/:id', verifyToken, idParamRule, handleValidation, deleteMessage);

module.exports = router;
