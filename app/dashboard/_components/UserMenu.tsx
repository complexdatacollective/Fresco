import { logout } from '~/actions/auth';
import SubmitButton from '~/components/ui/SubmitButton';

const UserMenu = () => {
  return (
    <form action={() => void logout()}>
      <SubmitButton color="default" type="submit">
        Sign out
      </SubmitButton>
    </form>
  );
};

export default UserMenu;
