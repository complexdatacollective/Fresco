import { useMemo, memo } from "react";
import cx from "classnames";
import icons from "@/utils/getIcon";
import "./Icon.scss";

type IconProps = {
  name: string;
  className?: string;
  color?: string;
  // eslint-disable-next-line
  style?: object;
};

function Icon({
  name,
  className = undefined,
  color = undefined,
  // eslint-disable-next-line
  ...rest
}: IconProps) {
  const iconClassNames = cx(
    {
      icon: true,
      [`icon--${color}`]: !!color,
    },
    [className]
  );

  const IconComponent = useMemo(() => icons(name), [name]);

  if (!IconComponent) {
    console.warn("Invalid icon name:", name); // eslint-disable-line no-console
    return null;
  }

  return (
    <IconComponent
      className={iconClassNames}
      name={name}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  );
}

export default memo(Icon);
