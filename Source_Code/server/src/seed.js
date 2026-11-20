require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('./models/Post');

const posts = [
  { title: 'Why I finally learned the event loop', author: 'Rahul', tags: ['javascript', 'node'], content: 'For months I wrote async code by trial and error. Reading how the call stack, task queue and microtask queue interact made promises and timers click. Here is the mental model that helped me most.' },
  { title: 'Modelling blog data in MongoDB', author: 'Rahul', tags: ['mongodb', 'backend'], content: 'A post is a single document: title, content, author, tags and timestamps. Embedding tags keeps reads to one query, and a text index makes search cheap. This is how I validated it with Mongoose.' },
  { title: 'Connecting React to an Express API', author: 'Rahul', tags: ['react', 'express'], content: 'A small API client, a loading state and an error state are enough to make a React list feel solid. I used a Vite dev proxy so the browser never has to deal with CORS during development.' },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Post.deleteMany({});
  await Post.insertMany(posts);
  console.log(`Seeded ${posts.length} posts`);
  await mongoose.disconnect();
})();
