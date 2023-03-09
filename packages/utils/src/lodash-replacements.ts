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

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => { };

export const random = (a = 1, b = 0) => {
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);
  return lower + Math.random() * (upper - lower);
};

export const randomInt = (a = 1, b = 0) => {
  const lower = Math.ceil(Math.min(a, b));
  const upper = Math.floor(Math.max(a, b));
  return Math.floor(lower + Math.random() * (upper - lower + 1))
};

export const omit = (obj: object, keys: string[]) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key as keyof object]);
  return result;
}

export const isEmpty = (value: unknown) => {
  return (
    value == null || // From standard.js: Always use === - but obj == null is allowed to check null || undefined
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  )
}

export const clamp = (num: number, clamp: number, higher: number) =>
  higher ? Math.min(Math.max(num, clamp), higher) : Math.min(num, clamp)


export const times = (n: number, func = (i: unknown) => i) =>
  Array.from({ length: n }).map((_, i) => func(i))

export const difference = (arr1: Array<unknown>, arr2: Array<unknown>) => arr1.filter(x => !arr2.includes(x))

export const intersection = (...arrays: Array<unknown[]>) => arrays.reduce((a, b) => a.filter(c => b.includes(c)))

export const round = (num: number, precision: number) => {
  const modifier = 10 ** precision
  return Math.round(num * modifier) / modifier
}

export const isNil = (val: unknown) => val == null

export const uniqueId = (
  counter =>
    (str = '') =>
      `${str}${++counter}`
)(0)

/**
* Performs a deep merge of objects and returns new object. Does not modify
* objects (immutable) and merges arrays via concatenation.
*
* @param {...object} objects - Objects to merge
* @returns {object} New object with merged key/values
*/
export const merge = (...objects: Array<Record<string, unknown>>) => {
  const isObject = (obj: unknown): boolean => typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = [...new Set([...oVal, ...pVal])]; // Merge arrays and remove duplicates
      }
      else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = merge(pVal as Record<string, unknown>, oVal as Record<string, unknown>);
      }
      else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

export const debounce = (func: (...rest: unknown[]) => void, delay: number, { leading, trailing } = { leading: false, trailing: undefined }) => {
  if (trailing !== undefined) {
    console.warn("Trailing option not implemented in lodash replacements debounce");
  }

  let timerId: NodeJS.Timeout;

  return (...args: unknown[]) => {
    if (!timerId && leading) {
      func(...args)
    }
    clearTimeout(timerId)

    timerId = setTimeout(() => func(...args), delay)
  }
}