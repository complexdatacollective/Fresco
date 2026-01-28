import icons from '~/lib/legacy-ui/components/icons';

const getIcon = (name) => {
  if (!Object.prototype.hasOwnProperty.call(icons, name)) {
    return null;
  }
  return icons[name];
};

export default getIcon;
