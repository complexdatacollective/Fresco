import { type VersionedProtocol } from '@codaco/protocol-validation';
import 'server-only';
import { stringify } from 'superjson';
import { prisma } from '~/utils/db';

/**
 * Define the Prisma query logic for fetching all interviews separately
 * to infer the type from the return value.
 */
async function prisma_getInterviews() {
  return prisma.interview.findMany({
    include: {
      protocol: true,
      participant: true,
    },
  });
}
export type GetInterviewsQuery = Awaited<
  ReturnType<typeof prisma_getInterviews>
>;

/*export const getInterviews = createCachedFunction(async () => {
  const interviews = await prisma_getInterviews();
  const safeInterviews = stringify(interviews);
  return safeInterviews;
}, ['getInterviews']);*/
export const getInterviews = async () => {
  const interviews = await prisma_getInterviews();
  const safeInterviews = stringify(interviews);
  return safeInterviews;
};

export type GetInterviewsReturnType = ReturnType<typeof getInterviews>;
async function prisma_getInterviewsForExport(interviewIds: string[]) {
  return prisma.interview.findMany({
    where: {
      id: {
        in: interviewIds,
      },
    },
    include: {
      protocol: true,
      participant: true,
    },
  });
}
export type GetInterviewsForExportQuery = Awaited<
  ReturnType<typeof prisma_getInterviewsForExport>
>;

export const getInterviewsForExport = async (interviewIds: string[]) => {
  const interviews = await prisma_getInterviewsForExport(interviewIds);
  const safeInterviews = stringify(interviews);
  return safeInterviews;
};

/**
 * Because we use a client extension to parse the JSON fields, we can't use the
 * automatically generated types from the Prisma client (Prisma.InterviewGetPayload).
 *
 * Instead, we have to infer the type from the return value. To do this, we
 * have to define the function outside of getInterviewById.
 */
async function prisma_getInterviewById(interviewId: string) {
  return prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      protocol: {
        include: { assets: true },
        omit: {
          lastModified: true,
          hash: true,
        },
      },
    },
  });
}
export type GetInterviewByIdQuery = Awaited<
  ReturnType<typeof prisma_getInterviewById>
>;

// Note that this function should not be cached, because invalidating the cache
// would cause the interview route to reload, thereby clearing the redux store.
export const getInterviewById = async (interviewId: string) => {
  const interview = await prisma_getInterviewById(interviewId);

  if (!interview) {
    return null;
  }

  const protocol: VersionedProtocol = {
    schemaVersion: 8,
    codebook: {
      ego: {
        variables: {
          sex: {
            type: 'categorical',
            options: [
              { label: 'Female', value: 'female' },
              { label: 'Male', value: 'male' },
            ],
            validation: { required: true },
            name: 'sex',
          },
        },
      },
      node: {
        person: {
          name: 'Person',
          iconVariant: 'add-a-person',
          variables: {
            name: {
              name: 'Name',
              type: 'text',
              component: 'Text',
              validation: {
                required: true,
              },
            },
            age: {
              name: 'Age',
              type: 'number',
              component: 'Number',
              validation: {
                minValue: 0,
                maxValue: 120,
              },
            },
            cancer: {
              name: 'Cancer',
              type: 'boolean',
            },
            diabetes: {
              name: 'Diabetes',
              type: 'boolean',
            },
            glaucoma: {
              name: 'Glaucoma',
              type: 'boolean',
            },
          },
          color: 'node-color-seq-1',
        },
      },
      edge: {
        family: {
          name: 'Family Relationship',
          variables: {
            relationship: {
              name: 'Relationship Type',
              type: 'categorical',
              options: [
                { label: 'Parent', value: 'parent' },
                { label: 'Child', value: 'child' },
                { label: 'Sibling', value: 'sibling' },
                { label: 'Spouse', value: 'spouse' },
                { label: 'Other', value: 'other' },
              ],
            },
          },
          color: 'edge-color-seq-1',
        },
      },
    },
    stages: [
      { id: 'stage-0' },
      {
        id: 'stage-1',
        label: 'Family Tree Census',
        type: 'FamilyTreeCensus',
        subject: {
          entity: 'node',
          type: 'person',
        },
        edgeType: {
          entity: 'edge',
          type: 'family',
        },
        relationshipTypeVariable: 'relationship',
        sexVariable: 'sex',
        scaffoldingStep: {
          text: 'Create your family tree. You may add additional relatives by using the person icon in the bottom right corner. To remove any relative, drag toward the bottom center of the screen where a trash icon will appear.',
          showQuickStartModal: true,
        },
        nameGenerationStep: {
          text: 'Next, tap on each person to provide their name and age. If you don\'t know their name, you can write "Don\'t know".',
          form: {
            title: 'Add personal info',
            fields: [
              {
                variable: 'name',
                prompt: 'What is this person&#39;s name?\n',
              },
              {
                variable: 'age',
                prompt: 'What is this person&#39;s age?\n',
              },
            ],
          },
        },
        diseaseNominationStep: [
          {
            id: 'cancer',
            text: 'Tap on a person to indicate if they have ever been diagnosed with cancer.',
            variable: 'cancer',
          },
          {
            id: 'diabetes',
            text: 'Tap on a person to indicate if they have ever been diagnosed with diabetes.',
            variable: 'diabetes',
          },
          {
            id: 'glaucoma',
            text: 'Tap on a person to indicate if they have ever been diagnosed with glaucoma.',
            variable: 'glaucoma',
          },
        ],
      },
      { id: 'stage-2' },
    ],
  };

  // We need to superjsonify the result, because we pass it to the client
  // and it contains a Date object. We should look into if this could be
  // implemented in the Prisma client instead, or the createCachedFunction
  // helper (could be generalised to `createServerFunction`).
  // return safeInterview;
  return stringify({
    ...interview,
    protocol,
  });
};
