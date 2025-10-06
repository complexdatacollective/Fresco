import { type LucideProps, icons } from 'lucide-react';

type IconComponentName = keyof typeof icons;

type IconProps = {
  name: string; // because this is coming from the CMS
} & LucideProps;

// 👮‍♀️ guard
function isValidIconComponent(
  componentName: string,
): componentName is IconComponentName {
  return componentName in icons;
}

// This is a workaround to issues with lucide-react/dynamicIconImports found at https://github.com/lucide-icons/lucide/issues/1576#issuecomment-2335019821
export default function DynamicLucideIcon({ name, ...props }: IconProps) {
  // ensure what is in the CMS is a valid icon component
  if (!isValidIconComponent(name)) {
    return null;
  }

  const Icon = icons[name];

  return <Icon {...props} />;
}
