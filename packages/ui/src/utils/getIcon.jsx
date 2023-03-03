import icons from '../../public/assets/img/icons';

// const getMUIIcon = (name) => {
//   if (!Object.prototype.hasOwnProperty.call(muiIcons, name)) { return null; }
//   return muiIcons[name];
// };

const getNCIcon = (name) => {
  if (!Object.prototype.hasOwnProperty.call(icons, name)) { return null; }
  return icons[name];
};

const getIcon = (name) => getNCIcon(name)

export default getIcon;
