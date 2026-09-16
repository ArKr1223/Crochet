export function yarnNumber(value, unit) {
  const text = String(value ?? '').normalize('NFKC').trim().replaceAll(',', '')
  const pattern = unit === 'g'
    ? /^(\d+(?:\.\d+)?)\s*(g|公克|克|kg|公斤)?$/i
    : /^(?:NT\$|NTD|TWD|\$)?\s*(\d+(?:\.\d+)?)\s*(?:元)?(?:\s*\/\s*(?:線|球|個))?$/i
  const match = text.match(pattern)
  if (!match) return ''
  const multiplier = unit === 'g' && /^(kg|公斤)$/i.test(match[2] ?? '') ? 1000 : 1
  return String(Number((Number(match[1]) * multiplier).toFixed(6)))
}

export function formatYarnUnit(value, unit) {
  const number = yarnNumber(value, unit)
  return number === '' ? (value || '未設定') : `${number} ${unit}`
}
