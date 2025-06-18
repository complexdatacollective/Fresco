import { logout } from '~/actions/auth';
import SubmitButton from '~/components/ui/SubmitButton';

const UserMenu = () => {
  return (
    <form action={() => void logout()}>
      <SubmitButton
        variant="secondary"
        size="sm"
        type="submit"
        data-testid="logout-button"
      >
        Sign out
      </SubmitButton>
    </form>
  );
};

export default UserMenu;
