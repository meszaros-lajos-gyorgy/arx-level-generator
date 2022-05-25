export const countBy = () => {}
export const partition = () => {}
export const flatten = () => {}
export const without = () => {}
export const any = () => {}

// https://stackoverflow.com/a/14438954/1806628
export const uniq = (values) => {
  return values.filter((value, index, self) => {
    return self.indexOf(value) === index
  })
}

export const times = (fn, repetitions) => {
  return [...Array(repetitions)].map(() => fn())
}

export const repeat = (value, repetitions) => {
  return Array(repetitions).fill(value)
}

export const identity = (x) => x

export const clamp = (min, max, n) => {
  if (n < min) {
    return min
  }
  if (n > max) {
    return max
  }
  return n
}

export const clone = (data) => {
  return JSON.parse(JSON.stringify(data))
}

export const props = (keys, obj) => {
  return keys.reduce((acc, key) => {
    acc.push(obj[key])
    return acc
  }, [])
}
