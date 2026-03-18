'use client';

import { use, useState } from 'react';
import { SuperJSON } from 'superjson';
import { deleteSyntheticData } from '~/actions/synthetic-interviews';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import { Button } from '~/components/ui/Button';
import InputField from '~/lib/form/components/fields/InputField';
import SelectField from '~/lib/form/components/fields/Select/Native';
import ProgressBar from '~/components/ui/ProgressBar';
import {
  type GetProtocolsQuery,
  type GetProtocolsReturnType,
} from '~/queries/protocols';

type SyntheticInterviewDataSectionProps = {
  protocolsPromise: GetProtocolsReturnType;
  initialCounts: { interviewCount: number; participantCount: number };
};

export default function SyntheticInterviewDataSection({
  protocolsPromise,
  initialCounts,
}: SyntheticInterviewDataSectionProps) {
  const rawProtocols = use(protocolsPromise);
  const protocols = SuperJSON.parse<GetProtocolsQuery>(rawProtocols);

  const [selectedProtocolId, setSelectedProtocolId] = useState<string>();
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [syntheticCounts, setSyntheticCounts] = useState(initialCounts);

  const handleGenerate = async () => {
    if (!selectedProtocolId) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: count });

    try {
      const response = await fetch('/api/generate-test-interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocolId: selectedProtocolId, count }),
      });

      if (!response.ok || !response.body) {
        setIsGenerating(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
          const dataLine = event
            .split('\n')
            .find((line) => line.startsWith('data: '));
          if (!dataLine) continue;

          const data = JSON.parse(dataLine.slice(6)) as {
            type: string;
            current?: number;
            total?: number;
            created?: number;
            message?: string;
          };

          if (data.type === 'progress' && data.current !== undefined) {
            setProgress({
              current: data.current,
              total: data.total ?? count,
            });
          } else if (data.type === 'complete' && data.created !== undefined) {
            const created = data.created;
            setSyntheticCounts((prev) => ({
              interviewCount: prev.interviewCount + created,
              participantCount: prev.participantCount + created,
            }));
          }
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSyntheticData();
      if (!result.error) {
        setSyntheticCounts({ interviewCount: 0, participantCount: 0 });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const progressPercent =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <SettingsCard
      id="synthetic-interview-data"
      title="Synthetic Interview Data"
      divideChildren
    >
      <SettingsField
        label="Generate Test Interviews"
        description="Generate synthetic interview data for testing. Select a protocol and specify how many interviews to create."
        testId="generate-synthetic-interviews"
      >
        <div className="tablet-landscape:flex-row flex flex-col gap-4">
          <SelectField
            name="Protocol"
            options={protocols.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            onChange={(value) => {
              if (typeof value === 'string') {
                setSelectedProtocolId(value);
              }
            }}
            value={selectedProtocolId}
            placeholder="Select a Protocol..."
          />
          <InputField
            name="count"
            type="number"
            min={1}
            max={1000}
            value={String(count)}
            onChange={(value) => setCount(Number(value))}
            disabled={isGenerating}
          />
          <Button
            disabled={!selectedProtocolId || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
        {isGenerating && (
          <div className="mt-4 space-y-2">
            <ProgressBar
              orientation="horizontal"
              percentProgress={progressPercent}
              nudge={false}
              label="Interview generation progress"
              className="h-2"
            />
            <p className="text-sm opacity-60">
              {progress.current} / {progress.total} interviews generated
            </p>
          </div>
        )}
      </SettingsField>
      <SettingsField
        label="Delete Test Interviews"
        description={`There are currently ${String(syntheticCounts.interviewCount)} synthetic interviews and ${String(syntheticCounts.participantCount)} test participants.`}
        testId="delete-synthetic-interviews"
        control={
          <Button
            color="destructive"
            disabled={syntheticCounts.interviewCount === 0 || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete All'}
          </Button>
        }
      />
    </SettingsCard>
  );
}
