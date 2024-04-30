import { logout } from '~/actions/auth';
import SubmitButton from '~/components/ui/SubmitButton';

const UserMenu = () => {
  return (
    <form action={logout}>
      <SubmitButton variant="secondary" size="sm" type="submit">
        Sign out
      </SubmitButton>
    </form>
  );
};

export default UserMenu;
