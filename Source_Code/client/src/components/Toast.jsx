import { useEffect } from 'react';

export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [toast, onDone]);
  if (!toast) return null;
  return <div key={toast.key} className={`toast toast-${toast.type}`} role="status">{toast.message}</div>;
}
