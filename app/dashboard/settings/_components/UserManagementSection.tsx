import SettingsCard from '~/components/settings/SettingsCard';
import { prisma } from '~/lib/db';
import { getUsers } from '~/queries/users';
import UserManagement from './UserManagement';

async function getHasTwoFactor(userId: string) {
  const result = await prisma.totpCredential.findFirst({
    where: { user_id: userId, verified: true },
    select: { id: true },
  });

  return !!result;
}

export default function UserManagementSection({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const usersPromise = getUsers();
  const hasTwoFactorPromise = getHasTwoFactor(userId);

  return (
    <SettingsCard id="user-management" title="User Management">
      <UserManagement
        usersPromise={usersPromise}
        hasTwoFactorPromise={hasTwoFactorPromise}
        currentUserId={userId}
        currentUsername={username}
      />
    </SettingsCard>
  );
}
