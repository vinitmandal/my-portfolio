const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, deleteProfile, uploadProfileImage } = require('../controllers/profileController');
const { verifyToken } = require('../middleware/auth');
const { profileRules, handleValidation } = require('../middleware/validate');
const { createFileUpload, imageFormats } = require('../middleware/fileUpload');
const profileImageUpload = createFileUpload({
  folder: 'images',
  prefix: 'profile',
  formats: imageFormats,
});

// Public
router.get('/', getProfile);

// Admin only
router.put('/', verifyToken, profileRules, handleValidation, updateProfile);
router.delete('/', verifyToken, deleteProfile);
router.post(
  '/image',
  verifyToken,
  profileImageUpload.upload.single('image'),
  profileImageUpload.validateSignature,
  uploadProfileImage
);

module.exports = router;
