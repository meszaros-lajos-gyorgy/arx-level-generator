import {
  addDependencyAs,
  addScript,
  createItem,
  items,
} from '../../../assets/items'
import { declare, getInjections, SCRIPT_EOL } from '../../../scripting'

const meshes = {
  wide: 'L2_Gobel_portcullis_big\\L2_Gobel_portcullis_big.teo',
  narrow: 'L2_Gobel_portcullis\\L2_Gobel_portcullis.teo',
}

const FPS = 30
const fpsInMs = 1000 / FPS
const raiseAnimMs = 1387
const lowerAnimMs = 291

const sounds = [
  'portcullis-loop-raise',
  'portcullis-loop-lower',
  'portcullis-end-raise',
  'portcullis-end-lower',
]

export const createGate = (orientation, props = {}) => {
  const isWide = props.isWide ?? false

  const ref = createItem(items.doors.portcullis, {
    mesh: isWide ? meshes.wide : meshes.narrow,
  })

  sounds.forEach((filename) => {
    addDependencyAs(
      `projects/alias-nightmare/sfx/${filename}.wav`,
      `sfx/${filename}.wav`,
      ref,
    )
  })

  // TODO: handle props.isOpen
  // declare('int', 'isOpen', props.isOpen ?? false ? 1 : 0, ref)

  declare('float', 'offset', 0, ref)

  addScript((self) => {
    return `
// component island:gates.${orientation}
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}
ON INITEND {
  ${getInjections('initend', self)}
  COLLISION ON
  ACCEPT
}

ON RAISE {
  GOSUB STOPANIM
  GOSUB STOPSOUND
  GOSUB SOUND_LOOP_RAISE
  TIMERend -m 1 ${raiseAnimMs} GOTO SOUND_END_RAISE
  TIMERmove -m ${Math.ceil(
    raiseAnimMs / fpsInMs,
  )} ${fpsInMs} GOTO MOVE_STEP_RAISE
  ACCEPT
}

ON LOWER {
  GOSUB STOPANIM
  GOSUB STOPSOUND
  GOSUB SOUND_LOOP_LOWER
  TIMERend -m 1 ${lowerAnimMs} GOTO SOUND_END_LOWER
  TIMERmove -m ${Math.ceil(
    lowerAnimMs / fpsInMs,
  )} ${fpsInMs} GOTO MOVE_STEP_LOWER
  ACCEPT
}

>>MOVE_STEP_RAISE {
  HEROSAY "move up"
  MOVE 0 -10 0
  ACCEPT
}

>>MOVE_STEP_LOWER {
  MOVE 0 10 0
  ACCEPT
}

>>SOUND_LOOP_RAISE {
  GOSUB STOPSOUND
  PLAY -li "portcullis-loop-raise"
  RETURN
}

>>SOUND_LOOP_LOWER {
  GOSUB STOPSOUND
  PLAY -li "portcullis-loop-lower"
  RETURN
}

>>SOUND_END_RAISE {
  HEROSAY "sound up"
  GOSUB STOPSOUND
  PLAY -i "portcullis-end-raise"
  ACCEPT
}

>>SOUND_END_LOWER {
  GOSUB STOPSOUND
  PLAY -i "portcullis-end-lower"
  ACCEPT
}

>>STOPSOUND {
  ${sounds.map((filename) => `PLAY -s "${filename}"`).join(SCRIPT_EOL)}
  RETURN
}

>>STOPANIM {
  TIMERend OFF
  TIMERmove OFF
  RETURN
}
`
  }, ref)

  // TODO: create custom animation with timer (raise and lower gate)
  // TODO: variable speed for the custom animation

  return ref
}
