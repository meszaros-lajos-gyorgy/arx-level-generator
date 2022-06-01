const { createItem, addScript, items } = require('../../../assets/items')
const { declare, getInjections } = require('../../../scripting')

export const createEventBus = (gates) => {
  const ref = createItem(items.marker)

  declare('int', 'northGateOpened', 0, ref)
  declare('int', 'southGateOpened', 0, ref)
  declare('int', 'westGateOpened', 0, ref)
  declare('int', 'eastGateOpened', 0, ref)
  declare('int', 'pp0pressed', 0, ref)
  declare('int', 'pp1pressed', 0, ref)
  declare('int', 'pp2pressed', 0, ref)
  declare('int', 'pp3pressed', 0, ref)

  addScript((self) => {
    return `
  // component: island.eventBus
  ON INIT {
    ${getInjections('init', self)}
    ACCEPT
  }
  
  ON CUSTOM {
    if ("pp0." isin ^$PARAM1) {
      if ("pressed" isin ^$PARAM1) {
        SET ${self.state.pp0pressed} 1
      } else {
        SET ${self.state.pp0pressed} 0
      }
    }
  
    if ("pp1." isin ^$PARAM1) {
      if ("pressed" isin ^$PARAM1) {
        SET ${self.state.pp1pressed} 1
      } else {
        SET ${self.state.pp1pressed} 0
      }
    }
  
    if ("pp2." isin ^$PARAM1) {
      if ("pressed" isin ^$PARAM1) {
        SET ${self.state.pp2pressed} 1
      } else {
        SET ${self.state.pp2pressed} 0
      }
    }
  
    if ("pp3." isin ^$PARAM1) {
      if ("pressed" isin ^$PARAM1) {
        SET ${self.state.pp3pressed} 1
      } else {
        SET ${self.state.pp3pressed} 0
      }
    }
  
    if (${self.state.pp0pressed} == 1) {
      if (${self.state.pp1pressed} == 1) {
        if (${self.state.northGateOpened} == 0) {
          SENDEVENT OPEN ${gates.north.ref} ""
          SET ${self.state.northGateOpened} 1
        }
      } else {
        if (${self.state.northGateOpened} == 1) {
          SENDEVENT CLOSE ${gates.north.ref} ""
          SET ${self.state.northGateOpened} 0
        }
      }
    } else {
      if (${self.state.northGateOpened} == 1) {
        SENDEVENT CLOSE ${gates.north.ref} ""
        SET ${self.state.northGateOpened} 0
      }
    }
  
    if (${self.state.pp2pressed} == 1) {
      if (${self.state.pp3pressed} == 1) {
        if (${self.state.southGateOpened} == 0) {
          SENDEVENT OPEN ${gates.south.ref} ""
          SET ${self.state.southGateOpened} 1
        }
      } else {
        if (${self.state.southGateOpened} == 1) {
          SENDEVENT CLOSE ${gates.south.ref} ""
          SET ${self.state.southGateOpened} 0
        }
      }
    } else {
      if (${self.state.southGateOpened} == 1) {
        SENDEVENT CLOSE ${gates.south.ref} ""
        SET ${self.state.southGateOpened} 0
      }
    }
  
    if (${self.state.pp1pressed} == 1) {
      if (${self.state.pp3pressed} == 1) {
        if (${self.state.eastGateOpened} == 0) {
          SENDEVENT OPEN ${gates.east.ref} ""
          SET ${self.state.eastGateOpened} 1
        }
      } else {
        if (${self.state.eastGateOpened} == 1) {
          SENDEVENT CLOSE ${gates.east.ref} ""
          SET ${self.state.eastGateOpened} 0
        }
      }
    } else {
      if (${self.state.eastGateOpened} == 1) {
        SENDEVENT CLOSE ${gates.east.ref} ""
        SET ${self.state.eastGateOpened} 0
      }
    }
  
    if (${self.state.pp0pressed} == 1) {
      if (${self.state.pp2pressed} == 1) {
        if (${self.state.westGateOpened} == 0) {
          SENDEVENT OPEN ${gates.west.ref} ""
          SET ${self.state.westGateOpened} 1
        }
      } else {
        if (${self.state.westGateOpened} == 1) {
          SENDEVENT CLOSE ${gates.west.ref} ""
          SET ${self.state.westGateOpened} 0
        }
      }
    } else {
      if (${self.state.westGateOpened} == 1) {
        SENDEVENT CLOSE ${gates.west.ref} ""
        SET ${self.state.westGateOpened} 0
      }
    }
  
    ACCEPT
  }
    `
  }, ref)

  return ref
}
