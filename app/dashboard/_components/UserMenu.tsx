import { logout } from '~/actions/auth';
import { Button } from '~/components/ui/Button';

const UserMenu = () => {
  return (
    <form action={logout}>
      <Button variant="secondary" size="sm" type="submit">
        Sign out
      </Button>
    </form>
  );
};

export default UserMenu;
