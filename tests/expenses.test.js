import { test } from 'node:test'
import assert from 'node:assert/strict'
import { totalExpenses } from '../src/lib/expenses.js'

test('counts per-ball prices and all patterns once, including used yarns', () => {
  assert.equal(totalExpenses([{ price: '100元', quantity: 3, isUsed: true }, { price: '50', quantity: 2 }], [{ price: '200' }, { price: 0 }]), 600)
})

test('handles legacy prices, missing prices, zero quantities and decimal cents', () => {
  assert.equal(totalExpenses([{ price: 'NT$ 1,280 / 線', quantity: 2 }, { price: '100', quantity: 0 }, { price: '未設定', quantity: 8 }], [{}, { price: '0.1' }, { price: '0.2' }]), 2560.3)
  assert.equal(totalExpenses([], []), 0)
})
