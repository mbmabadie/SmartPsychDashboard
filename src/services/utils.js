export function formatDate(d) {
  if (!d) return '-';
  const date = typeof d === 'number' ? new Date(d) : new Date(d);
  return date.toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(d) {
  if (!d) return '-';
  const date = typeof d === 'number' ? new Date(d) : new Date(d);
  return date.toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
