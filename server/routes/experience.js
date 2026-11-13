const express = require('express');
const router = express.Router();
const { getExperience, createExperience, updateExperience, deleteExperience } = require('../controllers/experienceController');
const { verifyToken } = require('../middleware/auth');
const { experienceRules, idParamRule, handleValidation } = require('../middleware/validate');

// Public
router.get('/', getExperience);

// Admin only
router.post('/', verifyToken, experienceRules, handleValidation, createExperience);
router.put('/:id', verifyToken, idParamRule, experienceRules, handleValidation, updateExperience);
router.delete('/:id', verifyToken, idParamRule, handleValidation, deleteExperience);

module.exports = router;
