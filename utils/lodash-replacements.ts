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

type Path = string | string[];

// WARNING: This is not a drop in replacement solution and
// it might not work for some edge cases. Test your code!
export const get = (obj: object, path: Path, defValue: unknown = undefined) => {
  // If path is not defined or it has false value
  if (!path) return undefined;
  // Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
  // Regex explained: https://regexr.com/58j0k
  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
  // Find value
  const result = pathArray?.reduce(
    (prevObj, key) => prevObj && prevObj[key as keyof object],
    obj,
  );
  // If found value is undefined return default value; otherwise return the value
  return result ?? defValue;
};

export const has = (obj: object, key: string): boolean => {
  const keyParts = key.split('.');

  return (
    !!obj &&
    (keyParts.length > 1
      ? has(obj[key.split('.')[0] as keyof object], keyParts.slice(1).join('.'))
      : Object.hasOwnProperty.call(obj, key))
  );
};

export const isObject = (obj: unknown): boolean => {
  return obj instanceof Object;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const random = (a = 1, b = 0) => {
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);
  return lower + Math.random() * (upper - lower);
};

export const randomInt = (a = 1, b = 0) => {
  const lower = Math.ceil(Math.min(a, b));
  const upper = Math.floor(Math.max(a, b));
  return Math.floor(lower + Math.random() * (upper - lower + 1));
};

export const omit = (obj: object, keys: string[]) => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key as keyof object]);
  return result;
};

export const isEmpty = (value: unknown) => {
  return (
    value == null || // From standard.js: Always use === - but obj == null is allowed to check null || undefined
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  );
};

export const clamp = (num: number, clamp: number, higher: number) =>
  higher ? Math.min(Math.max(num, clamp), higher) : Math.min(num, clamp);

export const times = (n: number, func = (i: unknown) => i) =>
  Array.from({ length: n }).map((_, i) => func(i));

export const difference = (arr1: unknown[], arr2: unknown[]) =>
  arr1.filter((x) => !arr2.includes(x));

export const intersection = (...arrays: unknown[][]) =>
  arrays.reduce((a, b) => a.filter((c) => b.includes(c)));

export const round = (num: number, precision: number) => {
  const modifier = 10 ** precision;
  return Math.round(num * modifier) / modifier;
};

export const isNil = (val: unknown) => val == null;

export const uniqueId = (
  (counter) =>
  (str = '') =>
    `${str}${++counter}`
)(0);

/**
 * Performs a deep merge of objects and returns new object. Does not modify
 * objects (immutable) and merges arrays via concatenation.
 *
 * @param {...object} objects - Objects to merge
 * @returns {object} New object with merged key/values
 */
export const merge = (...objects: Record<string, unknown>[]) => {
  const isObject = (obj: unknown): boolean => typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = [...new Set([...oVal, ...pVal])]; // Merge arrays and remove duplicates
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = merge(
          pVal as Record<string, unknown>,
          oVal as Record<string, unknown>,
        );
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
};

export const debounce = (
  func: (...rest: unknown[]) => void,
  delay: number,
  { leading, trailing } = { leading: false, trailing: undefined },
) => {
  if (trailing !== undefined) {
    // eslint-disable-next-line no-console
    console.warn(
      'Trailing option not implemented in lodash replacements debounce',
    );
  }

  let timerId: NodeJS.Timeout;

  return (...args: unknown[]) => {
    if (!timerId && leading) {
      func(...args);
    }
    clearTimeout(timerId);

    timerId = setTimeout(() => func(...args), delay);
  };
};

export const flowRight =
  (funcs: ((...args: unknown[]) => void)[]) =>
  (...args: unknown[]) =>
    funcs.reverse().reduce((prev, fnc) => [fnc(...prev)], args)[0];

// Function that accepts an array of unknown items, and a function that returns a promise.
// It will run the function on each item in the array, and wait for the promise to resolve before moving on to the next item.
export const inSequence = async (
  items: unknown[],
  apply: (item: unknown) => Promise<unknown>,
) => {
  for (const item of items) {
    await apply(item);
  }
};

// Replacement for lodash/fp trimChars
export const trimChars = (chars: string) => (str: string) => {
  const charsRegex = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g');
  return str.replace(charsRegex, '');
};

// This method is like _.find except that it returns the key of the first element predicate returns truthy for instead of the element itself.
export const findKey = (
  obj: Record<string, unknown>,
  predicate: (value: unknown) => boolean,
) => {
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (predicate(obj[key])) {
      return key;
    }
  }
};

// Creates an array of own enumerable string keyed-value pairs for object. If object is a map or set, its entries are returned.
export const toPairs = (obj: Record<string, unknown>) => {
  const keys = Object.keys(obj);
  return keys.map((key) => [key, obj[key]]);
};

// Creates an object composed of keys generated from the results of running each element of collection thru iteratee. The corresponding value of each key is the number of times the key was returned by iteratee. The iteratee is invoked with one argument: (value).
export const countBy = (
  collection: unknown[],
  iteratee: (value: unknown) => unknown,
) => {
  const result: Record<string, number> = {};
  for (const item of collection) {
    const key = iteratee(item);
    if (result[key as keyof typeof result]) {
      result[key as keyof typeof result]++;
    } else {
      result[key as keyof typeof result] = 1;
    }
  }
  return result;
};

export const isMatch = (
  obj: Record<string, unknown>,
  properties: Record<string, unknown>,
) => Object.keys(properties).every((key) => obj[key] === properties[key]);

// If condition is not met, throws. When thrown from a selector, the error
// will be handled by stage boundary and displayed to the user.
export const assert = (condition: boolean, errorMessage: string) => {
  if (!condition) {
    throw new Error(errorMessage);
  }
};

export const isEqual = function (a: unknown, b: unknown): boolean {
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!exports.deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object' && a !== null && b !== null) {
    if (!(typeof b === 'object')) return false;
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    for (const key in a) {
      if (
        !exports.deepEqual(a[key as keyof typeof a], b[key as keyof typeof b])
      )
        return false;
    }
    return true;
  }
  return a === b;
};

export const mapValues = (
  obj: Record<string, unknown>,
  iteratee: (value: unknown) => unknown,
) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, iteratee(value)]),
  );
};

export const mapKeys = (
  obj: Record<string, unknown>,
  iteratee: (value: unknown) => unknown,
) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [iteratee(key), value]),
  );
};

export const orderBy = (
  collection: Record<string, unknown>[] | string[],
  iteratees: unknown[],
  orders: unknown[],
) => {
  const result = [...collection];

  result.sort((a, b) => {
    for (let i = 0; i < iteratees.length; i++) {
      const iteratee = iteratees[i];
      const order = orders[i];

      const aValue =
        typeof iteratee === 'function'
          ? iteratee(a)
          : a[iteratee as keyof typeof a];
      const bValue =
        typeof iteratee === 'function'
          ? iteratee(b)
          : b[iteratee as keyof typeof b];
      if (aValue > bValue) {
        return order === 'desc' ? -1 : 1;
      }
      if (aValue < bValue) {
        return order === 'desc' ? 1 : -1;
      }
    }
    return 0;
  });
  return result;
};

export const sortBy = (
  collection: Record<string, unknown>[] | string[],
  iteratees: unknown[],
) => {
  return orderBy(
    collection,
    iteratees,
    iteratees.map(() => 'asc'),
  );
};

export const values = (obj: Record<string, unknown>) => Object.values(obj);
