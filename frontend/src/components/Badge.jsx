import React from 'react'

// color: green | amber | red | blue | gray
export default function Badge({ label, color = 'gray', children }) {
  return <span className={`badge badge-${color}`}>{children}{label}</span>
}
