import React, { useState } from 'react'
import Page from '../components/Page'

const TheBackrooms = ({ onGenerateBtnClick, ...props }) => {
  const [numberOfRooms, setNumberOfRooms] = useState(50)
  const [roomHeight, setRoomHeight] = useState(4)
  const [percentOfLightsOn, setPercentOfLightsOn] = useState(30)

  return (
    <Page
      title="The Backrooms"
      background="previews/the-backrooms.png"
      onGenerateBtnClick={(config) => {
        onGenerateBtnClick({
          numberOfRooms,
          percentOfLightsOn,
          ...config,
        })
      }}
      {...props}
    >
      <div className="field">
        <label>Number of rooms</label>
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={numberOfRooms}
          onInput={(e) => {
            const newValue = parseInt(e.target.value)
            if (!isNaN(newValue) && newValue >= 0) {
              setNumberOfRooms(newValue)
            }
          }}
          placeholder=""
        />
      </div>
      <div className="field">
        <label>Height of ceiling (meters)</label>
        <input
          type="number"
          min={2}
          max={20}
          step={1}
          value={roomHeight}
          onInput={(e) => {
            const newValue = parseInt(e.target.value)
            if (!isNaN(newValue) && newValue >= 0) {
              setRoomHeight(newValue)
            }
          }}
          placeholder=""
        />
      </div>
      <div className="field">
        <label>Lights that are on (percent)</label>
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={percentOfLightsOn}
          onInput={(e) => {
            const newValue = parseInt(e.target.value)
            if (!isNaN(newValue) && newValue >= 0) {
              setPercentOfLightsOn(newValue)
            }
          }}
          placeholder=""
        />
      </div>
    </Page>
  )
}

export default TheBackrooms
