const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const updateProfileRules = [
  body('fullName').optional().trim().isLength({ max: 60 }).withMessage('Full name too long'),
  body('bio').optional().trim().isLength({ max: 150 }).withMessage('Bio must be under 150 characters'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be true or false'),
];

module.exports = { validate, updateProfileRules };
