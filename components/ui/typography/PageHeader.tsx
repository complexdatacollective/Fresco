import Heading from './Heading';
import Paragraph from './Paragraph';

const PageHeader = ({
  headerText,
  subHeaderText,
  'data-testid': dataTestId,
}: {
  headerText: string;
  subHeaderText: string;
  'data-testid'?: string;
}) => (
  <div data-testid={dataTestId}>
    <Heading variant="h1" className="mb-2">
      {headerText}
    </Heading>
    <Paragraph variant="lead">{subHeaderText}</Paragraph>
  </div>
);

export default PageHeader;
