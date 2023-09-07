import Image from 'next/image';
import Beam from '~/public/images/beam.svg';
import { NavButton } from './NavigationBar';

const UserMenu = () => {
  return (
    <div className="flex flex-row items-center gap-6">
      <NavButton href="/api/auth/signout">Sign out</NavButton>
      <Image
        src={Beam}
        alt="Beam"
        width={60}
        height={60}
        className="h-12 w-12 rounded-full"
      />
    </div>
  );
};

export default UserMenu;
