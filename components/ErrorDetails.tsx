import type { PropsWithChildren } from 'react';

export const ErrorDetails = (props: PropsWithChildren) => {
  return (
    <div className="max-h-52 overflow-y-auto rounded-md border bg-primary text-sm text-white [&_pre]:whitespace-pre-wrap [&_pre]:p-6 ">
      {props.children}
    </div>
  );
};
