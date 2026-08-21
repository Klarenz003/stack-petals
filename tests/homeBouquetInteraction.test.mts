import assert from 'node:assert/strict'
import test from 'node:test'

import {
  REVEAL_RESET_DELAY_MS,
  clampToDocument,
  isTapGesture,
  viewportToDocumentPosition,
} from '../src/utils/homeBouquetInteraction.ts'

test('a short pointer movement is treated as a tap', () => {
  assert.equal(isTapGesture({ x: 100, y: 100 }, { x: 104, y: 103 }), true)
})

test('dragging the phone is not treated as a tap', () => {
  assert.equal(isTapGesture({ x: 100, y: 100 }, { x: 112, y: 100 }), false)
})

test('the revealed keepsafe returns to the scanner after six seconds', () => {
  assert.equal(REVEAL_RESET_DELAY_MS, 6_000)
})

test('phone coordinates stay anchored to the document while the page scrolls', () => {
  assert.deepEqual(
    viewportToDocumentPosition({ x: 420, y: 180 }, { x: 0, y: 640 }),
    { x: 420, y: 820 },
  )
})

test('the phone can be dragged below the hero while staying inside the document', () => {
  assert.deepEqual(
    clampToDocument(
      { x: 240, y: 1700 },
      { width: 180, height: 360 },
      { width: 1200, height: 2600 },
    ),
    { x: 240, y: 1700 },
  )
})
