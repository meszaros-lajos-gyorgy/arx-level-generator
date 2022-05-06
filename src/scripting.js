import rgba from 'color-rgba'
import { compose, dropLast, join } from 'ramda'

export const color = (colorDefinition) => {
  return compose(
    join(' '),
    (tmp) => {
      return tmp.map((channel) => {
        return Math.round((channel / 256) * 10 ** 6) / 10 ** 6
      })
    },
    dropLast(1),
    rgba,
  )(colorDefinition)
}

const globalScope = {
  state: {},
  injections: {},
}

export const declare = (type, name, initialValue, scope) => {
  let value = initialValue
  if (scope === 'global') {
    switch (type) {
      case 'int':
        globalScope.state[name] = `#${name}`
        break
      case 'float':
        globalScope.state[name] = `&${name}`
        break
      case 'string':
        globalScope.state[name] = `$${name}`
        value = `"${initialValue}"`
        break
    }

    if (value !== undefined) {
      globalScope.injections.init = globalScope.injections.init || []
      globalScope.injections.init.push(
        `SET ${globalScope.state[name]} ${value}`,
      )
    }
  } else {
    switch (type) {
      case 'int':
        scope.state[name] = `§${name}`
        break
      case 'float':
        scope.state[name] = `@${name}`
        break
      case 'string':
        scope.state[name] = `£${name}`
        value = `"${initialValue}"`
        break
    }

    if (value !== undefined) {
      scope.injections.init = scope.injections.init || []
      scope.injections.init.push(`SET ${scope.state[name]} ${value}`)
    }
  }

  return scope
}

export const getInjections = (eventName, scope) => {
  return (
    (scope === 'global' ? globalScope : scope).injections[eventName] || []
  ).join('\n  ')
}
