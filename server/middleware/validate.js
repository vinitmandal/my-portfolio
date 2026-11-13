const { body, param, validationResult } = require('express-validator');

// Middleware to check validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Login validation
const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required.').isLength({ max: 50 }),
  body('password').isString().notEmpty().withMessage('Password is required.').isLength({ max: 128 }),
];

const setupRules = [
  body('setup_key').isString().notEmpty().withMessage('Setup key is required.').isLength({ max: 256 }),
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters.'),
  body('password').isString().isLength({ min: 12, max: 128 }).withMessage('Password must be between 12 and 128 characters.'),
  body('confirm_password').isString().isLength({ max: 128 }).withMessage('Password confirmation is too long.'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match.');
    }
    return true;
  }),
];

// Contact form validation
const contactRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }).withMessage('Name must be under 100 characters.'),
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('subject').trim().notEmpty().withMessage('Subject is required.').isLength({ max: 200 }).withMessage('Subject must be under 200 characters.'),
  body('message').trim().notEmpty().withMessage('Message is required.').isLength({ max: 5000 }).withMessage('Message must be under 5000 characters.'),
];

// Profile update validation
const profileRules = [
  body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty.').isLength({ max: 100 }),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.').isLength({ max: 150 }),
  body('subtitle').optional().trim().isLength({ max: 200 }),
  body('introduction').optional().trim(),
  body('about_text').optional().trim(),
  body('available_for_opportunities').optional().isBoolean().withMessage('Must be true or false.'),
];

// Skill validation
const skillRules = [
  body('name').trim().notEmpty().withMessage('Skill name is required.').isLength({ max: 100 }),
  body('category').isIn(['programming', 'frontend', 'backend', 'database', 'tools']).withMessage('Invalid skill category.'),
  body('icon_name').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer.'),
];

// Education validation
const educationRules = [
  body('degree').trim().notEmpty().withMessage('Degree is required.').isLength({ max: 150 }),
  body('institution').trim().notEmpty().withMessage('Institution is required.').isLength({ max: 200 }),
  body('board').optional().trim().isLength({ max: 100 }),
  body('score').optional().isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100.'),
  body('score_type').optional().isIn(['cgpa', 'percentage']).withMessage('Score type must be cgpa or percentage.'),
  body('start_year').optional().isInt({ min: 1900, max: 2100 }).withMessage('Invalid start year.'),
  body('end_year').optional().isInt({ min: 1900, max: 2100 }).withMessage('Invalid end year.'),
  body('description').optional().trim(),
  body('display_order').optional().isInt({ min: 0 }),
];

// Experience validation
const experienceRules = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 150 }),
  body('organization').trim().notEmpty().withMessage('Organization is required.').isLength({ max: 200 }),
  body('type').isIn(['internship', 'job', 'project_experience']).withMessage('Invalid experience type.'),
  body('start_date').optional().isISO8601().withMessage('Invalid start date.'),
  body('end_date').optional({ values: 'null' }).isISO8601().withMessage('Invalid end date.'),
  body('description').optional().trim(),
  body('is_current').optional().isBoolean(),
  body('display_order').optional().isInt({ min: 0 }),
];

// Project validation
const projectRules = [
  body('title').trim().notEmpty().withMessage('Project title is required.').isLength({ max: 150 }),
  body('slug').optional({ values: 'null' }).trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug may contain lowercase letters, numbers, and single hyphens.').isLength({ max: 170 }),
  body('description').optional().trim(),
  body('short_description').optional().trim().isLength({ max: 300 }),
  body('github_url').optional({ values: 'null' }).trim().isURL().withMessage('Invalid GitHub URL.'),
  body('live_url').optional({ values: 'null' }).trim().isURL().withMessage('Invalid live URL.'),
  body('status').optional().isIn(['completed', 'in_progress', 'planned']).withMessage('Invalid project status.'),
  body('featured').optional().isBoolean(),
  body('display_order').optional().isInt({ min: 0 }),
  body('technologies').optional().isArray().withMessage('Technologies must be an array.'),
  body('technologies.*').optional().trim().notEmpty().withMessage('Technology name cannot be empty.'),
];

// Certification validation
const certificationRules = [
  body('name').trim().notEmpty().withMessage('Certification name is required.').isLength({ max: 200 }),
  body('issuing_organization').trim().notEmpty().withMessage('Issuing organization is required.').isLength({ max: 200 }),
  body('completion_date').optional().isISO8601().withMessage('Invalid completion date.'),
  body('credential_url').optional({ values: 'null' }).trim().isURL().withMessage('Invalid credential URL.'),
  body('image_url').optional({ values: 'null' }).trim(),
  body('display_order').optional().isInt({ min: 0 }),
];

// Achievement validation
const achievementRules = [
  body('title').trim().notEmpty().withMessage('Achievement title is required.').isLength({ max: 200 }),
  body('organization').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim(),
  body('date').optional().isISO8601().withMessage('Invalid date.'),
  body('category').optional().trim().isLength({ max: 100 }),
  body('display_order').optional().isInt({ min: 0 }),
];

const socialLinkRules = [
  body('platform').trim().notEmpty().withMessage('Platform is required.').isLength({ max: 50 }),
  body('url').trim().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('A valid HTTP or HTTPS URL is required.').isLength({ max: 500 }),
  body('icon_name').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer.'),
];

// ID param validation
const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID parameter.'),
];

// Slug param validation
const slugParamRule = [
  param('slug').trim().notEmpty().withMessage('Slug is required.'),
];

module.exports = {
  handleValidation,
  loginRules,
  setupRules,
  contactRules,
  profileRules,
  skillRules,
  educationRules,
  experienceRules,
  projectRules,
  certificationRules,
  achievementRules,
  socialLinkRules,
  idParamRule,
  slugParamRule,
};
