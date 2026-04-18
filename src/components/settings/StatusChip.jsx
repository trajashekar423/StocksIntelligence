const CONFIG = {
  ACTIVE:  { label: 'Active',           cls: 'sc-active' },
  INACTIVE:{ label: 'Inactive',         cls: 'sc-inactive' },
  PENDING: { label: 'Pending Approval', cls: 'sc-pending' },
};

export default function StatusChip({ status }) {
  const { label, cls } = CONFIG[status] ?? CONFIG.INACTIVE;
  return <span className={`sc-chip ${cls}`}>{label}</span>;
}
