import { useState, useEffect } from 'react'

function autoFmt(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function toISO(display: string): string {
  const digits = display.replace(/\D/g, '')
  if (digits.length !== 8) return ''
  const dd = digits.slice(0, 2), mm = digits.slice(2, 4), yyyy = digits.slice(4)
  return `${yyyy}-${mm}-${dd}`
}

function fromISO(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [yyyy, mm, dd] = iso.split('-')
  return `${dd}/${mm}/${yyyy}`
}

interface Props {
  value: string
  onChange: (iso: string) => void
  className?: string
}

export function DateInput({ value, onChange, className }: Props) {
  const [display, setDisplay] = useState(() => fromISO(value))

  useEffect(() => {
    setDisplay(fromISO(value))
  }, [value])

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/AAAA"
      className={className}
      value={display}
      onChange={e => {
        const fmt = autoFmt(e.target.value)
        setDisplay(fmt)
        const iso = toISO(fmt)
        onChange(iso || (fmt === '' ? '' : value))
      }}
    />
  )
}
