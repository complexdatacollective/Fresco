export const importStatuses = [
  'Waiting to begin',
  'Extracting protocol',
  'Validating protocol',
  'Uploading assets',
  'Finishing up',
  'Complete',
] as const;

export type ActiveImportStep = (typeof importStatuses)[number];

export type BaseImportStatus = {
  activeStep: ActiveImportStep;
};

export type UploadingImportStatus = BaseImportStatus & {
  activeStep: 'Uploading assets';
  progress: number;
};

export type ImportStatus = BaseImportStatus | UploadingImportStatus;

export type ErrorState = {
  title: string;
  description: React.ReactNode;
  additionalContent?: React.ReactNode;
};

export type ImportJob = {
  id: string;
  file: File;
  status: ImportStatus;
  error?: ErrorState;
};

export const jobInitialState = [];

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
    activeStep: ActiveImportStep;
    progress?: number;
  };
};

type UpdateErrorAction = {
  type: 'UPDATE_ERROR';
  payload: {
    id: string;
    error: ErrorState;
  };
};

type Action =
  | AddJobAction
  | RemoveJobAction
  | UpdateJobStatusAction
  | UpdateErrorAction;

export function jobReducer(state: ImportJob[], action: Action) {
  switch (action.type) {
    case 'ADD_JOB': {
      const newJob: ImportJob = {
        id: action.payload.file.name,
        file: action.payload.file,
        status: {
          activeStep: 'Waiting to begin',
        },
      };

      return [...state, newJob];
    }
    case 'REMOVE_JOB':
      return state.filter((job) => job.id !== action.payload.id);
    case 'UPDATE_STATUS': {
      const { id, activeStep } = action.payload;
      const job = state.find((job) => job.id === id);

      if (!job) {
        return state;
      }

      return state.map((job) => {
        if (job.id === id) {
          // Asset upload is the only step that has a progress bar
          if (activeStep === 'Uploading assets') {
            return {
              ...job,
              status: {
                activeStep,
                progress: action.payload.progress,
              },
            };
          }

          return {
            ...job,
            status: { activeStep },
          };
        }

        return job;
      });
    }
    case 'UPDATE_ERROR': {
      const { id, error } = action.payload;
      const job = state.find((job) => job.id === id);

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
      throw new Error();
  }
}
