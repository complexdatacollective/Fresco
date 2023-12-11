import type { PropsWithChildren } from 'react';

export const ErrorDetails = (props: PropsWithChildren) => {
  return (
    <div className="max-h-52 overflow-y-auto rounded-md border bg-primary px-6 py-4 text-sm text-white">
      {props.children}
    </div>
  );
};
