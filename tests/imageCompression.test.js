import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { compressImageFile, IMAGE_MAX_BYTES } from '../src/lib/imageCompression.js'

const originalImage = globalThis.Image
const originalDocument = globalThis.document
let canvas
let encode
let formats

beforeEach(() => {
  formats = []
  encode = (type) => new Blob(['encoded'], { type })
  canvas = {
    width: 0, height: 0,
    getContext: () => ({ fillRect() {}, drawImage() {} }),
    toBlob(callback, type, quality) {
      formats.push(type)
      callback(encode(type, quality))
    },
  }
  globalThis.document = { createElement: () => canvas }
  globalThis.Image = class {
    naturalWidth = 4000
    naturalHeight = 3000
    set src(value) { this.url = value; queueMicrotask(() => this.onload()) }
  }
})

afterEach(() => {
  if (originalImage === undefined) delete globalThis.Image
  else globalThis.Image = originalImage
  if (originalDocument === undefined) delete globalThis.document
  else globalThis.document = originalDocument
})

test('keeps the actual MIME type and uses JPEG when WebP encoding falls back to PNG', async () => {
  encode = (type) => new Blob(['encoded'], { type: type === 'image/webp' ? 'image/png' : type })
  const file = await compressImageFile(new File(['source'], 'phone.heic'))
  assert.equal(file.type, 'image/jpeg')
  assert.equal(file.name, 'phone.jpg')
  assert.deepEqual(formats, ['image/webp', 'image/jpeg'])
  assert.equal(canvas.width, 0)
})

test('reduces dimensions when lowering quality cannot meet the upload limit', async () => {
  const sizes = []
  const large = new Blob([new Uint8Array(IMAGE_MAX_BYTES + 1)], { type: 'image/webp' })
  encode = () => {
    sizes.push(canvas.width)
    return canvas.width > 1000 ? large : new Blob(['small'], { type: 'image/webp' })
  }
  const file = await compressImageFile(new File(['source'], 'large.png'))
  assert(file.size <= IMAGE_MAX_BYTES)
  assert.equal(sizes[0], 1600)
  assert(sizes.includes(900))
})

test('does not return an oversized original if encoding fails', async () => {
  encode = () => null
  await assert.rejects(compressImageFile(new File(['source'], 'broken.png')))
  assert.equal(canvas.width, 0)
})

test('rejects undecodable photos with an actionable message', async () => {
  globalThis.Image = class {
    set src(value) { this.url = value; queueMicrotask(() => this.onerror()) }
  }
  await assert.rejects(compressImageFile(new File(['invalid'], 'broken.heic')), /JPG/)
})
