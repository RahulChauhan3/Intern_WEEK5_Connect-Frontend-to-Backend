import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

const empty = { title: '', author: '', content: '', tags: '', status: 'published' };

function validate(f) {
  const e = {};
  if (f.title.trim().length < 3 || f.title.trim().length > 120) e.title = 'Title must be 3–120 characters';
  if (f.author.trim().length < 2 || f.author.trim().length > 60) e.author = 'Author must be 2–60 characters';
  if (f.content.trim().length < 10) e.content = 'Content must be at least 10 characters';
  const tags = f.tags.split(',').map((t) => t.trim()).filter(Boolean);
  if (tags.length > 5) e.tags = 'Use at most 5 tags';
  if (tags.some((t) => t.length > 24)) e.tags = 'Each tag must be 24 characters or fewer';
  return e;
}

export default function PostForm({ notify }) {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) { setForm(empty); return; }
    setLoading(true);
    api.get(id)
      .then((p) => setForm({ title: p.title, author: p.author, content: p.content, tags: p.tags.join(', '), status: p.status }))
      .catch((e) => setLoadError(e.status === 404 || e.status === 400 ? 'This post no longer exists.' : e.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const local = validate(form);
    setErrors(local);
    if (Object.keys(local).length) return;
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      content: form.content.trim(),
      status: form.status,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      const saved = editing ? await api.update(id, payload) : await api.create(payload);
      notify(editing ? 'Changes saved' : 'Post published');
      navigate(`/posts/${saved.id}`);
    } catch (err) {
      if (Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else notify(err.message, 'error');
      setSaving(false);
    }
  };

  if (loading) return <div className="state"><span className="spinner" /> Loading post…</div>;
  if (loadError) return (
    <div className="state state-error" role="alert"><h2>Can’t edit this post</h2><p>{loadError}</p><Link className="btn" to="/">Back to all posts</Link></div>
  );

  const field = (k, label, input, hint) => (
    <div className={`field ${errors[k] ? 'has-error' : ''}`}>
      <label htmlFor={k}>{label}</label>
      {input}
      {hint && !errors[k] && <small>{hint}</small>}
      {errors[k] && <small className="err" id={`${k}-err`}>{errors[k]}</small>}
    </div>
  );
  const aria = (k) => ({ id: k, 'aria-invalid': Boolean(errors[k]), 'aria-describedby': errors[k] ? `${k}-err` : undefined });

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Link to={editing ? `/posts/${id}` : '/'} className="back">{editing ? 'Back to post' : 'All posts'}</Link>
      <h1>{editing ? 'Edit post' : 'New post'}</h1>
      {field('title', 'Title', <input {...aria('title')} value={form.title} onChange={set('title')} maxLength={120} autoFocus />)}
      {field('author', 'Author', <input {...aria('author')} value={form.author} onChange={set('author')} maxLength={60} />)}
      {field('content', 'Content', <textarea {...aria('content')} rows={10} value={form.content} onChange={set('content')} />, 'Plain text. Line breaks are kept.')}
      {field('tags', 'Tags', <input {...aria('tags')} value={form.tags} onChange={set('tags')} placeholder="react, node, mongodb" />, 'Comma separated, up to 5.')}
      {field('status', 'Visibility', (
        <select {...aria('status')} value={form.status} onChange={set('status')}>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      ))}
      <div className="row actions">
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Publish post'}</button>
        <Link className="btn" to={editing ? `/posts/${id}` : '/'}>Cancel</Link>
      </div>
    </form>
  );
}
