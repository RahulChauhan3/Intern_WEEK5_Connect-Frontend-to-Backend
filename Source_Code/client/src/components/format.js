export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const excerpt = (text, n = 170) => (text.length > n ? `${text.slice(0, n).trimEnd()}…` : text);
