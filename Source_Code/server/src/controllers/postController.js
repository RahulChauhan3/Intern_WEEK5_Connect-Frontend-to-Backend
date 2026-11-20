const Post = require('../models/Post');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
const FIELDS = ['title', 'content', 'author', 'tags', 'status'];

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.tag) filter.tags = String(req.query.tag).toLowerCase();
    if (req.query.search) {
      const rx = new RegExp(escapeRegex(String(req.query.search)), 'i');
      filter.$or = [{ title: rx }, { content: rx }, { author: rx }];
    }
    const [posts, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Post.countDocuments(filter),
    ]);
    res.json({ data: posts, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const post = await Post.create(pick(req.body, FIELDS));
    res.status(201).json(post);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS), {
      new: true,
      runValidators: true,
    });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted', id: post.id });
  } catch (err) { next(err); }
};
