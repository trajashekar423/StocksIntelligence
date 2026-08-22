export default function StatusChip({ ok }) {
  const cls = ok ? 'badge bg-success' : 'badge bg-danger';
  return <span className={cls} style={{fontSize: '0.75rem'}}>{ok ? 'LIVE' : 'DOWN'}</span>;
}
