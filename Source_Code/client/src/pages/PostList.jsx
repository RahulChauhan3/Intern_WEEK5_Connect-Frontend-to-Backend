import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { excerpt, formatDate } from '../components/format.js';

export default function PostList({ notify }) {
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page'), 10) || 1;
  const search = params.get('search') || '';
  const tag = params.get('tag') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.list({ page, limit: 5, search, tag })
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, tag]);

  useEffect(load, [load]);

  const update = (next) => {
    const merged = { page: 1, search, tag, ...next };
    const clean = Object.fromEntries(Object.entries(merged).filter(([k, v]) => v && !(k === 'page' && v === 1)));
    setParams(clean);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.remove(toDelete.id);
      notify('Post deleted');
      setToDelete(null);
      if (result.data.length === 1 && page > 1) update({ page: page - 1 });
      else load();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="intro">
        <h1>Notes from the build</h1>
        <p>Write, edit and publish. Every post here is stored in MongoDB and served by the Express API.</p>
      </section>

      <form className="filters" onSubmit={(e) => { e.preventDefault(); update({ search: searchInput.trim() }); }} role="search">
        <label className="sr" htmlFor="q">Search posts</label>
        <input id="q" type="search" placeholder="Search title, content or author" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <button className="btn" type="submit">Search</button>
        {(search || tag) && (
          <button className="btn btn-ghost" type="button" onClick={() => { setSearchInput(''); setParams({}); }}>Clear filters</button>
        )}
      </form>
      {tag && <p className="muted">Showing posts tagged <strong>#{tag}</strong></p>}

      {loading && <div className="state" aria-live="polite"><span className="spinner" /> Loading posts…</div>}

      {!loading && error && (
        <div className="state state-error" role="alert">
          <h2>Couldn’t load posts</h2>
          <p>{error}</p>
          <button className="btn" onClick={load}>Try again</button>
        </div>
      )}

      {!loading && !error && result && result.data.length === 0 && (
        <div className="state">
          <h2>{search || tag ? 'No posts match those filters' : 'No posts yet'}</h2>
          <p>{search || tag ? 'Try a different search or clear the filters.' : 'Write the first one to get started.'}</p>
          {!(search || tag) && <Link className="btn btn-primary" to="/new">Write a post</Link>}
        </div>
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <ol className="posts">
            {result.data.map((p) => (
              <li key={p.id} className="post-row">
                <div className="post-meta">
                  <time dateTime={p.createdAt}>{formatDate(p.createdAt)}</time>
                  {p.status === 'draft' && <span className="badge">Draft</span>}
                </div>
                <div className="post-main">
                  <h2><Link to={`/posts/${p.id}`}>{p.title}</Link></h2>
                  <p>{excerpt(p.content)}</p>
                  <div className="row wrap-row">
                    <span className="muted">by {p.author}</span>
                    {p.tags.map((t) => (
                      <button key={t} className="tag" onClick={() => update({ tag: t })}>#{t}</button>
                    ))}
                  </div>
                </div>
                <div className="post-actions">
                  <Link className="btn btn-sm" to={`/posts/${p.id}/edit`}>Edit</Link>
                  <button className="btn btn-sm btn-danger-ghost" onClick={() => setToDelete(p)}>Delete</button>
                </div>
              </li>
            ))}
          </ol>

          {result.totalPages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button className="btn" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Previous</button>
              <span>Page {result.page} of {result.totalPages}</span>
              <button className="btn" disabled={page >= result.totalPages} onClick={() => update({ page: page + 1 })}>Next</button>
            </nav>
          )}
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete this post?"
          body={`“${toDelete.title}” will be removed permanently. This can’t be undone.`}
          confirmLabel="Delete post"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => !deleting && setToDelete(null)}
        />
      )}
    </>
  );
}
