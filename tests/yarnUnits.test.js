import { test } from 'node:test'
import assert from 'node:assert/strict'
import { yarnNumber, formatYarnUnit } from '../src/lib/yarnUnits.js'

test('normalizes existing units without duplicating them', () => {
  assert.equal(yarnNumber('300g', 'g'), '300')
  assert.equal(formatYarnUnit('300g', 'g'), '300 g')
  assert.equal(formatYarnUnit('500元', '元'), '500 元')
  assert.equal(yarnNumber('NT$ 1,280 / 線', '元'), '1280')
  assert.equal(formatYarnUnit('0.5 kg', 'g'), '500 g')
})

test('preserves zero and decimals, distinguishes missing and unsupported values', () => {
  assert.equal(formatYarnUnit(0, '元'), '0 元')
  assert.equal(formatYarnUnit('12.5', 'g'), '12.5 g')
  assert.equal(yarnNumber('未設定', '元'), '')
  assert.equal(formatYarnUnit('', 'g'), '未設定')
  assert.equal(formatYarnUnit('100-200元', '元'), '100-200元')
})
