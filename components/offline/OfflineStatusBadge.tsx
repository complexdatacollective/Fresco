import { Badge } from '~/components/ui/badge';
import { cva, type VariantProps } from '~/utils/cva';
import { cx } from '~/utils/cva';

const offlineStatusVariants = cva({
  base: '',
  variants: {
    status: {
      'online-only': 'border-current/20 text-current',
      'downloading': 'border-info bg-info/10 text-info animate-pulse',
      'available-offline': 'border-success bg-success/10 text-success',
      'sync-required': 'border-warning bg-warning/10 text-warning',
    },
  },
  defaultVariants: {
    status: 'online-only',
  },
});

export type OfflineStatus =
  | 'online-only'
  | 'downloading'
  | 'available-offline'
  | 'sync-required';

const statusLabels: Record<OfflineStatus, string> = {
  'online-only': 'Online Only',
  'downloading': 'Downloading',
  'available-offline': 'Available Offline',
  'sync-required': 'Sync Required',
};

export type OfflineStatusBadgeProps = {
  status: OfflineStatus;
} & React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof offlineStatusVariants>;

export function OfflineStatusBadge({
  status,
  className,
  ...props
}: OfflineStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cx(offlineStatusVariants({ status }), className)}
      {...props}
    >
      {statusLabels[status]}
    </Badge>
  );
}
