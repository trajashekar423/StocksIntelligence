export default function Button({ children, variant = 'primary', ...props }) {
  const cls = variant === 'ghost' ? 'mf-btn-ghost' : 'mf-btn-submit';
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
