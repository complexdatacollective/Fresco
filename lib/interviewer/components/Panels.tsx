import { cx } from '~/utils/cva';

type PanelsProps = {
  children: React.ReactNode;
  minimize?: boolean;
};

const Panels = ({ children, minimize = false }: PanelsProps) => {
  return (
    <div
      className={cx(
        'flex flex-col',
        'w-96 max-w-[30vw]',
        'transition-[opacity,width,margin-right]',
        'duration-[var(--animation-duration-standard)]',
        'ease-[var(--animation-easing)]',
        'transform-gpu will-change-transform',
        minimize ? 'block w-0 opacity-0' : 'opacity-100',
      )}
    >
      {children}
    </div>
  );
};

export default Panels;
