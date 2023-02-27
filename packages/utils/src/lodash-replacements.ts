// type Part = [] | string | number;

// const pathReducer = (acc: unknown, part: Part) => {
//   // If part is an array, call pathReducer on each element
//   if (Array.isArray(part)) {
//     return part.reduce(pathReducer, acc);
//   }

//   return acc?.[part as keyof typeof acc];
// };

// type Path = string | string[] | number;

// // Replacement for lodash.get using optional chaining and nullish coalescing
// export const get = <Type>(object: object, path: Path, defaultValue = undefined): Type | typeof defaultValue | undefined => {
//   if (!object) { return defaultValue; }
//   if (path === undefined || path === null) { return defaultValue; }

//   // If path is a single number, attempt to use it as an array index
//   if (typeof path === 'number') {
//     return object?.[path as keyof object] ?? defaultValue;
//   }

//   // If we get here, path is a string or array. Split it into parts.
//   const parts = Array.isArray(path) ? path : path.split('.');

//   return parts.reduce(pathReducer, object) ?? defaultValue;
// };


type Path = string | Array<string>;

// WARNING: This is not a drop in replacement solution and
// it might not work for some edge cases. Test your code! 
export const get = (obj: object, path: Path, defValue: unknown = undefined) => {
  // If path is not defined or it has false value
  if (!path) return undefined
  // Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
  // Regex explained: https://regexr.com/58j0k
  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g)
  // Find value
  const result = pathArray?.reduce(
    (prevObj, key) => prevObj && prevObj[key as keyof object],
    obj
  )
  // If found value is undefined return default value; otherwise return the value
  return result === undefined ? defValue : result
}

export const has = (obj: object, key: string): boolean => {
  const keyParts = key.split('.');

  return !!obj && (
    keyParts.length > 1
      ? has(obj[key.split('.')[0] as keyof object], keyParts.slice(1).join('.'))
      : Object.hasOwnProperty.call(obj, key)
  );
};

export const isObject = (obj: unknown): boolean => {
  return obj instanceof Object;
};
