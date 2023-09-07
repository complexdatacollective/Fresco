import Image from 'next/image';
import Beam from '~/public/images/beam.svg';

const UserMenu = () => {
  return (
    <div className="flex justify-center">
      <Image
        src={Beam}
        alt="Beam"
        width={60}
        height={60}
        className="h-12 w-12 rounded-full"
      />
      <form action="/api/auth/signout" method="POST">
        <input type="submit" value="Sign out" />
      </form>
    </div>
  );
};

export default UserMenu;
