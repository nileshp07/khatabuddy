import {
  allocateByWeights,
  isValidExactSplit,
  minorUnitDigits,
  parseAmountToMinor,
  splitByPercent,
  splitEqual,
  sum,
} from './index';

describe('parseAmountToMinor', () => {
  it('parses major units into integer minor units', () => {
    expect(parseAmountToMinor('12.34', 'INR')).toBe(1234);
    expect(parseAmountToMinor('1,234.50', 'USD')).toBe(123450);
    expect(parseAmountToMinor('100', 'INR')).toBe(10000);
    expect(parseAmountToMinor('.5', 'INR')).toBe(50);
  });

  it('respects currency precision (JPY has 0 minor digits)', () => {
    expect(minorUnitDigits('JPY')).toBe(0);
    expect(parseAmountToMinor('500', 'JPY')).toBe(500);
    expect(parseAmountToMinor('500.5', 'JPY')).toBeNull(); // too precise for JPY
  });

  it('rejects junk and over-precise input', () => {
    expect(parseAmountToMinor('abc', 'INR')).toBeNull();
    expect(parseAmountToMinor('1.234', 'INR')).toBeNull();
    expect(parseAmountToMinor('', 'INR')).toBeNull();
  });
});

describe('allocateByWeights — largest remainder', () => {
  it('splits ₹100 three ways with no lost paise (34/33/33)', () => {
    const parts = splitEqual(10000, 3);
    expect(parts).toEqual([3334, 3333, 3333]);
    expect(sum(parts)).toBe(10000);
  });

  it('always sums back to the total for any awkward division', () => {
    for (const total of [1, 7, 99, 100, 100001, 999999]) {
      for (const n of [1, 2, 3, 4, 7, 11]) {
        expect(sum(splitEqual(total, n))).toBe(total);
      }
    }
  });

  it('handles a zero total', () => {
    expect(splitEqual(0, 4)).toEqual([0, 0, 0, 0]);
  });

  it('allocates by share weights proportionally', () => {
    // a couple (weight 2) + two singles (weight 1) splitting 1000
    expect(allocateByWeights(1000, [2, 1, 1])).toEqual([500, 250, 250]);
  });
});

describe('splitByPercent', () => {
  it('distributes by percentage and stays exact', () => {
    const parts = splitByPercent(10000, [50, 30, 20]);
    expect(parts).toEqual([5000, 3000, 2000]);
    expect(sum(parts)).toBe(10000);
  });

  it('absorbs rounding when percentages divide unevenly', () => {
    const parts = splitByPercent(10000, [33.33, 33.33, 33.34]);
    expect(sum(parts)).toBe(10000);
  });
});

describe('isValidExactSplit', () => {
  it('accepts parts that sum to the total', () => {
    expect(isValidExactSplit(10000, [4000, 3000, 3000])).toBe(true);
  });
  it('rejects mismatched sums and negatives', () => {
    expect(isValidExactSplit(10000, [4000, 3000, 2000])).toBe(false);
    expect(isValidExactSplit(10000, [-1, 5001, 5000])).toBe(false);
  });
});
