const express = require('express');
const router = express.Router();
const { getSkills, createSkill, updateSkill, deleteSkill } = require('../controllers/skillsController');
const { verifyToken } = require('../middleware/auth');
const { skillRules, idParamRule, handleValidation } = require('../middleware/validate');

// Public
router.get('/', getSkills);

// Admin only
router.post('/', verifyToken, skillRules, handleValidation, createSkill);
router.put('/:id', verifyToken, idParamRule, skillRules, handleValidation, updateSkill);
router.delete('/:id', verifyToken, idParamRule, handleValidation, deleteSkill);

module.exports = router;
