import { FileText } from 'lucide-react';
import { completeOnboarding } from '~/actions/appSettings';
import Section from '~/components/layout/Section';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import SubmitButton from '~/components/ui/SubmitButton';

function Documentation() {
  return (
    <div className="max-w-[30rem]">
      <div className="mb-4">
        <Heading variant="h2">Documentation</Heading>
        <Paragraph>
          This is the end of the onboarding process. You are now ready to use
          Fresco! For further help and information, consider using the resources
          below.
        </Paragraph>
      </div>
      <div className="flex flex-col gap-2">
        <Section classNames="flex gap-10">
          <div className="flex-1">
            <Heading variant="h4-all-caps" className="mb-2">
              About Fresco
            </Heading>
            Visit our documentation site to learn more about Fresco.
          </div>
          <div className="flex min-w-32 shrink-0 flex-col items-end justify-center">
            <a
              href="https://documentation.networkcanvas.com/en/fresco"
              target="_blank"
            >
              <Button variant="outline" size="icon">
                <FileText />
              </Button>
            </a>
          </div>
        </Section>
        <Section classNames="flex gap-10">
          <div className="flex-1">
            <Heading variant="h4-all-caps" className="mb-2">
              Using Fresco
            </Heading>
            Read our guide on the basic workflow for using Fresco to conduct
            your study.
          </div>
          <div className="flex min-w-32 shrink-0 flex-col items-end justify-center">
            <a
              href="https://documentation.networkcanvas.com/en/fresco/using-fresco"
              target="_blank"
            >
              <Button variant="outline" size="icon">
                <FileText />
              </Button>
            </a>
          </div>
        </Section>
      </div>

      <div className="flex justify-end pt-12">
        <form action={completeOnboarding}>
          <SubmitButton variant="default">Go to the dashboard!</SubmitButton>
        </form>
      </div>
    </div>
  );
}

export default Documentation;
