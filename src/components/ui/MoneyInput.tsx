import { useState, useEffect } from 'react'

interface Props {
  value: number
  onChange: (n: number) => void
  className?: string
  placeholder?: string
}

export function MoneyInput({ value, onChange, className, placeholder = '0.00' }: Props) {
  const [display, setDisplay] = useState(() => value === 0 ? '' : String(value))

  useEffect(() => {
    setDisplay(value === 0 ? '' : String(value))
  }, [value])

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      className={className}
      value={display}
      onChange={e => {
        const raw = e.target.value
        if (/^\d*\.?\d*$/.test(raw)) {
          setDisplay(raw)
          onChange(parseFloat(raw) || 0)
        }
      }}
    />
  )
}
