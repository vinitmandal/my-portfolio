const express = require('express');
const router = express.Router();
const { getAchievements, createAchievement, updateAchievement, deleteAchievement } = require('../controllers/achievementsController');
const { verifyToken } = require('../middleware/auth');
const { achievementRules, idParamRule, handleValidation } = require('../middleware/validate');

// Public
router.get('/', getAchievements);

// Admin only
router.post('/', verifyToken, achievementRules, handleValidation, createAchievement);
router.put('/:id', verifyToken, idParamRule, achievementRules, handleValidation, updateAchievement);
router.delete('/:id', verifyToken, idParamRule, handleValidation, deleteAchievement);

module.exports = router;
