export default function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`sb-logo ${className}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M6 8.5h12.4c4.9 0 7.6 2.4 7.6 6.1 0 2.7-1.5 4.7-4 5.7 3.2.8 5 2.9 5 5.8 0 4.1-3.1 6.4-8.4 6.4H6V8.5Zm10.8 9.7c2.1 0 3.3-.8 3.3-2.4 0-1.5-1.2-2.3-3.3-2.3h-5v4.7h5Zm.7 9.1c2.4 0 3.7-.9 3.7-2.7 0-1.7-1.3-2.6-3.7-2.6h-5.7v5.3h5.7Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
