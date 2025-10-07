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
    <Heading level="h1" variant="page-heading" className="mb-2">
      {headerText}
    </Heading>
    <Paragraph intent="lead">{subHeaderText}</Paragraph>
  </div>
);

export default PageHeader;
