import type { ClipboardEvent, KeyboardEvent } from 'react'

export type NumericOptions = {
  decimal?: boolean
  negative?: boolean
}

const PLATE_LENGTH = 7
const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
const ALLOWED_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Enter',
  'Escape',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
])

export function sanitizeNumeric(text: string, { decimal = false, negative = false }: NumericOptions = {}): string {
  const normalized = text.trim().replace(',', '.')
  let sign = ''
  let body = normalized
  if (negative && body.startsWith('-')) {
    sign = '-'
    body = body.slice(1)
  }
  let result = ''
  let seenSeparator = false
  for (const character of body) {
    if (character >= '0' && character <= '9') {
      result += character
    } else if (decimal && character === '.' && !seenSeparator) {
      seenSeparator = true
      result += character
    }
  }
  return sign + result
}

export function maskPlate(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, PLATE_LENGTH)
}

export function isValidPlate(text: string): boolean {
  return PLATE_PATTERN.test(text)
}

function isAllowedKey(event: KeyboardEvent<HTMLInputElement>, { decimal = false, negative = false }: NumericOptions): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || ALLOWED_KEYS.has(event.key)) {
    return true
  }
  if (event.key.length !== 1) {
    return true
  }
  if (event.key >= '0' && event.key <= '9') {
    return true
  }
  if (decimal && (event.key === '.' || event.key === ',')) {
    return true
  }
  return negative && event.key === '-'
}

export function numericInputProps(options: NumericOptions = {}) {
  return {
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isAllowedKey(event, options)) {
        event.preventDefault()
      }
    },
    onPaste: (event: ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData.getData('text')
      if (sanitizeNumeric(pasted, options) !== pasted.trim().replace(',', '.')) {
        event.preventDefault()
      }
    },
  }
}
