import React, { useEffect, useState } from 'react'
import Icon from './Icon'

// Nutri-Score ladder pulse. `inline` for use inside rows; `steps` to show progress stages.
export default function Loader({ text = 'Loading…', inline = false, steps }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!steps?.length) return
    const t = setInterval(() => setI(n => Math.min(n + 1, steps.length - 1)), 4200)
    return () => clearInterval(t)
  }, [steps])

  return (
    <div className={`loader ${inline ? 'loader-inline' : ''}`} role="status" aria-live="polite">
      <div className="loader-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <span>{text}</span>
      {steps?.length > 0 && (
        <ul className="loader-steps">
          {steps.map((s, n) => (
            <li key={s} className={n < i ? 'done' : n === i ? 'now' : ''}>
              <i>{n < i && <Icon name="check" size={11} stroke={3} />}</i>{s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
