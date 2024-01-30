import { faker } from '@faker-js/faker';

const activityTypes = [
  'Protocol Installed',
  'Protocol Uninstalled',
  'Participant(s) Added',
  'Participant(s) Removed',
  'Participant(s) Updated',
  'Interview started',
  'Interview completed',
  'Data Exported',
] as const;

type ActivityType = typeof activityTypes[number];

const generateMessageForActivityType = (type: ActivityType) => {
  switch (type) {
    case 'Protocol Installed':
      return `Protocol "${faker.word.words({ count: 4 })}" installed`;
    case 'Protocol Uninstalled':
      return `Protocol "${faker.word.words({ count: 4 })}" uninstalled`;
    case 'Participant(s) Added':
      return `Added ${faker.number.int({ min: 1, max: 10 })} participant(s)`;
    case 'Participant(s) Removed':
      return `Removed ${faker.number.int({ min: 1, max: 10 })} participant(s)`;
    case 'Participant(s) Updated':
      return `Updated ${faker.number.int({ min: 1, max: 10 })} participant(s)`;
    case 'Interview started':
      return `Participant "${faker.name.firstName()}" started an interview`;
    case 'Interview completed':
      return `Participant "${faker.name.firstName()}" completed an interview`;
    case 'Data Exported':
      return `Exported data for ${faker.number.int({
        min: 1,
        max: 10,
      })} participant(s)`;
  }
}

const generateMockActivity = () => {
  const type = faker.helpers.arrayElement(activityTypes);
return {
  id: faker.string.uuid(),
  timestamp: faker.date.recent(),
  invalid: faker.datatype.boolean(),
  type,
  message: generateMessageForActivityType(type),
};
};

const activities = Array.from({ length: 100 }, generateMockActivity);

const getActivities = () => new Promise((resolve) => resolve(activities)) 

export const ActivityFeed = async () => {
  const activities = await getActivities();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <Heading variant="h3">Activity</Heading>
        <Button variant="primary">Clear</Button>
      </div>
      <div className="flex flex-col gap-4">
        {activities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
