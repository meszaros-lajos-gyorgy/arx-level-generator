import {
  addScript,
  createItem,
  createRootItem,
  InjectableProps,
  ItemDefinition,
  markAsUsed,
  moveTo,
} from '../../../assets/items'
import { declare, getInjections, SCRIPT_EOL } from '../../../scripting'
import { RelativeCoords, RotationVector3 } from '../../../types'

const itemDesc: ItemDefinition = {
  src: 'npc/npc/npc.teo',
  native: true,
}

export type NPC_TYPE = 'arx guard' | 'rebel guard'

export const defineNPC = (config: InjectableProps = {}) => {
  const ref = createRootItem(itemDesc, {
    ...config,
    hp: 10,
    material: 'flesh',
    mesh: 'human_base/human_base.teo',
  })

  declare('string', 'type', 'arx guard', ref)
  declare('int', 'painTolerance', 1, ref)
  declare('int', 'lastTimeSayingOuch', 0, ref)

  addScript((self) => {
    return `
// component: npc
ON INIT {
  ${getInjections('init', self)}
  SETGORE OFF
  ACCEPT
}

ON INITEND {
  ${getInjections('initend', self)}
  loadanim WALK_SNEAK                 "human_walk_sneak"
  loadanim CAST_START                 "human_npc_cast_start"
  loadanim CAST_CYCLE                 "human_npc_cast_cycle"
  loadanim CAST                       "human_npc_cast_cast"
  loadanim CAST_END                   "human_npc_cast_end"
  loadanim WALK                       "human_normal_walk_guard"
  loadanim RUN                        "Human_normal_run"
  loadanim WAIT                       "Human_normal_wait"
  loadanim HIT                        "Human_fight_receive_damage"
  loadanim HIT_SHORT                  "human_hit_short"
  loadanim DIE                        "Human_death"
  loadanim TALK_NEUTRAL               "human_talk_neutral_headonly"
  loadanim TALK_ANGRY                 "human_talk_angry_headonly"
  loadanim TALK_HAPPY                 "human_talk_happy_headonly"
  loadanim GRUNT                      "human_fight_grunt"
  loadanim FIGHT_WAIT                 "human_fight_wait"
  loadanim FIGHT_WALK_FORWARD         "human_fight_walk"
  loadanim FIGHT_WALK_BACKWARD        "human_fight_walk_backward"
  loadanim FIGHT_STRAFE_RIGHT         "human_fight_strafe_right"
  loadanim FIGHT_STRAFE_LEFT          "human_fight_strafe_left"
  loadanim BARE_READY                 "human_fight_ready_noweap"
  loadanim BARE_UNREADY               "human_fight_unready_noweap"
  loadanim BARE_WAIT                  "human_fight_wait_noweap"
  loadanim BARE_STRIKE_LEFT_START     "human_fight_attack_noweap_left_start"
  loadanim BARE_STRIKE_LEFT_CYCLE     "human_fight_attack_noweap_left_cycle"
  loadanim BARE_STRIKE_LEFT           "human_fight_attack_noweap_left_strike"
  loadanim BARE_STRIKE_RIGHT_START    "human_fight_attack_noweap_right_start"
  loadanim BARE_STRIKE_RIGHT_CYCLE    "human_fight_attack_noweap_right_cycle"
  loadanim BARE_STRIKE_RIGHT          "human_fight_attack_noweap_right_strike"
  loadanim BARE_STRIKE_TOP_START      "human_fight_attack_noweap_top_start"
  loadanim BARE_STRIKE_TOP_CYCLE      "human_fight_attack_noweap_top_cycle"
  loadanim BARE_STRIKE_TOP            "human_fight_attack_noweap_top_strike"
  loadanim BARE_STRIKE_BOTTOM_START   "human_fight_attack_noweap_bottom_start"
  loadanim BARE_STRIKE_BOTTOM_CYCLE   "human_fight_attack_noweap_bottom_cycle"
  loadanim BARE_STRIKE_BOTTOM         "human_fight_attack_noweap_bottom_strike"
  loadanim 1H_WAIT                    "human_fight_wait_1handed"
  loadanim 1H_READY_PART_1            "human_fight_ready_1handed_start"
  loadanim 1H_READY_PART_2            "human_fight_ready_1handed_end"
  loadanim 1H_UNREADY_PART_1          "human_fight_unready_1handed_start"
  loadanim 1H_UNREADY_PART_2          "human_fight_unready_1handed_end"
  loadanim 1H_STRIKE_LEFT_START       "human_fight_attack_1handed_left_start"
  loadanim 1H_STRIKE_LEFT_CYCLE       "human_fight_attack_1handed_left_cycle"
  loadanim 1H_STRIKE_LEFT             "human_fight_attack_1handed_left_strike"
  loadanim 1H_STRIKE_RIGHT_START      "human_fight_attack_1handed_right_start"
  loadanim 1H_STRIKE_RIGHT_CYCLE      "human_fight_attack_1handed_right_cycle"
  loadanim 1H_STRIKE_RIGHT            "human_fight_attack_1handed_right_strike"
  loadanim 1H_STRIKE_TOP_START        "human_fight_attack_1handed_top_start"
  loadanim 1H_STRIKE_TOP_CYCLE        "human_fight_attack_1handed_top_cycle"
  loadanim 1H_STRIKE_TOP              "human_fight_attack_1handed_top_strike"
  loadanim 1H_STRIKE_BOTTOM_START     "human_fight_attack_1handed_bottom_start"
  loadanim 1H_STRIKE_BOTTOM_CYCLE     "human_fight_attack_1handed_bottom_cycle"
  loadanim 1H_STRIKE_BOTTOM           "human_fight_attack_1handed_bottom_strike"
  loadanim 2H_READY_PART_1            "human_fight_ready_2handed_start"
  loadanim 2H_READY_PART_2            "human_fight_ready_2handed_end"
  loadanim 2H_UNREADY_PART_1          "human_fight_unready_2handed_start"
  loadanim 2H_UNREADY_PART_2          "human_fight_unready_2handed_end"
  loadanim 2H_WAIT                    "human_fight_wait_2handed"
  loadanim 2H_STRIKE_LEFT_START       "human_fight_attack_2handed_left_start"
  loadanim 2H_STRIKE_LEFT_CYCLE       "human_fight_attack_2handed_left_cycle"
  loadanim 2H_STRIKE_LEFT             "human_fight_attack_2handed_left_strike"
  loadanim 2H_STRIKE_RIGHT_START      "human_fight_attack_2handed_right_start"
  loadanim 2H_STRIKE_RIGHT_CYCLE      "human_fight_attack_2handed_right_cycle"
  loadanim 2H_STRIKE_RIGHT            "human_fight_attack_2handed_right_strike"
  loadanim 2H_STRIKE_TOP_START        "human_fight_attack_2handed_top_start"
  loadanim 2H_STRIKE_TOP_CYCLE        "human_fight_attack_2handed_top_cycle"
  loadanim 2H_STRIKE_TOP              "human_fight_attack_2handed_top_strike"
  loadanim 2H_STRIKE_BOTTOM_START     "human_fight_attack_2handed_bottom_start"
  loadanim 2H_STRIKE_BOTTOM_CYCLE     "human_fight_attack_2handed_bottom_cycle"
  loadanim 2H_STRIKE_BOTTOM           "human_fight_attack_2handed_bottom_strike"
  loadanim DAGGER_READY_PART_1        "human_fight_ready_dagger_start"
  loadanim DAGGER_READY_PART_2        "human_fight_ready_dagger_end"
  loadanim DAGGER_UNREADY_PART_1      "human_fight_unready_dagger_start"
  loadanim DAGGER_UNREADY_PART_2      "human_fight_unready_dagger_end"
  loadanim DAGGER_WAIT                "human_fight_attack_dagger_wait"
  loadanim DAGGER_STRIKE_LEFT_START   "human_fight_attack_dagger_left_start"
  loadanim DAGGER_STRIKE_LEFT_CYCLE   "human_fight_attack_dagger_left_cycle"
  loadanim DAGGER_STRIKE_LEFT         "human_fight_attack_dagger_left_strike"
  loadanim DAGGER_STRIKE_RIGHT_START  "human_fight_attack_dagger_right_start"
  loadanim DAGGER_STRIKE_RIGHT_CYCLE  "human_fight_attack_dagger_right_cycle"
  loadanim DAGGER_STRIKE_RIGHT        "human_fight_attack_dagger_right_strike"
  loadanim DAGGER_STRIKE_TOP_START    "human_fight_attack_dagger_top_start"
  loadanim DAGGER_STRIKE_TOP_CYCLE    "human_fight_attack_dagger_top_cycle"
  loadanim DAGGER_STRIKE_TOP          "human_fight_attack_dagger_top_strike"
  loadanim DAGGER_STRIKE_BOTTOM_START "human_fight_attack_dagger_bottom_start"
  loadanim DAGGER_STRIKE_BOTTOM_CYCLE "human_fight_attack_dagger_bottom_cycle"
  loadanim DAGGER_STRIKE_BOTTOM       "human_fight_attack_dagger_bottom_strike"
  loadanim MISSILE_READY_PART_1       "human_fight_ready_bow_start"
  loadanim MISSILE_READY_PART_2       "human_fight_ready_bow_end"
  loadanim MISSILE_UNREADY_PART_1     "human_fight_unready_bow_start"
  loadanim MISSILE_UNREADY_PART_2     "human_fight_unready_bow_end"
  loadanim MISSILE_WAIT               "human_fight_wait_bow"
  loadanim MISSILE_STRIKE_PART_1      "human_fight_attack_bow_start_part1"
  loadanim MISSILE_STRIKE_PART_2      "human_fight_attack_bow_start_part2"
  loadanim MISSILE_STRIKE_CYCLE       "human_fight_attack_bow_cycle"
  loadanim MISSILE_STRIKE             "human_fight_attack_bow_strike"
  loadanim ACTION1                    "human_misc_kick_rat"

  BEHAVIOR FRIENDLY
  SETTARGET PLAYER
  GOSUB SET_TYPE

  IF (§respawning == 1) {
    SET §respawning 0
    PLAYANIM -12 DIE
    invulnerability on
    COLLISION OFF
  }

  ACCEPT
}

ON OUCH {
  IF (^&PARAM1 < ${self.state.painTolerance}) {
    FORCEANIM HIT_SHORT
  } ELSE {
    SET #TMP ^GAMESECONDS
    DEC #TMP ${self.state.lastTimeSayingOuch}
    IF (#TMP > 4) {
      FORCEANIM HIT
      SET ${self.state.lastTimeSayingOuch} ^GAMESECONDS
    }
    
    SET &TMP ${self.state.painTolerance}
    MUL &TMP 3

    IF (^#PARAM1 >= &TMP) {
      RANDOM 50 {
        SPEAK -a ~£ouch_strong~ NOP
      }
    } ELSE {
      SET &TMP ${self.state.painTolerance}
      MUL &TMP 2
      IF (^#PARAM1 >= &TMP) {
        RANDOM 50 { 
          SPEAK -a ~£ouch_medium~ NOP
        }
      } ELSE {
        RANDOM 50 {
          SPEAK -a ~£ouch~ NOP
        }
      }
    }
  }

  ACCEPT
}

ON DIE {
  ${getInjections('die', self)}
  SET §respawning 1
  SPEAK ~£dying~ NOP
  TIMERrevive -m 1 100 REVIVE -i
  ACCEPT
}

ON RESPAWN {
  COLLISION ON
  PLAYANIM -12 none
  sendevent glow self on
  ACCEPT
}

ON GLOW {
  if (^$param1 == "on") {
    HALO -ocs 0.8 1 1 30 // [o] = active, [c] = color, [s] = radius
  } else {
    HALO -f // [f] = inactive
  }
  ACCEPT
}

ON SPAWN_PROTECT_OFF {
  sendevent glow self off
  invulnerability off
  ACCEPT
}

>>SET_TYPE {
  IF (${self.state.type} == "arx guard") {
    TWEAK ALL "human_chainmail"
    TWEAK SKIN "npc_human_chainmail_body" "npc_human_chainmail_guard_body"
    TWEAK SKIN "npc_human_chainmail_hero_head" "npc_human_chainmail_guard_head"
    SET_ARMOR_MATERIAL METAL_CHAIN
    SET_STEP_MATERIAL Foot_metal_chain
    SET ${self.state.painTolerance} 4
    
    SET £dying [human_male_dying]
    SET £ouch [Human_guard_ouch]
    SET £ouch_medium [Human_guard_ouch_medium]
    SET £ouch_strong [Human_guard_ouch_strong]

    SETNAME [description_guard]

    SET_NPC_STAT armor_class 18
    SET_NPC_STAT absorb 40
    SET_NPC_STAT tohit 70
    SET_NPC_STAT aimtime 1000
    SET_NPC_STAT life 10
  }
  IF (${self.state.type} == "rebel guard") {
    TWEAK ALL "human_chainmail"
    TWEAK SKIN "npc_human_chainmail_body" "npc_human_chainmail_sacred_body"
    TWEAK SKIN "npc_human_chainmail_hero_head" "npc_human_chainmail_sacred_head"
    SET_ARMOR_MATERIAL METAL_CHAIN
    SET_STEP_MATERIAL Foot_metal_chain
    SET ${self.state.painTolerance} 4

    SET £dying [human_male_dying]
    SET £ouch [Human_guard_ouch]
    SET £ouch_medium [Human_guard_ouch_medium]
    SET £ouch_strong [Human_guard_ouch_strong]

    SETNAME [description_guard]

    SET_NPC_STAT armor_class 18
    SET_NPC_STAT absorb 40
    SET_NPC_STAT tohit 70
    SET_NPC_STAT aimtime 1000
    SET_NPC_STAT life 10
  }

  RETURN
}

ON CHANGE_WEAPON {
  SETWEAPON ~^$PARAM1~
  SET_NPC_STAT damages ^#PARAM2 // + 10
  ACCEPT
}
    `
  }, ref)

  return ref
}

type NPCProps = {
  type: NPC_TYPE
  groups: string[]
}

export const createNPC = (
  pos: RelativeCoords,
  angle: RotationVector3 = [0, 0, 0],
  config: NPCProps = { type: 'arx guard', groups: ['bot'] },
) => {
  const ref = createItem(itemDesc, {})

  declare('string', 'type', config.type, ref)

  addScript((self) => {
    return `
// component: npc
ON INIT {
  ${getInjections('init', self)}
  ${config.groups.map((group) => `  SETGROUP "${group}"`).join(SCRIPT_EOL)}
  ACCEPT
}

ON INITEND {
  ${getInjections('initend', self)}
  ACCEPT
}
    `
  }, ref)

  moveTo(pos, angle, ref)
  markAsUsed(ref)

  return ref
}
