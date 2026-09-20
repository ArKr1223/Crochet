import { yarnNumber } from './yarnUnits.js'

export function totalExpenses(yarns, patterns) {
  const cents = (price) => Math.round(Number(yarnNumber(price, '元') || 0) * 100)
  const yarnTotal = yarns.reduce((sum, yarn) => sum + cents(yarn.price) * Math.max(0, Number(yarn.quantity) || 0), 0)
  const patternTotal = patterns.reduce((sum, pattern) => sum + cents(pattern.price), 0)
  return (yarnTotal + patternTotal) / 100
}
