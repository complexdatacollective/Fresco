// Item Types
export const ItemTypes = [
  'ROSTER_NODE',
  'INTERVIEW_NODE',
  'EXISTING_NODE',
] as const;

export type ItemType = (typeof ItemTypes)[number];
