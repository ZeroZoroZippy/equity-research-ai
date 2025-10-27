import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-text-secondary text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            'w-full bg-bg-secondary border border-border rounded-lg px-4 py-3 text-text-primary',
            'focus:outline-none focus:border-accent focus:shadow-glow',
            'transition-all duration-200 appearance-none cursor-pointer',
            className
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          size={20}
        />
      </div>
    </div>
  );
}
