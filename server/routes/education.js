const express = require('express');
const router = express.Router();
const { getEducation, createEducation, updateEducation, deleteEducation } = require('../controllers/educationController');
const { verifyToken } = require('../middleware/auth');
const { educationRules, idParamRule, handleValidation } = require('../middleware/validate');

// Public
router.get('/', getEducation);

// Admin only
router.post('/', verifyToken, educationRules, handleValidation, createEducation);
router.put('/:id', verifyToken, idParamRule, educationRules, handleValidation, updateEducation);
router.delete('/:id', verifyToken, idParamRule, handleValidation, deleteEducation);

module.exports = router;
