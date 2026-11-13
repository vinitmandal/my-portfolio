const express = require('express');
const router = express.Router();
const {
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  uploadCertificationDocument,
} = require('../controllers/certificationsController');
const { verifyToken } = require('../middleware/auth');
const { certificationRules, idParamRule, handleValidation } = require('../middleware/validate');
const { createFileUpload, pdfFormats } = require('../middleware/fileUpload');
const certificationUpload = createFileUpload({
  folder: 'certifications',
  prefix: 'certificate',
  formats: pdfFormats,
});

// Public
router.get('/', getCertifications);

// Admin only
router.post('/', verifyToken, certificationRules, handleValidation, createCertification);
router.put('/:id', verifyToken, idParamRule, certificationRules, handleValidation, updateCertification);
router.delete('/:id', verifyToken, idParamRule, handleValidation, deleteCertification);
router.post(
  '/:id/document',
  verifyToken,
  idParamRule,
  handleValidation,
  certificationUpload.upload.single('document'),
  certificationUpload.validateSignature,
  uploadCertificationDocument
);

module.exports = router;
