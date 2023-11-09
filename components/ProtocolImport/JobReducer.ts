import type { ErrorState } from '~/hooks/useProtocolImport';
import {
  type JobStatusAction,
  jobStatusInitialState,
  jobStatusReducer,
  type JobStatusState,
} from './JobProgressReducer';

export type ImportJob = {
  id: string;
  file: File;
  status: JobStatusState;
  error?: ErrorState;
};

export const jobInitialState: ImportJob[] = [];

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

type UpdateStatusAction = JobStatusAction & {
  payload: {
    id: string;
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
  | UpdateStatusAction
  | UpdateErrorAction;

export function jobReducer(state: ImportJob[], action: Action) {
  switch (action.type) {
    case 'ADD_JOB': {
      const newJob = {
        id: action.payload.file.name,
        file: action.payload.file,
        status: jobStatusReducer(jobStatusInitialState),
      };

      return [...state, newJob];
    }
    case 'REMOVE_JOB':
      return state.filter((job) => job.id !== action.payload.id);
    case 'UPDATE_STATUS': {
      const { id } = action.payload;
      const job = state.find((job) => job.id === id);

      if (!job) {
        return state;
      }

      return state.map((job) => {
        if (job.id === id) {
          return {
            ...job,
            status: jobStatusReducer(job.status, action),
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
