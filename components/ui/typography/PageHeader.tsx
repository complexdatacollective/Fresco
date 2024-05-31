import { Skeleton } from '~/components/ui/skeleton';
import Heading from './Heading';
import Paragraph from './Paragraph';

const PageHeader = ({
  headerText,
  subHeaderText,
}: {
  headerText: string;
  subHeaderText: string;
}) => (
  <div>
    <Heading variant="h1" className="mb-2">
      {headerText}
    </Heading>
    <Paragraph variant="lead">{subHeaderText}</Paragraph>
  </div>
);

const PageHeaderSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="bg-background-darker h-10 w-1/3" />
    <Skeleton className="bg-background-darker h-7 w-1/2" />
  </div>
);

export { PageHeaderSkeleton };
export default PageHeader;
