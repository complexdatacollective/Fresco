import { enableMapSet } from 'immer';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

enableMapSet();

export type ImportPhase =
  | 'queued'
  | 'parsing'
  | 'validating'
  | 'checking-duplicates'
  | 'extracting-assets'
  | 'uploading-assets'
  | 'saving'
  | 'complete'
  | 'error';

export type ImportJob = {
  id: string;
  fileName: string;
  file: File;
  phase: ImportPhase;
  progress: number;
  error: string | null;
};

export type ProtocolImportStore = {
  jobs: Map<string, ImportJob>;
  isDialogOpen: boolean;

  openDialog: () => void;
  closeDialog: () => void;
  addJob: (id: string, fileName: string, file: File) => void;
  updateJobPhase: (id: string, phase: ImportPhase) => void;
  updateJobProgress: (id: string, progress: number) => void;
  setJobError: (id: string, error: string) => void;
  removeJob: (id: string) => void;
  clearCompletedJobs: () => void;
  hasActiveJobs: () => boolean;
  getJob: (id: string) => ImportJob | undefined;
};

export type ProtocolImportStoreApi = ReturnType<
  typeof createProtocolImportStore
>;

export const createProtocolImportStore = () => {
  return createStore<ProtocolImportStore>()(
    immer((set, get) => ({
      jobs: new Map(),
      isDialogOpen: false,

      openDialog: () => {
        set((state) => {
          state.isDialogOpen = true;
        });
      },

      closeDialog: () => {
        set((state) => {
          state.isDialogOpen = false;
        });
      },

      addJob: (id, fileName, file) => {
        set((state) => {
          state.jobs.set(id, {
            id,
            fileName,
            file,
            phase: 'queued',
            progress: 0,
            error: null,
          });
        });
      },

      updateJobPhase: (id, phase) => {
        set((state) => {
          const job = state.jobs.get(id);
          if (job) {
            job.phase = phase;
            if (phase !== 'uploading-assets') {
              job.progress = 0;
            }
          }
        });
      },

      updateJobProgress: (id, progress) => {
        set((state) => {
          const job = state.jobs.get(id);
          if (job) {
            job.progress = progress;
          }
        });
      },

      setJobError: (id, error) => {
        set((state) => {
          const job = state.jobs.get(id);
          if (job) {
            job.phase = 'error';
            job.error = error;
          }
        });
      },

      removeJob: (id) => {
        set((state) => {
          state.jobs.delete(id);
        });
      },

      clearCompletedJobs: () => {
        set((state) => {
          const jobsToRemove: string[] = [];
          state.jobs.forEach((job, id) => {
            if (job.phase === 'complete' || job.phase === 'error') {
              jobsToRemove.push(id);
            }
          });
          jobsToRemove.forEach((id) => state.jobs.delete(id));
        });
      },

      hasActiveJobs: () => {
        const { jobs } = get();
        return Array.from(jobs.values()).some(
          (job) => job.phase !== 'complete' && job.phase !== 'error',
        );
      },

      getJob: (id) => {
        return get().jobs.get(id);
      },
    })),
  );
};
