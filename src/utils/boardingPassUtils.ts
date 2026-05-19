import JSZip from 'jszip'
import type { BoardingPass } from '../types'

type PartialPass = Omit<BoardingPass, 'id' | 'createdAt'>

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

async function extractPkpass(file: File): Promise<Pick<BoardingPass, 'value' | 'format'>> {
  const zip = await JSZip.loadAsync(file)
  const passFile = zip.file('pass.json')
  if (!passFile) throw new Error('pass.json not found in pkpass')
  const json = JSON.parse(await passFile.async('string'))
  const barcodes: Array<{ message?: string; format?: string }> = json.barcodes ?? (json.barcode ? [json.barcode] : [])
  const bc = barcodes[0]
  return { value: bc?.message, format: bc?.format }
}

export async function processFile(
  file: File,
  label: string,
  tripId?: string,
  transportId?: string,
): Promise<PartialPass> {
  const base: PartialPass = { label, tripId, transportId }

  if (file.name.endsWith('.pkpass')) {
    const { value, format } = await extractPkpass(file)
    return { ...base, value, format }
  }

  const img = await compressImage(file)
  return { ...base, img }
}

const GW_FORMAT_MAP: Record<string, string> = {
  QR_CODE: 'PKBarcodeFormatQR',
  PDF_417: 'PKBarcodeFormatPDF417',
  AZTEC: 'PKBarcodeFormatAztec',
  CODE_128: 'PKBarcodeFormatCode128',
}

export function processGoogleWalletLink(
  rawUrl: string,
  label: string,
  tripId?: string,
  transportId?: string,
): PartialPass {
  const base: PartialPass = { label, tripId, transportId, url: rawUrl }

  // Only JWT-based "Save to Wallet" links contain extractable pass data
  const saveMatch = rawUrl.match(/pay\.google\.com\/gp\/v\/save\/([\w-]+\.[\w-]+\.[\w-]*)/)
  if (!saveMatch) return base

  try {
    const parts = saveMatch[1].split('.')
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(padded + '='.repeat((4 - (padded.length % 4)) % 4)))
    const inner = payload.payload ?? payload

    const objects = [
      ...(inner.flightObjects ?? []),
      ...(inner.genericObjects ?? []),
      ...(inner.eventTicketObjects ?? []),
      ...(inner.loyaltyObjects ?? []),
      ...(inner.offerObjects ?? []),
    ]
    const barcode = objects[0]?.barcode
    if (!barcode?.value) return base

    return {
      ...base,
      value: barcode.value,
      format: GW_FORMAT_MAP[barcode.type] ?? barcode.type,
    }
  } catch {
    return base
  }
}
