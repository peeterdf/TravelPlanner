import { useState, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  className?: string
}

function toDisplay(v: string): string {
  return v ?? ''
}

export function TimeInput({ value, onChange, className }: Props) {
  const [display, setDisplay] = useState(toDisplay(value))

  useEffect(() => { setDisplay(toDisplay(value)) }, [value])

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    let formatted = digits
    if (digits.length >= 3) {
      formatted = digits.slice(0, 2) + ':' + digits.slice(2)
    }
    setDisplay(formatted)
    if (digits.length === 4) {
      const h = parseInt(digits.slice(0, 2))
      const m = parseInt(digits.slice(2, 4))
      if (h <= 23 && m <= 59) {
        onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      }
    } else if (digits.length === 0) {
      onChange('')
    }
  }

  const handleBlur = () => {
    if (!display) { onChange(''); return }
    const parts = display.split(':')
    if (parts.length === 2) {
      const h = parseInt(parts[0])
      const m = parseInt(parts[1])
      if (!isNaN(h) && !isNaN(m) && h <= 23 && m <= 59) {
        const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        setDisplay(formatted)
        onChange(formatted)
        return
      }
    }
    setDisplay(value)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={e => handleChange(e.target.value)}
      onBlur={handleBlur}
      placeholder="HH:MM"
      maxLength={5}
      className={className}
    />
  )
}
