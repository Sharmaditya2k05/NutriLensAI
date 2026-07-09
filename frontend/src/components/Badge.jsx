import React from 'react'

const TAG_COLORS = {
  green: ['DCFCE7', '15803D'],
  amber: ['FEF3C7', '92400E'],
  red:   ['FEE2E2', 'B91C1C'],
  blue:  ['DBEAFE', '1D4ED8'],
  gray:  ['F3F4F6', '4B5563'],
}

export default function Badge({ label, color = 'gray' }) {
  const [bg, fg] = TAG_COLORS[color] || TAG_COLORS.gray
  return (
    <span
      className="badge"
      style={{ background: `#${bg}`, color: `#${fg}` }}
    >
      {label}
    </span>
  )
}
