import { cx } from '~/utils/cva';

type PanelsProps = {
  children: React.ReactNode;
  minimize?: boolean;
};

const Panels = ({ children, minimize = false }: PanelsProps) => {
  return (
    <div
      className={cx(
        'flex size-full flex-col',
        'gap-6',
        'transition-opacity',
        'duration-(--animation-duration-standard)',
        'ease-(--animation-easing)',
        minimize ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      {children}
    </div>
  );
};

export default Panels;
