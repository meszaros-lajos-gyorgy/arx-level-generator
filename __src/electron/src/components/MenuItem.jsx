import React from 'react'
import cn from 'classnames'
import Badge from './Badge'

const MenuItem = ({
  isSelected,
  onClick,
  label,
  showBadge,
  badgeLabel = '',
}) => {
  return (
    <div
      className={cn('MenuItem', 'unselectable', { selected: isSelected })}
      onClick={onClick}
    >
      <span>{label}</span>
      {showBadge && <Badge>{badgeLabel}</Badge>}
    </div>
  )
}

export default MenuItem
