import {
  markAsUsed,
  addScript,
  createRootItem,
  items,
} from '../../assets/items'
import { getInjections, declare } from '../../scripting'

export const overridePlayerScript = (props = {}) => {
  declare('int', 'TUTORIAL_MAGIC', 100, 'global') // disable magic related tutorial messages in rune_aam.asl

  const ref = createRootItem(items.npc.player, props)

  addScript((self) => {
    return `
// component: player
ON INIT {
  ${getInjections('init', self)}
  ${getInjections('init', 'global')}

  LOADANIM WAIT                       "player_wait_short"
  LOADANIM WAIT_SHORT                 "player_wait_1st"
  LOADANIM WALK                       "human_normal_walk"
  LOADANIM WALK_MINISTEP              "human_normal_walk_little_steps"
  LOADANIM STRAFE_RIGHT               "human_normal_strafe_right"
  LOADANIM STRAFE_LEFT                "human_normal_strafe_left"
  LOADANIM WALK_BACKWARD              "human_normal_walk_backward"
  LOADANIM RUN                        "player_normal_run_test"
  LOADANIM RUN_BACKWARD               "player_normal_run_backward_test"
  LOADANIM STRAFE_RUN_RIGHT           "player_normal_strafe_run_right"
  LOADANIM STRAFE_RUN_LEFT            "player_normal_strafe_run_left"
  LOADANIM U_TURN_LEFT                "player_uturn_left"
  LOADANIM U_TURN_RIGHT               "player_uturn_right"
  LOADANIM U_TURN_LEFT_FIGHT          "player_uturn_left_fight"
  LOADANIM U_TURN_RIGHT_FIGHT         "player_uturn_right_fight"
  LOADANIM FIGHT_WAIT                 "human_fight_wait_player"
  LOADANIM FIGHT_WALK_FORWARD         "player_fight_walk"
  LOADANIM FIGHT_WALK_BACKWARD        "player_fight_walk_backward"
  LOADANIM FIGHT_STRAFE_RIGHT         "player_fight_strafe_right"
  LOADANIM FIGHT_STRAFE_LEFT          "player_fight_strafe_left"
  LOADANIM BARE_READY                 "human_fight_ready_noweap"
  LOADANIM BARE_UNREADY               "human_fight_unready_noweap"
  LOADANIM BARE_WAIT                  "human_fight_wait_noweap"
  LOADANIM BARE_STRIKE_RIGHT_START    "human_fight_attack_noweap_right_start"
  LOADANIM BARE_STRIKE_RIGHT_CYCLE    "human_fight_attack_noweap_right_cycle"
  LOADANIM BARE_STRIKE_RIGHT          "human_fight_attack_noweap_right_strike"
  LOADANIM BARE_STRIKE_LEFT_START     "human_fight_attack_noweap_left_start"
  LOADANIM BARE_STRIKE_LEFT_CYCLE     "human_fight_attack_noweap_left_cycle"
  LOADANIM BARE_STRIKE_LEFT           "human_fight_attack_noweap_left_strike"
  LOADANIM BARE_STRIKE_BOTTOM_START   "human_fight_attack_noweap_top_start"
  LOADANIM BARE_STRIKE_BOTTOM_CYCLE   "human_fight_attack_noweap_top_cycle"
  LOADANIM BARE_STRIKE_BOTTOM         "human_fight_attack_noweap_top_strike"
  LOADANIM BARE_STRIKE_TOP_START      "human_fight_attack_noweap_bottom_start"
  LOADANIM BARE_STRIKE_TOP_CYCLE      "human_fight_attack_noweap_bottom_cycle"
  LOADANIM BARE_STRIKE_TOP            "human_fight_attack_noweap_bottom_strike"
  LOADANIM 1H_READY_PART_1            "human_fight_ready_1handed_start"
  LOADANIM 1H_READY_PART_2            "human_fight_ready_1handed_end"
  LOADANIM 1H_UNREADY_PART_1          "human_fight_unready_1handed_start"
  LOADANIM 1H_UNREADY_PART_2          "human_fight_unready_1handed_end"
  LOADANIM 1H_WAIT                    "human_fight_wait_1handed"
  LOADANIM 1H_STRIKE_RIGHT_START      "human_fight_attack_1handed_left_start"
  LOADANIM 1H_STRIKE_RIGHT_CYCLE      "human_fight_attack_1handed_left_cycle"
  LOADANIM 1H_STRIKE_RIGHT            "human_fight_attack_1handed_left_strike"
  LOADANIM 1H_STRIKE_LEFT_START       "human_fight_attack_1handed_right_start"
  LOADANIM 1H_STRIKE_LEFT_CYCLE       "human_fight_attack_1handed_right_cycle"
  LOADANIM 1H_STRIKE_LEFT             "human_fight_attack_1handed_right_strike"
  LOADANIM 1H_STRIKE_TOP_START        "human_fight_attack_1handed_top_start"
  LOADANIM 1H_STRIKE_TOP_CYCLE        "human_fight_attack_1handed_top_cycle"
  LOADANIM 1H_STRIKE_TOP              "human_fight_attack_1handed_top_strike"
  LOADANIM 1H_STRIKE_BOTTOM_START     "human_fight_attack_1handed_bottom_start"
  LOADANIM 1H_STRIKE_BOTTOM_CYCLE     "human_fight_attack_1handed_bottom_cycle"
  LOADANIM 1H_STRIKE_BOTTOM           "human_fight_attack_1handed_bottom_strike"
  LOADANIM 2H_READY_PART_1            "human_fight_ready_2handed_start"
  LOADANIM 2H_READY_PART_2            "human_fight_ready_2handed_end"
  LOADANIM 2H_UNREADY_PART_1          "human_fight_unready_2handed_start"
  LOADANIM 2H_UNREADY_PART_2          "human_fight_unready_2handed_end"
  LOADANIM 2H_WAIT                    "human_fight_wait_2handed"
  LOADANIM 2H_STRIKE_RIGHT_START      "human_fight_attack_2handed_right_start"
  LOADANIM 2H_STRIKE_RIGHT_CYCLE      "human_fight_attack_2handed_right_cycle"
  LOADANIM 2H_STRIKE_RIGHT            "human_fight_attack_2handed_right_strike"
  LOADANIM 2H_STRIKE_LEFT_START       "human_fight_attack_2handed_left_start"
  LOADANIM 2H_STRIKE_LEFT_CYCLE       "human_fight_attack_2handed_left_cycle"
  LOADANIM 2H_STRIKE_LEFT             "human_fight_attack_2handed_left_strike"
  LOADANIM 2H_STRIKE_TOP_START        "human_fight_attack_2handed_top_start"
  LOADANIM 2H_STRIKE_TOP_CYCLE        "human_fight_attack_2handed_top_cycle"
  LOADANIM 2H_STRIKE_TOP              "human_fight_attack_2handed_top_strike"
  LOADANIM 2H_STRIKE_BOTTOM_START     "human_fight_attack_2handed_bottom_start"
  LOADANIM 2H_STRIKE_BOTTOM_CYCLE     "human_fight_attack_2handed_bottom_cycle"
  LOADANIM 2H_STRIKE_BOTTOM           "human_fight_attack_2handed_bottom_strike"
  LOADANIM DAGGER_READY_PART_1        "human_fight_ready_dagger_start"
  LOADANIM DAGGER_READY_PART_2        "human_fight_ready_dagger_end"
  LOADANIM DAGGER_UNREADY_PART_1      "human_fight_unready_dagger_start"
  LOADANIM DAGGER_UNREADY_PART_2      "human_fight_unready_dagger_end"
  LOADANIM DAGGER_WAIT                "human_fight_attack_dagger_wait"
  LOADANIM DAGGER_STRIKE_RIGHT_START  "human_fight_attack_dagger_right_start"
  LOADANIM DAGGER_STRIKE_RIGHT_CYCLE  "human_fight_attack_dagger_right_cycle"
  LOADANIM DAGGER_STRIKE_RIGHT        "human_fight_attack_dagger_right_strike"
  LOADANIM DAGGER_STRIKE_LEFT_START   "human_fight_attack_dagger_left_start"
  LOADANIM DAGGER_STRIKE_LEFT_CYCLE   "human_fight_attack_dagger_left_cycle"
  LOADANIM DAGGER_STRIKE_LEFT         "human_fight_attack_dagger_left_strike"
  LOADANIM DAGGER_STRIKE_TOP_START    "human_fight_attack_dagger_top_start"
  LOADANIM DAGGER_STRIKE_TOP_CYCLE    "human_fight_attack_dagger_top_cycle"
  LOADANIM DAGGER_STRIKE_TOP          "human_fight_attack_dagger_top_strike"
  LOADANIM DAGGER_STRIKE_BOTTOM_START "human_fight_attack_dagger_bottom_start"
  LOADANIM DAGGER_STRIKE_BOTTOM_CYCLE "human_fight_attack_dagger_bottom_cycle"
  LOADANIM DAGGER_STRIKE_BOTTOM       "human_fight_attack_dagger_bottom_strike"
  LOADANIM MISSILE_READY_PART_1       "human_fight_ready_bow_start"
  LOADANIM MISSILE_READY_PART_2       "human_fight_ready_bow_end"
  LOADANIM MISSILE_UNREADY_PART_1     "human_fight_unready_bow_start"
  LOADANIM MISSILE_UNREADY_PART_2     "human_fight_unready_bow_end"
  LOADANIM MISSILE_WAIT               "human_fight_wait_bow"
  LOADANIM MISSILE_STRIKE_PART_1      "human_fight_attack_bow_start_part1"
  LOADANIM MISSILE_STRIKE_PART_2      "human_fight_attack_bow_start_part2"
  LOADANIM MISSILE_STRIKE_CYCLE       "human_fight_attack_bow_cycle"
  LOADANIM MISSILE_STRIKE             "human_fight_attack_bow_strike"
  LOADANIM SHIELD_START               "human_fight_shield_in"
  LOADANIM SHIELD_CYCLE               "human_fight_shield_cycle"
  LOADANIM SHIELD_HIT                 "human_fight_shield_hit"
  LOADANIM SHIELD_END                 "human_fight_shield_out"
  LOADANIM CAST_START                 "human_castspell_in"
  LOADANIM CAST_CYCLE                 "human_castspell_cycle"
  LOADANIM CAST                       "human_castspell_cast"
  LOADANIM CAST_END                   "human_castspell_out"
  LOADANIM MEDITATION                 "human_meditation"
  LOADANIM LEVITATE                   "human_levitation"
  LOADANIM CROUCH_START               "human_normal_crouch_in"
  LOADANIM CROUCH_WAIT                "human_normal_crouch_cycle"
  LOADANIM CROUCH_END                 "human_normal_crouch_out"
  LOADANIM CROUCH_STRAFE_RIGHT        "human_normal_crouch_strafe_right"
  LOADANIM CROUCH_STRAFE_LEFT         "human_normal_crouch_strafe_left"
  LOADANIM CROUCH_WALK                "human_normal_crouch_walk_forward"
  LOADANIM CROUCH_WALK_BACKWARD       "human_normal_crouch_walk_backward"
  LOADANIM LEAN_LEFT                  "human_normal_lean_right_in"
  LOADANIM LEAN_RIGHT                 "human_normal_lean_left_in"
  LOADANIM JUMP_ANTICIPATION          "human_normal_jump_part1_anticipation"
  LOADANIM JUMP_UP                    "human_normal_jump_part2_jumpup"
  LOADANIM JUMP_CYCLE                 "human_normal_jump_part3_cycleinair"
  LOADANIM JUMP_END                   "human_normal_jump_part4_landing"
  LOADANIM JUMP_END_PART2             "human_normal_jump_part5_contact_floor"
  LOADANIM HOLD_TORCH                 "human_hold_torch_toponly"
  LOADANIM DIE                        "human_death5"
  LOADANIM HIT                        "human_fight_receive_damage"
  LOADANIM TALK_NEUTRAL               "human_talk_neutral_headonly"
  LOADANIM TALK_ANGRY                 "human_talk_angry_headonly"

  ACCEPT
}

ON INITEND {
  ${getInjections('initend', self)}
  ACCEPT
}

ON OUCH {
  IF (^#PARAM1 > 20) {
    SPEAK [Player_ouch_strong] NOP
    ACCEPT
  } ELSE IF (^#PARAM1 > 8) {
    SPEAK [Player_ouch_medium] NOP
    ACCEPT
  } ELSE IF (^#PARAM1 > 2) {
    SPEAK [Player_ouch] NOP
    ACCEPT
  }
  ACCEPT
}

ON DIE {
  PLAY "player_death"
  SET #TMP ^RND_10
  INC #TMP 1
  IF (#TMP < 3) {
    SPEAK -p [player_dying] nop
    ACCEPT
  }
  IF (#TMP < 6) {
    SPEAK -p [Player_ouch_strong] nop
    ACCEPT
  }
  IF (#TMP < 8) {
    SPEAK -p [Player_ouch_medium] nop
    ACCEPT
  }
  ACCEPT
}

ON EARTH_QUAKE {
  PLAY earthQ
  ACCEPT
}

ON CRITICAL {
  HEROSAY [player_dbldmg]
  SPEAK [player_attack_1handed_weap] NOP
  ACCEPT
}

ON SETSPEED {
  SETSPEED ^&PARAM1
  ACCEPT
}
    `
  }, ref)

  markAsUsed(ref)

  return ref
}
