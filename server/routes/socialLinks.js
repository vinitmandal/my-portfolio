const express = require('express');
const router = express.Router();
const {
  getSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
} = require('../controllers/socialLinksController');
const { verifyToken } = require('../middleware/auth');
const { socialLinkRules, idParamRule, handleValidation } = require('../middleware/validate');

router.get('/', getSocialLinks);
router.post('/', verifyToken, socialLinkRules, handleValidation, createSocialLink);
router.put('/:id', verifyToken, idParamRule, socialLinkRules, handleValidation, updateSocialLink);
router.delete('/:id', verifyToken, idParamRule, handleValidation, deleteSocialLink);

module.exports = router;
