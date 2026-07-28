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

const createPostRules = [
  body('caption').optional().trim().isLength({ max: 2200 }).withMessage('Caption too long'),
];

const updatePostRules = [
  body('caption').trim().isLength({ max: 2200 }).withMessage('Caption too long'),
];

module.exports = { validate, createPostRules, updatePostRules };
