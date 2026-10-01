export default function Modal({ open, title, subtitle, children, onClose, size = 'md' }) {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full ${sizeClasses[size] || sizeClasses.md} rounded-3xl border border-navy-100 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-navy-900`}>
        {(title || subtitle) && (
          <div className="mb-5">
            {title && <h3 className="font-display text-xl text-navy-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-navy-400">{subtitle}</p>}
          </div>
        )}
        {children}
        {onClose && (
          <button onClick={onClose} className="mt-4 text-sm text-navy-400 hover:text-navy-600 dark:hover:text-navy-200">
            Close
          </button>
        )}
      </div>
    </div>
  );
}
