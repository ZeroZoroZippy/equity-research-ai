import clsx from 'clsx';

export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className = '',
  uppercase = false,
  icon: Icon,
  ...props
}) {
  const handleChange = (e) => {
    const val = uppercase ? e.target.value.toUpperCase() : e.target.value;
    onChange?.(val);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-text-secondary text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
            <Icon size={20} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className={clsx(
            'w-full bg-bg-secondary border border-border rounded-lg px-4 py-3 text-text-primary',
            'placeholder:text-text-secondary/50',
            'focus:outline-none focus:border-accent focus:shadow-glow',
            'transition-all duration-200',
            Icon && 'pl-12',
            error && 'border-danger',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
