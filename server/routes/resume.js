const express = require('express');
const router = express.Router();
const { getResume, downloadResume, previewResume, uploadResume } = require('../controllers/resumeController');
const { verifyToken } = require('../middleware/auth');
const { createFileUpload, pdfFormats } = require('../middleware/fileUpload');

const resumeUpload = createFileUpload({
  folder: 'resume',
  prefix: 'resume',
  formats: pdfFormats,
});

router.get('/', getResume);
router.get('/preview', previewResume);
router.get('/download', downloadResume);
router.post(
  '/upload',
  verifyToken,
  resumeUpload.upload.single('resume'),
  resumeUpload.validateSignature,
  uploadResume
);

module.exports = router;
