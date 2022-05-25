export const countBy = () => {}
export const partition = () => {}
export const clone = () => {}
export const flatten = () => {}
export const isEmpty = () => {}
export const reduce = () => {}
export const identity = () => {}
export const addIndex = () => {}
export const without = () => {}
export const clamp = () => {}
export const pluck = () => {}
export const props = () => {}
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
