import sum from '../containers/sum';

describe(`Testing sum`, () => {
  test(`sum(2, 1) = 3`, () => {
    expect(sum(2, 1)).toBe(3);
  });
});
