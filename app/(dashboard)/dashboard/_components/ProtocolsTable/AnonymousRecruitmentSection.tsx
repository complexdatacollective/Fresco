'use client';
import RecruitmentSwitch from '~/components/RecruitmentSwitch';

import { AnonymousRecruitmentModal } from '~/app/(dashboard)/dashboard/protocols/_components/AnonymousRecruitmentModal';
export const AnonymousRecruitmentSection = () => {
  return (
    <div className="flex w-1/3 flex-col gap-4 rounded-lg border border-solid p-6">
      <div>
        <h1 className="pb-2 text-xl">Anonymous Recruitment</h1>
        <p className="text-sm text-muted-foreground">
          If anonymous recruitment is enabled, you may generate an anonymous
          participation URL. This URL can be shared with participants to allow
          them to self-enroll in your study.
        </p>
      </div>

      <div className="flex justify-between">
        <p>Allow anonymous recruitment?</p>
        <RecruitmentSwitch />
      </div>
      <AnonymousRecruitmentModal />
    </div>
  );
};
