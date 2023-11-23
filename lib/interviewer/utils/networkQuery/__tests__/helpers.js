const { entityAttributesProperty, entityPrimaryKeyProperty } = require('@codaco/shared-consts');

const getEntityGenerator = () => {
  const counts = {
    node: 0,
    edge: 0,
  };

  return (attributes = {}, modelData = {}, entity = 'node', type = 'person') => {
    const entityId = counts[entity] + 1;
    counts[entity] = entityId;

    return {
      [entityPrimaryKeyProperty]: entityId,
      type,
      [entityAttributesProperty]: attributes,
      ...modelData,
    };
  };
};

const generateRuleConfig = (type, options) => ({
  type,
  options,
});

// Function that checks if a string is a valid date in the format YYYY-MM-DD, YYYY-MM, or YYYY
// and converts it to a Date object
const isValidDate = (dateString) => {
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const yearMonthRegex = /^(\d{4})-(\d{2})$/;
  const yearRegex = /^(\d{4})$/;

  if (dateRegex.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day);
  }

  if (yearMonthRegex.test(dateString)) {
    const [year, month] = dateString.split('-');
    return new Date(year, month - 1);
  }

  if (yearRegex.test(dateString)) {
    const [year] = dateString.split('-');
    return new Date(year);
  }

  return false;
};

exports.isValidDate = isValidDate;
exports.getEntityGenerator = getEntityGenerator;
exports.generateRuleConfig = generateRuleConfig;
