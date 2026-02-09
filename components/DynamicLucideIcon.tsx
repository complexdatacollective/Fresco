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
  // we need to convert kebab-case to PascalCase because we formerly relied on
  // lucide-react/dynamicIconImports and the icon names are what are stored in the CMS.
  const kebabToPascal = (str: string) =>
    str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

  const componentName = kebabToPascal(name);

  // ensure what is in the CMS is a valid icon component
  if (!isValidIconComponent(componentName)) {
    return null;
  }

  // lucide-react/dynamicIconImports makes NextJS development server very slow
  // https://github.com/lucide-icons/lucide/issues/1576
  const Icon = icons[componentName];

  return <Icon {...props} />;
}
