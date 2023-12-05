import SectionHeading from '../_components/SectionHeading';
import ProtocolUploaderExample from './_components/ProtocolUploaderExample';

const Page = () => {
  return (
    <div className="lg:pl-72">
      <div className="py-4">
        <div className="px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Protocols Management View" />

          <ProtocolUploaderExample />
        </div>
      </div>
    </div>
  );
};

export default Page;
