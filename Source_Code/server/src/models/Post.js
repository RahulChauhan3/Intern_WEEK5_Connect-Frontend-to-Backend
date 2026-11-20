const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: [10, 'Content must be at least 10 characters'],
      maxlength: [10000, 'Content must be at most 10000 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      minlength: [2, 'Author must be at least 2 characters'],
      maxlength: [60, 'Author must be at most 60 characters'],
    },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 24 }],
      validate: [(v) => v.length <= 5, 'A post can have at most 5 tags'],
      default: [],
    },
    status: {
      type: String,
      enum: { values: ['draft', 'published'], message: 'Status must be draft or published' },
      default: 'published',
    },
  },
  { timestamps: true }
);

postSchema.index({ title: 'text', content: 'text' });
postSchema.index({ createdAt: -1 });

postSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Post', postSchema);
