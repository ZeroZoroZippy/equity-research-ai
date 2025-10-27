import { motion } from 'framer-motion';
import clsx from 'clsx';

export function ProgressBar({ progress = 0, showPercentage = true, className = '' }) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-secondary font-medium">Progress</span>
        {showPercentage && (
          <span className="text-sm font-mono font-semibold text-accent">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-success relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer" />
        </motion.div>
      </div>
    </div>
  );
}
