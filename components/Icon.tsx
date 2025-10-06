import { type LucideProps, icons } from 'lucide-react';
import customIcons from '~/lib/ui/components/icons';

type CustomIconName = keyof typeof customIcons;
type LucideIconName = keyof typeof icons;

type IconProps = {
  name: CustomIconName | LucideIconName;
} & LucideProps;

function isCustomIcon(name: string): name is CustomIconName {
  return name in customIcons;
}

function isLucideIcon(name: string): name is LucideIconName {
  return name in icons;
}

export default function Icon({ name, ...props }: IconProps) {
  // Check custom icons first
  if (isCustomIcon(name)) {
    const CustomIcon = customIcons[name];
    return <CustomIcon />;
  }

  // Fall back to Lucide icons
  if (isLucideIcon(name)) {
    const LucideIcon = icons[name];

    return <LucideIcon {...props} />;
  }

  // Invalid icon name
  return null;
}
