/* eslint-disable no-param-reassign */

// The window width and heights are just an arbitrary upper limit
const textOutOfBounds = (containerElement, textElement) => {
  const containerBounds = containerElement.getBoundingClientRect();
  const textBounds = textElement.getBoundingClientRect();
  return (
    textBounds.height > containerBounds.height
    || textBounds.width > containerBounds.width
  );
};

const defaultOptions = {
  increment: 1,
  units: 'px',
};

// TODO move padding: 33% into stylesheet
const scaleTextToFit = (element, options) => {
  const {
    increment,
    unit,
  } = { ...defaultOptions, ...options };

  element.setAttribute('style', 'position: relative;');
  const text = element.textContent;
  element.innerHTML = '';

  const textElement = document.createElement('span');
  textElement.innerHTML = text;
  element.appendChild(textElement);

  const findFontSize = (size) => {
    textElement.setAttribute('style', `position: absolute; font-size: ${size}${unit};`);

    return !textOutOfBounds(element, textElement)
      ? findFontSize(size + increment)
      : size - increment;
  };

  const fontSize = findFontSize(0);

  element.innerHTML = text;
  element.setAttribute('style', `font-size: ${fontSize}${unit}; overflow: hidden;`);
};

export default scaleTextToFit;
