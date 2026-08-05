'use client';

import { unparse } from 'papaparse';
import { useCallback } from 'react';

import { useToast } from '@codaco/fresco-ui/Toast';
import type { ParticipantExportRow } from '~/actions/participants';
import type { ProtocolWithInterviews } from '~/app/dashboard/_components/ProtocolsTable/ProtocolsTableClient';
import { useDownload } from '~/hooks/useDownload';

export function useExportParticipants(protocols: ProtocolWithInterviews[]) {
  const download = useDownload();
  const { add } = useToast();

  return useCallback(
    (participants: ParticipantExportRow[]) => {
      try {
        const csvData = participants.map((participant) => {
          const row: Record<string, string> = {
            id: participant.id,
            identifier: participant.identifier,
            label: participant.label ?? '',
          };

          for (const protocol of protocols) {
            const name = protocol.name.split('.')[0] ?? protocol.id;
            // The onboard route only reads `participantIdentifier`; this must
            // match the URL built by GenerateParticipantURLButton.
            row[`interview_url_${name}`] =
              `${window.location.origin}/onboard/${protocol.id}/?participantIdentifier=${encodeURIComponent(
                participant.identifier,
              )}`;
          }

          return row;
        });

        const csv = unparse(csvData, { header: true });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        download(url, 'participants.csv');
        URL.revokeObjectURL(url);

        add({
          title: 'Success',
          description: 'Participants exported successfully',
          variant: 'success',
        });
      } catch (error) {
        add({
          title: 'Error',
          description: 'An error occurred while exporting participants',
          variant: 'destructive',
        });
      }
    },
    [protocols, download, add],
  );
}
