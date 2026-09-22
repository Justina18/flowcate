export default function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
  );
}
