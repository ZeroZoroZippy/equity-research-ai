import { motion } from 'framer-motion';
import clsx from 'clsx';

export function Card({
  children,
  onClick,
  hover = false,
  className = '',
  ...props
}) {
  const baseStyles = 'bg-bg-secondary border border-border rounded-xl p-6 transition-all duration-200';
  const hoverStyles = hover
    ? 'cursor-pointer hover:border-accent/50 hover:shadow-glow hover:-translate-y-1'
    : '';

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className={clsx(baseStyles, hoverStyles, className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={clsx(baseStyles, className)} {...props}>
      {children}
    </div>
  );
}
