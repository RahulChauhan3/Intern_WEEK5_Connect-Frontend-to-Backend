// Integration test: runs against a real MongoDB (uses a throwaway database).
// Usage: npm test   (MongoDB must be running)
process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../src/app');
const Post = require('../src/models/Post');

const uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blog_api').replace(/\/[^/]*$/, '/blog_api_test');
let server, base, passed = 0, failed = 0;

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  PASS  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

(async () => {
  await mongoose.connect(uri);
  await Post.deleteMany({});
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  const valid = { title: 'Hello world', content: 'This is a valid post body.', author: 'Rahul', tags: ['React', 'Node'] };
  let id;

  console.log('\nBlog API integration tests\n');
  await test('GET /api/health reports db connected', async () => {
    const r = await call('GET', '/api/health');
    assert.equal(r.status, 200); assert.equal(r.body.db, 'connected');
  });
  await test('POST /api/posts creates a post (201) and lowercases tags', async () => {
    const r = await call('POST', '/api/posts', valid);
    assert.equal(r.status, 201); assert.deepEqual(r.body.tags, ['react', 'node']);
    assert.equal(r.body.status, 'published'); assert.ok(r.body.id); assert.ok(r.body.createdAt);
    id = r.body.id;
  });
  await test('POST rejects missing fields with field-level errors (400)', async () => {
    const r = await call('POST', '/api/posts', {});
    assert.equal(r.status, 400); assert.ok(r.body.errors.some((e) => e.field === 'title'));
  });
  await test('POST rejects too-short title (400)', async () => {
    const r = await call('POST', '/api/posts', { ...valid, title: 'ab' });
    assert.equal(r.status, 400);
  });
  await test('POST rejects more than 5 tags and bad status (400)', async () => {
    const r = await call('POST', '/api/posts', { ...valid, tags: ['a', 'b', 'c', 'd', 'e', 'f'], status: 'nope' });
    assert.equal(r.status, 400); assert.ok(r.body.errors.length >= 2);
  });
  await test('POST ignores unknown fields (no mass assignment)', async () => {
    const r = await call('POST', '/api/posts', { ...valid, title: 'Extra field post', isAdmin: true });
    assert.equal(r.status, 201); assert.equal(r.body.isAdmin, undefined);
  });
  await test('GET /api/posts lists with pagination metadata', async () => {
    const r = await call('GET', '/api/posts?limit=1');
    assert.equal(r.status, 200); assert.equal(r.body.data.length, 1); assert.equal(r.body.total, 2); assert.equal(r.body.totalPages, 2);
  });
  await test('GET /api/posts?search= filters results', async () => {
    const r = await call('GET', '/api/posts?search=extra');
    assert.equal(r.body.total, 1);
  });
  await test('GET /api/posts?tag= filters by tag', async () => {
    const r = await call('GET', '/api/posts?tag=React');
    assert.equal(r.body.total, 2);
  });
  await test('GET /api/posts rejects invalid limit (400)', async () => {
    assert.equal((await call('GET', '/api/posts?limit=500')).status, 400);
  });
  await test('GET /api/posts rejects an invalid status filter (400)', async () => {
    assert.equal((await call('GET', '/api/posts?status=archived')).status, 400);
  });
  await test('GET /api/posts/:id returns the post', async () => {
    const r = await call('GET', `/api/posts/${id}`);
    assert.equal(r.status, 200); assert.equal(r.body.title, 'Hello world');
  });
  await test('GET /api/posts/:id with invalid id (400)', async () => {
    assert.equal((await call('GET', '/api/posts/not-an-id')).status, 400);
  });
  await test('GET /api/posts/:id unknown id (404)', async () => {
    assert.equal((await call('GET', '/api/posts/64b7f0c2a1b2c3d4e5f60718')).status, 404);
  });
  await test('PUT /api/posts/:id updates fields (200)', async () => {
    const r = await call('PUT', `/api/posts/${id}`, { title: 'Updated title', status: 'draft' });
    assert.equal(r.status, 200); assert.equal(r.body.title, 'Updated title'); assert.equal(r.body.status, 'draft');
    assert.equal(r.body.author, 'Rahul');
  });
  await test('PUT rejects invalid update (400)', async () => {
    assert.equal((await call('PUT', `/api/posts/${id}`, { title: 'x' })).status, 400);
  });
  await test('PUT rejects an empty update body (400)', async () => {
    assert.equal((await call('PUT', `/api/posts/${id}`, {})).status, 400);
  });
  await test('DELETE /api/posts/:id removes it (200), then 404', async () => {
    assert.equal((await call('DELETE', `/api/posts/${id}`)).status, 200);
    assert.equal((await call('GET', `/api/posts/${id}`)).status, 404);
    assert.equal((await call('DELETE', `/api/posts/${id}`)).status, 404);
  });
  await test('Malformed JSON body returns 400', async () => {
    const res = await fetch(base + '/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
    assert.equal(res.status, 400);
  });
  await test('Unknown route returns 404', async () => {
    assert.equal((await call('GET', '/api/nothing')).status, 404);
  });

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server.close();
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})();
