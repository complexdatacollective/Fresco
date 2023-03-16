import { useMemo, memo } from "react";
import cx from "classnames";
import { getIcon } from "@/utils/getIcon";
import "./Icon.scss";

type IconProps = {
  name: string;
  className?: string;
  color?: string;
  // eslint-disable-next-line
  style?: object;
  size?: 'small' | 'medium' | 'large';
};

function Icon({
  name,
  className = undefined,
  color = undefined,
  size = 'medium',
}: IconProps) {
  const iconClassNames = cx(
    'icon',
    {
      [`icon--${color || ''}`]: !!color,
    },
    [className]
  );

  const IconComponent = useMemo(() => getIcon(name), [name]);

  if (!IconComponent) {
    console.warn("Invalid icon name:", name); // eslint-disable-line no-console
    return null;
  }

  return (
    <IconComponent
      className={iconClassNames}
      name={name}
      size={size}
    />
  );
}

export default memo(Icon);
