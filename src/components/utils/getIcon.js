import * as muiIcons from '@material-ui/icons';
import icons from '../assets/img/icons';

const getMUIIcon = (name) => {
  if (!Object.prototype.hasOwnProperty.call(muiIcons, name)) { return null; }
  return muiIcons[name];
};

const getNCIcon = (name) => {
  if (!Object.prototype.hasOwnProperty.call(icons, name)) { return null; }
  return icons[name];
};

// Done this way so that, in theory, performance will be the same for using our
// own icons.
const getIcon = (name) => getNCIcon(name) || getMUIIcon(name);

export default getIcon;
