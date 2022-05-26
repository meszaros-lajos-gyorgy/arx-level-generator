import React, { useState } from 'react'
import Page from '../components/Page'

const AliasNightmare = ({ onGenerateBtnClick, ...props }) => {
  const [bumpFactor, setBumpFactor] = useState(3)
  return (
    <Page
      title="Alia's Nightmare"
      background="previews/alias-nightmare.png"
      onGenerateBtnClick={(config) => {
        onGenerateBtnClick({
          bumpFactor,
          ...config,
        })
      }}
      {...props}
    >
      <div className="field">
        <label>Size of bumps</label>
        <input
          type="number"
          min={0}
          max={20}
          step={1}
          value={bumpFactor}
          onInput={(e) => {
            const newValue = parseInt(e.target.value)
            if (!isNaN(newValue) && newValue >= 0) {
              setBumpFactor(newValue)
            }
          }}
          placeholder=""
        />
      </div>
    </Page>
  )
}

export default AliasNightmare
