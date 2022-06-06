import rgba from 'color-rgba'
import { roundToNDecimals } from './helpers'

export const SCRIPT_EOL = '\r\n'

const toFloat = (colorChannel) => {
  return roundToNDecimals(6, colorChannel / 256)
}

export const color = (colorDefinition) => {
  const [r, g, b] = rgba(colorDefinition)
  return `${toFloat(r)} ${toFloat(g)} ${toFloat(b)}`
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
      case 'public int':
        scope.state[name] = `#${scope.ref}___${name}`
        break
      case 'public float':
        scope.state[name] = `&${scope.ref}___${name}`
        break
      case 'public string':
        scope.state[name] = `$${scope.ref}___${name}`
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
  if (scope === 'global') {
    return (globalScope.injections[eventName] ?? []).join('\n ')
  }
  return (scope.injections[eventName] ?? []).join('\n ')
}
