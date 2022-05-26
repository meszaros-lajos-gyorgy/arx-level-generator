import path from 'path'

let folder = path.resolve('../')

export const getRootPath = () => {
  return folder
}

export const setRootPath = (newFolder) => {
  folder = newFolder
}
