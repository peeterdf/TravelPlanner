import { useEffect } from 'react'
import { X } from 'lucide-react'
import QRCode from 'react-qr-code'
import type { BoardingPass } from '../../types'

interface Props {
  bp: BoardingPass
  onClose: () => void
}

export function BoardingPassViewer({ bp, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const isQR = bp.format === 'PKBarcodeFormatQR'

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
      >
        <X size={28} />
      </button>
      <p className="text-white/60 text-sm mb-6 px-4 text-center">{bp.label}</p>

      {bp.img && (
        <img src={bp.img} alt={bp.label} className="max-w-full max-h-[80vh] object-contain" />
      )}

      {!bp.img && bp.value && isQR && (
        <div className="bg-white p-4 rounded-lg">
          <QRCode value={bp.value} size={260} />
        </div>
      )}

      {!bp.img && bp.value && !isQR && (
        <div className="flex flex-col items-center gap-4 px-8">
          <div className="bg-white rounded-lg p-6 w-full">
            <p className="font-mono text-sm break-all text-center text-gray-900 select-all">{bp.value}</p>
          </div>
          <p className="text-white/50 text-xs text-center">Mostrá este código en el escáner</p>
        </div>
      )}

      {!bp.img && !bp.value && (
        <p className="text-white/40 text-sm">No se pudo leer el código del pase</p>
      )}
    </div>
  )
}
