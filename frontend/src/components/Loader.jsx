import React from 'react'

export default function Loader({ text = 'Loading…' }) {
  return (
    <div className="loader-wrap">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  )
}
