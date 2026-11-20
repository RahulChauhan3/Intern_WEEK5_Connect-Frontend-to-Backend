const { body, param, query, validationResult } = require('express-validator');

const handle = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ message: 'Validation failed', errors });
};

const idRule = param('id').isMongoId().withMessage('Invalid post id');

const bodyRules = (partial) => {
  const opt = (chain) => (partial ? chain.optional() : chain);
  return [
    opt(body('title')).isString().withMessage('Title is required').bail().trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
    opt(body('content')).isString().withMessage('Content is required').bail().trim().isLength({ min: 10, max: 10000 }).withMessage('Content must be 10-10000 characters'),
    opt(body('author')).isString().withMessage('Author is required').bail().trim().isLength({ min: 2, max: 60 }).withMessage('Author must be 2-60 characters'),
    body('tags').optional().isArray({ max: 5 }).withMessage('Tags must be an array of at most 5 items'),
    body('tags.*').optional().isString().trim().isLength({ min: 1, max: 24 }).withMessage('Each tag must be 1-24 characters'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  ];
};

exports.validateId = [idRule, handle];
exports.validateCreate = [...bodyRules(false), handle];
const requireUpdateField = (req, res, next) => {
  const allowed = ['title', 'content', 'author', 'tags', 'status'];
  if (!allowed.some((field) => Object.prototype.hasOwnProperty.call(req.body || {}, field))) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: [{ field: 'body', message: 'Provide at least one supported field to update' }],
    });
  }
  return next();
};

exports.validateUpdate = [idRule, requireUpdateField, ...bodyRules(true), handle];
exports.validateList = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
  query('status').optional().isIn(['draft', 'published']).withMessage('status must be draft or published'),
  handle,
];
