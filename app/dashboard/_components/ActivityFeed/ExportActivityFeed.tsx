'use client';

import { FileUp } from 'lucide-react';
import { unparse } from 'papaparse';
import { useTransition } from 'react';
import { getActivitiesForExport } from '~/actions/activityFeed';
import { Button } from '@codaco/fresco-ui/Button';
import { useToast } from '@codaco/fresco-ui/Toast';
import { useDownload } from '~/hooks/useDownload';

export default function ExportActivityFeed() {
  const download = useDownload();
  const { add } = useToast();
  const [isPending, startTransition] = useTransition();

  const exportActivityFeed = () => {
    startTransition(async () => {
      try {
        const activities = await getActivitiesForExport();

        const csvData = activities.map((activity) => ({
          timestamp: activity.timestamp.toISOString(),
          type: activity.type,
          details: activity.message,
        }));

        const csv = unparse(csvData, { header: true });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        download(url, 'activity-feed.csv');
        URL.revokeObjectURL(url);

        add({
          title: 'Success',
          description: 'Activity feed exported successfully',
          variant: 'success',
        });
      } catch (error) {
        add({
          title: 'Error',
          description: 'An error occurred while exporting the activity feed',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Button
      disabled={isPending}
      onClick={exportActivityFeed}
      icon={<FileUp />}
      data-testid="export-activity-feed-button"
    >
      Export CSV
    </Button>
  );
}
