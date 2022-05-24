export const add = (a: number, b: number) => {
  return a + b;
};

const identity = (x: any) => x;

export const tmp = () => {
  return [[1], [2], [3]].flatMap(identity);
};
