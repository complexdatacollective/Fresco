'use client';

import { FileText } from 'lucide-react';

import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import Button from '@codaco/fresco-ui/Button';
import Surface from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { completeSetup } from '~/actions/appSettings';

const messages = defineMessages({
  documentation: {
    id: 'fresco.OnboardSteps.Documentation.documentation',
    defaultMessage: 'Documentation',
    description:
      'Researcher-facing OnboardSteps / Documentation: Documentation',
  },
  thisIsTheEndOfTheOnboarding: {
    id: 'fresco.OnboardSteps.Documentation.thisIsTheEndOfTheOnboarding',
    defaultMessage:
      'This is the end of the onboarding process. You are now ready to use Fresco! For further help and information, consider using the resources below.',
    description:
      'Researcher-facing OnboardSteps / Documentation: This is the end of the onboarding process. You are now ready to use Fresco! For further help and information, consider u',
  },
  aboutFrescoVisitOurDocumentationSiteTo: {
    id: 'fresco.OnboardSteps.Documentation.aboutFrescoVisitOurDocumentationSiteTo',
    defaultMessage:
      'About Fresco — visit our documentation site to learn more (opens in a new tab)',
    description:
      'Researcher-facing OnboardSteps / Documentation: About Fresco — visit our documentation site to learn more (opens in a new tab)',
  },
  aboutFresco: {
    id: 'fresco.OnboardSteps.Documentation.aboutFresco',
    defaultMessage: 'About Fresco',
    description: 'Researcher-facing OnboardSteps / Documentation: About Fresco',
  },
  visitOurDocumentationSiteToLearnMore: {
    id: 'fresco.OnboardSteps.Documentation.visitOurDocumentationSiteToLearnMore',
    defaultMessage: 'Visit our documentation site to learn more about Fresco.',
    description:
      'Researcher-facing OnboardSteps / Documentation: Visit our documentation site to learn more about Fresco.',
  },
  usingFrescoVisitOurDocumentationSiteFor: {
    id: 'fresco.OnboardSteps.Documentation.usingFrescoVisitOurDocumentationSiteFor',
    defaultMessage:
      'Using Fresco — visit our documentation site for a usage guide (opens in a new tab)',
    description:
      'Researcher-facing OnboardSteps / Documentation: Using Fresco — visit our documentation site for a usage guide (opens in a new tab)',
  },
  usingFresco: {
    id: 'fresco.OnboardSteps.Documentation.usingFresco',
    defaultMessage: 'Using Fresco',
    description: 'Researcher-facing OnboardSteps / Documentation: Using Fresco',
  },
  readOurGuideOnTheBasicWorkflow: {
    id: 'fresco.OnboardSteps.Documentation.readOurGuideOnTheBasicWorkflow',
    defaultMessage:
      'Read our guide on the basic workflow for using Fresco to conduct your study.',
    description:
      'Researcher-facing OnboardSteps / Documentation: Read our guide on the basic workflow for using Fresco to conduct your study.',
  },
  goToTheDashboard: {
    id: 'fresco.OnboardSteps.Documentation.goToTheDashboard',
    defaultMessage: 'Go to the dashboard!',
    description:
      'Researcher-facing OnboardSteps / Documentation: Go to the dashboard!',
  },
});

export default function Documentation() {
  const intl = useAppIntl();

  return (
    <div className="w-full">
      <div className="mb-12">
        <Heading level="h2">
          {intl.formatMessage(messages.documentation)}
        </Heading>
        <Paragraph>
          {intl.formatMessage(messages.thisIsTheEndOfTheOnboarding)}
        </Paragraph>
      </div>
      <div className="flex flex-col gap-4">
        <a
          href="https://documentation.networkcanvas.com/en/fresco"
          target="_blank"
          rel="noreferrer"
          aria-label={intl.formatMessage(
            messages.aboutFrescoVisitOurDocumentationSiteTo,
          )}
        >
          <Surface className="flex gap-8">
            <div className="flex-1">
              <Heading level="h4" variant="all-caps" className="mb-2">
                {intl.formatMessage(messages.aboutFresco)}
              </Heading>
              {intl.formatMessage(
                messages.visitOurDocumentationSiteToLearnMore,
              )}
            </div>
            <div className="flex min-w-32 shrink-0 flex-col items-end justify-center">
              <FileText />
            </div>
          </Surface>
        </a>
        <a
          href="https://documentation.networkcanvas.com/en/fresco/using-fresco"
          target="_blank"
          rel="noreferrer"
          aria-label={intl.formatMessage(
            messages.usingFrescoVisitOurDocumentationSiteFor,
          )}
        >
          <Surface className="flex gap-10">
            <div className="flex-1">
              <Heading level="h4" variant="all-caps" className="mb-2">
                {intl.formatMessage(messages.usingFresco)}
              </Heading>
              {intl.formatMessage(messages.readOurGuideOnTheBasicWorkflow)}
            </div>
            <div className="flex min-w-32 shrink-0 flex-col items-end justify-center">
              <FileText />
            </div>
          </Surface>
        </a>
      </div>

      <div className="flex justify-end pt-12">
        <form action={completeSetup}>
          <Button type="submit" color="primary">
            {intl.formatMessage(messages.goToTheDashboard)}
          </Button>
        </form>
      </div>
    </div>
  );
}
