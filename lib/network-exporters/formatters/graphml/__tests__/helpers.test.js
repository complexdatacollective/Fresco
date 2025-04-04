import { describe, expect, it } from 'vitest';
import { getGraphMLTypeForKey } from '../helpers';

describe('getGraphMLTypeForKey', () => {
  it('defaults to string', () => {
    expect(getGraphMLTypeForKey([])).toEqual('string');
  });

  it('returns string for null values', () => {
    const node = { attributes: { name: null } };
    expect(getGraphMLTypeForKey([node], 'name')).toEqual('string');
  });

  it('identifies a string', () => {
    const node = { attributes: { name: 'Alice' } };
    expect(getGraphMLTypeForKey([node], 'name')).toEqual('string');
  });

  it('identifies an int', () => {
    const node = { attributes: { age: 23 } };
    expect(getGraphMLTypeForKey([node], 'age')).toEqual('int');
  });

  it('identifies an int from strings', () => {
    const node = { attributes: { age: '23' } };
    expect(getGraphMLTypeForKey([node], 'age')).toEqual('int');
  });

  it('identifies a double', () => {
    const node = { attributes: { avg: 1.5 } };
    expect(getGraphMLTypeForKey([node], 'avg')).toEqual('double');
  });

  it('identifies a double from strings', () => {
    const node = { attributes: { avg: '1.5' } };
    expect(getGraphMLTypeForKey([node], 'avg')).toEqual('double');
  });

  it('identifies a boolean', () => {
    const node = { attributes: { isSet: true } };
    expect(getGraphMLTypeForKey([node], 'isSet')).toEqual('boolean');
  });

  it('favors later (non-null) values when types conflict', () => {
    const nodeA = { attributes: { a: true } };
    const nodeB = { attributes: { a: 'foo' } };
    const nodeC = { attributes: { a: null } };
    expect(getGraphMLTypeForKey([nodeA, nodeB, nodeC], 'a')).toEqual('string');
  });

  it('favors double over int when mixed, regardless of order', () => {
    const nodeA = { attributes: { a: 1 } };
    const nodeB = { attributes: { a: 2.1 } }; // double needs to take precedence or we lose precision
    expect(getGraphMLTypeForKey([nodeA, nodeB], 'a')).toEqual('double');

    const nodeC = { attributes: { a: 1.1 } };
    const nodeD = { attributes: { a: 2 } };
    expect(getGraphMLTypeForKey([nodeC, nodeD], 'a')).toEqual('double');
  });

  it('favors double over int when strings can be expressed as numbers, regardless of order', () => {
    const nodeA = { attributes: { a: '1' } };
    const nodeB = { attributes: { a: '2.1' } };
    expect(getGraphMLTypeForKey([nodeA, nodeB], 'a')).toEqual('double');

    const nodeC = { attributes: { a: '1.1' } };
    const nodeD = { attributes: { a: '2' } };
    expect(getGraphMLTypeForKey([nodeC, nodeD], 'a')).toEqual('double');
  });

  it('defaults to a string when values cannot be reconciled', () => {
    // TODO: review; this was the original implementation, but seems unexpected
    const nodeA = { attributes: { a: 2 } };
    const nodeB = { attributes: { a: false } };
    expect(getGraphMLTypeForKey([nodeA, nodeB], 'a')).toEqual('string');

    const nodeC = { attributes: { a: 'name' } };
    const nodeD = { attributes: { a: 2 } };
    expect(getGraphMLTypeForKey([nodeC, nodeD], 'a')).toEqual('string');
  });
});
