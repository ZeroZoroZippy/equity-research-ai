import { motion } from 'framer-motion';
import clsx from 'clsx';

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-accent text-bg-primary hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-glow',
    secondary: 'bg-bg-secondary text-text-primary border border-border hover:border-accent/50 hover:bg-bg-tertiary',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
    danger: 'bg-danger text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
