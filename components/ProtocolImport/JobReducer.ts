import trackEvent from '~/lib/analytics';

const importStatuses = [
  'Queued',
  'Extracting protocol',
  'Validating protocol',
  'Uploading assets',
  'Writing to database',
  'Complete',
] as const;

type ImportStatus = (typeof importStatuses)[number];

type ErrorState = {
  title: string;
  description: React.ReactNode;
  additionalContent?: React.ReactNode;
};

export type ImportJob = {
  id: string;
  file: File;
  status: ImportStatus;
  progress: number | null;
  error?: ErrorState;
  rawError?: Error;
};

export const jobInitialState = [];

type ClearJobsAction = {
  type: 'CLEAR_JOBS';
};

type AddJobAction = {
  type: 'ADD_JOB';
  payload: {
    file: File;
  };
};

type RemoveJobAction = {
  type: 'REMOVE_JOB';
  payload: {
    id: string;
  };
};

type UpdateJobStatusAction = {
  type: 'UPDATE_STATUS';
  payload: {
    id: string;
    status: ImportStatus;
    progress?: number;
  };
};

type UpdateErrorAction = {
  type: 'UPDATE_ERROR';
  payload: {
    id: string;
    error: ErrorState;
    rawError: Error;
  };
};

type Action =
  | ClearJobsAction
  | AddJobAction
  | RemoveJobAction
  | UpdateJobStatusAction
  | UpdateErrorAction;

export function jobReducer(state: ImportJob[], action: Action) {
  switch (action.type) {
    case 'CLEAR_JOBS': {
      return [];
    }
    case 'ADD_JOB': {
      const newJob: ImportJob = {
        id: action.payload.file.name,
        file: action.payload.file,
        status: 'Queued',
        progress: null,
      };

      return [...state, newJob];
    }
    case 'REMOVE_JOB':
      return state.filter((job) => job.id !== action.payload.id);
    case 'UPDATE_STATUS': {
      const { id, status, progress } = action.payload;
      const job = state.find((job) => job.id === id);

      if (!job) {
        return state;
      }

      // Send event to analytics when complete.
      if (status === 'Complete') {
        const { name: fileName } = job.file;
        void trackEvent({
          type: 'ProtocolInstalled',
          metadata: {
            protocol: fileName,
          },
        });
      }

      return state.map((job) => {
        if (job.id === id) {
          return {
            ...job,
            status,
            progress: progress ?? null, // Reset progress to null when it isn't provided
          };
        }

        return job;
      });
    }
    case 'UPDATE_ERROR': {
      const { id, error, rawError } = action.payload;
      const job = state.find((job) => job.id === id);

      void trackEvent({
        type: 'Error',
        name: rawError.name,
        message: rawError.message,
        stack: rawError.stack,
        metadata: {
          error,
          path: '/components/ProtocolImport/JobReducer.ts',
        },
      });

      if (!job) {
        return state;
      }

      return state.map((job) => {
        if (job.id === id) {
          return {
            ...job,
            error,
          };
        }

        return job;
      });
    }
    default:
      throw new Error('Unknown error occured');
  }
}
