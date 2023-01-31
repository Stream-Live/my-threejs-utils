import add from './any'

test("测试一", () => {
  expect(add(1,2)).toBe(3);
});
test("测试二", () => {
  expect(add(3,4)).toBe(7);
});

