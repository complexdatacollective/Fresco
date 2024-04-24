import { logoutAction } from '~/app/_actions';
import { Button } from '~/components/ui/Button';

const UserMenu = () => {
  return (
    <form action={logoutAction}>
      <Button variant="secondary" size="sm" type="submit">
        Sign out
      </Button>
    </form>
  );
};

export default UserMenu;
