import icons from '@/icons';

export const getNCIcon = (name: string) => {
  const typedIcons = icons as { [key: string]: unknown };

  if (!Object.prototype.hasOwnProperty.call(icons, name)) { return null; }
  return typedIcons[name];
};

export const getIcon = (name: string) => getNCIcon(name);
