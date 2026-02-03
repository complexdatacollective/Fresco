'use client';

import { useState } from 'react';
import Dialog, { DialogFooter } from '~/lib/dialogs/Dialog';
import Button from '~/components/ui/Button';
import { Checkbox } from '~/components/ui/Checkbox';
import { Label } from '~/components/ui/Label';
import {
  conflictResolver,
  type ConflictDiff,
} from '~/lib/offline/conflictResolver';

type ConflictItem = {
  interviewId: string;
  localData: string;
  serverData: string;
};

type ConflictResolutionDialogProps = {
  conflicts: ConflictItem[];
  open: boolean;
  onClose: () => void;
  onResolved: () => void;
};

export default function ConflictResolutionDialog({
  conflicts,
  open,
  onClose,
  onResolved,
}: ConflictResolutionDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [applyToAll, setApplyToAll] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const currentConflict = conflicts[currentIndex];

  if (!currentConflict) {
    return null;
  }

  const localData = JSON.parse(currentConflict.localData);
  const serverData = JSON.parse(currentConflict.serverData);
  const diff = conflictResolver.computeDiff(localData, serverData);

  const showApplyToAll = conflicts.length >= 6;

  const handleResolve = async (
    action: 'keepLocal' | 'keepServer' | 'keepBoth',
  ) => {
    setIsResolving(true);

    try {
      const conflictsToResolve = applyToAll ? conflicts : [currentConflict];

      for (const conflict of conflictsToResolve) {
        if (action === 'keepLocal') {
          await conflictResolver.resolveKeepLocal(conflict.interviewId);
        } else if (action === 'keepServer') {
          await conflictResolver.resolveKeepServer(conflict.interviewId);
        } else {
          await conflictResolver.resolveKeepBoth(conflict.interviewId);
        }
      }

      if (applyToAll || currentIndex === conflicts.length - 1) {
        onResolved();
        onClose();
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dialog
      open={open}
      closeDialog={onClose}
      title="Resolve Interview Conflict"
      description={
        conflicts.length > 1
          ? `Conflict ${currentIndex + 1} of ${conflicts.length}`
          : undefined
      }
      accent="destructive"
      footer={
        <DialogFooter>
          <Button
            variant="outline"
            color="destructive"
            onClick={() => handleResolve('keepServer')}
            disabled={isResolving}
          >
            Keep Server
          </Button>
          <Button
            variant="outline"
            color="destructive"
            onClick={() => handleResolve('keepBoth')}
            disabled={isResolving}
          >
            Keep Both
          </Button>
          <Button
            color="destructive"
            onClick={() => handleResolve('keepLocal')}
            disabled={isResolving}
          >
            Keep Local
          </Button>
        </DialogFooter>
      }
    >
      <div className="space-y-4">
        <p className="text-sm opacity-80">
          Changes were made to this interview both locally and on the server.
          Choose which version to keep.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded border p-4">
            <h3 className="mb-2 font-semibold">Local Version</h3>
            <DiffSummary diff={diff} side="local" />
          </div>

          <div className="rounded border p-4">
            <h3 className="mb-2 font-semibold">Server Version</h3>
            <DiffSummary diff={diff} side="server" />
          </div>
        </div>

        <div className="space-y-2 rounded bg-black/5 p-4">
          <h4 className="font-medium">Changes Summary</h4>
          <ul className="space-y-1 text-sm">
            {diff.nodesAdded > 0 && (
              <li>
                {diff.nodesAdded} node{diff.nodesAdded > 1 ? 's' : ''} added
                locally
              </li>
            )}
            {diff.nodesRemoved > 0 && (
              <li>
                {diff.nodesRemoved} node{diff.nodesRemoved > 1 ? 's' : ''}{' '}
                removed locally
              </li>
            )}
            {diff.nodesModified > 0 && (
              <li>
                {diff.nodesModified} node{diff.nodesModified > 1 ? 's' : ''}{' '}
                modified locally
              </li>
            )}
            {diff.edgesAdded > 0 && (
              <li>
                {diff.edgesAdded} edge{diff.edgesAdded > 1 ? 's' : ''} added
                locally
              </li>
            )}
            {diff.edgesRemoved > 0 && (
              <li>
                {diff.edgesRemoved} edge{diff.edgesRemoved > 1 ? 's' : ''}{' '}
                removed locally
              </li>
            )}
            {diff.edgesModified > 0 && (
              <li>
                {diff.edgesModified} edge{diff.edgesModified > 1 ? 's' : ''}{' '}
                modified locally
              </li>
            )}
            {diff.egoChanged && <li>Ego attributes changed locally</li>}
            {diff.stepChanged && (
              <li>
                Interview step changed (local: step{' '}
                {(localData as { currentStep: number }).currentStep}, server:
                step {(serverData as { currentStep: number }).currentStep})
              </li>
            )}
          </ul>
        </div>

        {showApplyToAll && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply-to-all"
              checked={applyToAll}
              onCheckedChange={(checked) => setApplyToAll(Boolean(checked))}
            />
            <Label htmlFor="apply-to-all">
              Apply this resolution to all {conflicts.length} conflicts
            </Label>
          </div>
        )}
      </div>
    </Dialog>
  );
}

type DiffSummaryProps = {
  diff: ConflictDiff;
  side: 'local' | 'server';
};

function DiffSummary({ diff, side }: DiffSummaryProps) {
  const isLocal = side === 'local';

  const nodeCount = isLocal
    ? diff.nodesAdded - diff.nodesRemoved
    : -diff.nodesAdded + diff.nodesRemoved;

  const edgeCount = isLocal
    ? diff.edgesAdded - diff.edgesRemoved
    : -diff.edgesAdded + diff.edgesRemoved;

  return (
    <div className="space-y-1 text-sm">
      <div>
        <span className="opacity-70">Nodes:</span> {nodeCount > 0 && '+'}
        {nodeCount}
        {diff.nodesModified > 0 && ` (${diff.nodesModified} modified)`}
      </div>
      <div>
        <span className="opacity-70">Edges:</span> {edgeCount > 0 && '+'}
        {edgeCount}
        {diff.edgesModified > 0 && ` (${diff.edgesModified} modified)`}
      </div>
      {diff.egoChanged && <div className="opacity-70">Ego data changed</div>}
    </div>
  );
}
