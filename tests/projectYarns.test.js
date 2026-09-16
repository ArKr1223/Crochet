import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readProjectYarns, writeProjectYarns, describeProjectYarns } from '../src/lib/projectYarns.js'

test('multiple yarn IDs and notes survive storage and reopening', () => {
  const project = { yarnLinks: [{ id: 'a', name: 'Cotton' }, { id: 'b', name: 'Cotton' }], yarnNote: 'Existing note' }
  assert.deepEqual(readProjectYarns(writeProjectYarns(project)), project)
  assert.equal(describeProjectYarns(project.yarnLinks, project.yarnNote), 'Cotton、Cotton、Existing note')
  assert.deepEqual(readProjectYarns(writeProjectYarns({ yarnLinks: [], yarnNote: '' })), { yarnLinks: [], yarnNote: '' })
})

test('legacy plain text and unrelated JSON remain intact', () => {
  for (const value of ['Cotton 2 balls', '{invalid', '{"other":true}', 'null', '']) {
    assert.deepEqual(readProjectYarns(value), { yarnLinks: [], yarnNote: value })
  }
})
