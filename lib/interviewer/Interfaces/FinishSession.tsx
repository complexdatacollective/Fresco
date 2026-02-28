'use client';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { finishInterview } from '~/actions/interviews';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { default as Button } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import { getInterviewId } from '~/lib/interviewer/selectors/session';

const FinishSession = () => {
  const router = useRouter();

  const interviewId = useSelector(getInterviewId);
  const isPreview = interviewId?.startsWith('preview-');

  const { confirm } = useDialog();

  const finishInterviewConfirmation = () =>
    confirm({
      title: 'Are you sure you want to finish the interview?',
      description:
        'Your responses cannot be changed after you finish the interview.',
      confirmLabel: 'Finish Interview',
      onConfirm: async () => {
        if (!interviewId) {
          throw new Error('No interview id found');
        }

        const result = await finishInterview(interviewId);

        if (!result.error) {
          router.push(`/interview/finished`);
        }
      },
    });

  if (isPreview) {
    return (
      <div className="interface">
        <Surface className="w-full max-w-2xl" noContainer>
          <Heading level="h1">End of Preview</Heading>
          <Paragraph>
            You have reached the end of the interview preview. In a live
            interview, participant data would be saved here and they would see a
            thank-you screen.
          </Paragraph>
          <Button color="primary" onClick={() => window.close()}>
            End Preview and Close
          </Button>
        </Surface>
      </div>
    );
  }

  return (
    <div className="interface">
      <Surface className="w-full max-w-2xl" noContainer>
        <Heading level="h1">Finish Interview</Heading>
        <Paragraph>
          You have reached the end of the interview. If you are satisfied with
          the information you have entered, you may finish the interview now.
        </Paragraph>
        <Button color="primary" onClick={finishInterviewConfirmation}>
          Finish
        </Button>
      </Surface>
    </div>
  );
};

export default FinishSession;
