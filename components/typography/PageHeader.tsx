import Heading from './Heading';
import Paragraph from './Paragraph';

const PageHeader = ({
  headerText,
  subHeaderText,
}: {
  headerText: string;
  subHeaderText: string;
}) => (
  <div className="mx-auto max-w-3xl">
    <Heading level="h1" variant="page-heading" margin="none">
      {headerText}
    </Heading>
    <Paragraph intent="lead">{subHeaderText}</Paragraph>
  </div>
);

export default PageHeader;
