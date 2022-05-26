export const colors = {
  pillars: '#1a351c',
  ambience: [
    'hsla(0, 64%, 8%, 1)',
    'hsla(0, 64%, 16%, 1)',
    'hsla(0, 64%, 32%, 1)',
    'hsla(0, 64%, 64%, 1)',
    'hsla(0, 64%, 98%, 1)',
  ],
  lights: '#85a300',
  // terrain: "#0a0a0a",
  terrain: '#ddd',
}

export const NONE = 0x0
export const NORTH = 0x1
export const EAST = 0x2
export const SOUTH = 0x4
export const WEST = 0x8
export const ALL = NORTH | SOUTH | EAST | WEST
