import RecruitmentSwitch from '~/components/RecruitmentSwitch';
import Section from '~/components/layout/Section';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';

export const AnonymousRecruitmentSection = () => {
  return (
    <>
      <Section classNames="flex">
        <div>
          <Heading variant="h4" className="mb-2">
            Anonymous Recruitment
          </Heading>
          <Paragraph variant="noMargin">
            If anonymous recruitment is enabled, you may generate an anonymous
            participation URL. This URL can be shared with participants to allow
            them to self-enroll in your study.
          </Paragraph>
        </div>
        <RecruitmentSwitch />
      </Section>
    </>
  );
};
