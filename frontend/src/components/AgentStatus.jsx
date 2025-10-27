import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function AgentStatus({ agent, index }) {
  const { name, icon, status } = agent;

  const statusConfig = {
    complete: {
      icon: Check,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      text: 'Complete',
    },
    active: {
      icon: Loader2,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/50',
      text: 'Active...',
      animate: true,
    },
    queued: {
      icon: null,
      color: 'text-text-secondary',
      bgColor: 'bg-bg-tertiary',
      borderColor: 'border-border',
      text: 'Queued',
    },
  };

  const config = statusConfig[status] || statusConfig.queued;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={clsx(
        'flex items-center gap-3 p-4 rounded-lg border transition-all duration-200',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-text-primary">{name}</div>
        <div className={clsx('text-sm', config.color)}>{config.text}</div>
      </div>
      {StatusIcon && (
        <div className={config.color}>
          {config.animate ? (
            <StatusIcon className="animate-spin" size={20} />
          ) : (
            <StatusIcon size={20} />
          )}
        </div>
      )}
    </motion.div>
  );
}
