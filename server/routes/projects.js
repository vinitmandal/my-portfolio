const express = require('express');
const router = express.Router();
const { getProjects, getProjectBySlug, createProject, updateProject, deleteProject, uploadProjectImage } = require('../controllers/projectsController');
const { verifyToken } = require('../middleware/auth');
const { projectRules, idParamRule, slugParamRule, handleValidation } = require('../middleware/validate');
const { createFileUpload, imageFormats } = require('../middleware/fileUpload');
const projectImageUpload = createFileUpload({
  folder: 'images',
  prefix: 'project',
  formats: imageFormats,
});

// Public
router.get('/', getProjects);
router.get('/:slug', slugParamRule, handleValidation, getProjectBySlug);

// Admin only
router.post('/', verifyToken, projectRules, handleValidation, createProject);
router.put('/:id', verifyToken, idParamRule, projectRules, handleValidation, updateProject);
router.delete('/:id', verifyToken, idParamRule, handleValidation, deleteProject);
router.post(
  '/:id/image',
  verifyToken,
  idParamRule,
  handleValidation,
  projectImageUpload.upload.single('image'),
  projectImageUpload.validateSignature,
  uploadProjectImage
);

module.exports = router;
