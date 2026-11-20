import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { formatDate } from '../components/format.js';

export default function PostDetail({ notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPost(null);
    setError(null);
    api.get(id).then(setPost).catch(setError);
  }, [id]);

  const remove = async () => {
    setBusy(true);
    try {
      await api.remove(id);
      notify('Post deleted');
      navigate('/');
    } catch (e) {
      notify(e.message, 'error');
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="state state-error" role="alert">
        <h2>{error.status === 404 || error.status === 400 ? 'Post not found' : 'Couldn’t load this post'}</h2>
        <p>{error.status === 404 || error.status === 400 ? 'It may have been deleted.' : error.message}</p>
        <Link className="btn" to="/">Back to all posts</Link>
      </div>
    );
  }
  if (!post) return <div className="state"><span className="spinner" /> Loading post…</div>;

  return (
    <article className="article">
      <Link to="/" className="back">All posts</Link>
      <h1>{post.title}</h1>
      <div className="row wrap-row muted">
        <span>by {post.author}</span>
        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        {post.updatedAt !== post.createdAt && <span>edited {formatDate(post.updatedAt)}</span>}
        {post.status === 'draft' && <span className="badge">Draft</span>}
      </div>
      <div className="body">{post.content}</div>
      {post.tags.length > 0 && (
        <div className="row wrap-row">{post.tags.map((t) => <Link key={t} className="tag" to={`/?tag=${t}`}>#{t}</Link>)}</div>
      )}
      <div className="row actions">
        <Link className="btn btn-primary" to={`/posts/${post.id}/edit`}>Edit post</Link>
        <button className="btn btn-danger-ghost" onClick={() => setConfirm(true)}>Delete</button>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Delete this post?"
          body={`“${post.title}” will be removed permanently. This can’t be undone.`}
          confirmLabel="Delete post"
          busy={busy}
          onConfirm={remove}
          onCancel={() => !busy && setConfirm(false)}
        />
      )}
    </article>
  );
}
