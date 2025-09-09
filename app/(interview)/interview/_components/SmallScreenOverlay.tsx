import Image from 'next/image';
import { env } from 'node:process';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { getAppSetting } from '~/queries/appSettings';

const SmallScreenOverlay = async () => {
  const disableSmallScreenOverlay = await getAppSetting(
    'disableSmallScreenOverlay',
  );
  if (disableSmallScreenOverlay || env.NODE_ENV === 'development') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--nc-background) lg:hidden">
      <div className="flex max-w-[72ch] flex-col items-center justify-center p-6 text-center">
        <Image
          src="/images/too-small.svg"
          width={300}
          height={300}
          alt="Screen too small"
        />
        <Heading variant="h1">Screen Size Too Small</Heading>
        <Heading variant="h4"></Heading>
        <Paragraph style="lead">
          To complete this interview, please use a device with a larger screen,
          or maximize your browser window.
        </Paragraph>
        <Paragraph className="mt-16!">
          <strong>Note:</strong> it is not possible to complete this interview
          using a mobile phone.
        </Paragraph>
      </div>
    </div>
  );
};

export default SmallScreenOverlay;
