import React from 'react'
import cn from 'classnames'

const Loading = ({ message, isVisible, progressbarPercent, onDoneClick }) => {
  return (
    <div id="loading" className={cn({ hidden: !isVisible })}>
      <hr className={`progressbar percent${progressbarPercent}`} />
      <div className="info">
        <p>{message}</p>
        <button
          className={cn({ hidden: progressbarPercent < 100 })}
          onClick={onDoneClick}
        >
          ok
        </button>
      </div>
    </div>
  )
}

export default Loading
