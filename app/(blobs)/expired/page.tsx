import { resetAppSettings } from '~/actions/reset';
import { containerClasses } from '~/components/ContainerClasses';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import SubmitButton from '~/components/ui/SubmitButton';
import { env } from '~/env';
import { cx } from '~/utils/cva';

export default function Page() {
  return (
    <Surface className={cx(containerClasses)} elevation="none" maxWidth="md">
      <Heading level="h1">Installation expired</Heading>
      <Paragraph intent="lead">
        You did not configure this deployment of Fresco in time, and it has now
        been locked down for your security.
      </Paragraph>
      <Paragraph>
        Please redeploy a new instance of Fresco to continue using the software.
      </Paragraph>
      {env.NODE_ENV === 'development' && (
        <form action={resetAppSettings}>
          <SubmitButton className="mt-6 max-w-80" type="submit">
            Dev mode: Reset Configuration
          </SubmitButton>
        </form>
      )}
    </Surface>
  );
}
