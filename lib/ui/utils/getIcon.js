import icons from '~/lib/ui/components/icons';

const getIcon = (name) => {
  if (!Object.prototype.hasOwnProperty.call(icons, name)) {
    return null;
  }
  return icons[name];
};

export default getIcon;
