import { useCallback, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import PostList from './pages/PostList.jsx';
import PostDetail from './pages/PostDetail.jsx';
import PostForm from './pages/PostForm.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = 'ok') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="bar">
        <div className="wrap bar-inner">
          <Link to="/" className="brand">Devlog</Link>
          <nav>
            <NavLink to="/" end>Posts</NavLink>
            <NavLink to="/new" className="btn btn-primary">New post</NavLink>
          </nav>
        </div>
      </header>
      <main id="main" className="wrap">
        <Routes>
          <Route path="/" element={<PostList notify={notify} />} />
          <Route path="/new" element={<PostForm notify={notify} />} />
          <Route path="/posts/:id" element={<PostDetail notify={notify} />} />
          <Route path="/posts/:id/edit" element={<PostForm notify={notify} />} />
          <Route path="*" element={<div className="state"><h2>Page not found</h2><Link to="/">Back to all posts</Link></div>} />
        </Routes>
      </main>
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
