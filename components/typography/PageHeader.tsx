import Heading from './Heading';
import Paragraph from './Paragraph';

type PageHeaderProps = {
  headerText: string;
  subHeaderText: string;
} & React.HTMLAttributes<HTMLDivElement>;

const PageHeader = ({
  headerText,
  subHeaderText,
  className,
  ...props
}: PageHeaderProps) => (
  <div className={className ?? 'mx-auto max-w-3xl'} {...props}>
    <Heading level="h1" variant="page-heading" margin="none">
      {headerText}
    </Heading>
    <Paragraph intent="lead">{subHeaderText}</Paragraph>
  </div>
);

export default PageHeader;
