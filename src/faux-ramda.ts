// https://stackoverflow.com/a/14438954/1806628
export const uniq = <T>(values: T[]) => {
  return values.filter((value, index, self) => {
    return self.indexOf(value) === index
  })
}

export const times = <T>(fn: () => T, repetitions: number): T[] => {
  return [...Array(repetitions)].map(() => fn())
}

export const repeat = <T>(value: T, repetitions: number): T[] => {
  return Array(repetitions).fill(value)
}

export const identity = <T>(x: T) => {
  return x
}

export const clamp = (min: number, max: number, n: number) => {
  if (n < min) {
    return min
  }
  if (n > max) {
    return max
  }
  return n
}

export const clone = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data))
}

export const props = <T>(keys: string[], obj: Record<string, T>) => {
  return keys.reduce((acc, key) => {
    acc.push(obj[key])
    return acc
  }, [] as T[])
}

export const any = <T>(fn: (value: T) => boolean, values: T[]) => {
  for (let value of values) {
    if (fn(value)) {
      return true
    }
  }
  return false
}

export const without = <T>(listOfExceptions: T[], values: T[]) => {
  return values.filter((item) => {
    return !listOfExceptions.includes(item)
  })
}

export const countBy = <T>(fn: (value: T) => string, values: T[]) => {
  return values.reduce((acc, value) => {
    const key = fn(value)
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
}

const complement = (fn) => {
  return (...args) => !fn(...args)
}

export const partition = <T>(
  fn: (arg: T) => boolean,
  values: T[],
): [T[], T[]] => {
  return [values.filter(fn), values.filter(complement(fn))]
}
