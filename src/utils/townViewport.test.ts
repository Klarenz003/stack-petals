import { describe, expect, it } from 'vitest'
import { townViewport } from './townViewport'
describe('mobile Town viewport', () => {
  it('follows visible bounds when browser bars or the keyboard reduce the viewport', () => {
    expect(townViewport(390,844,{width:390,height:430,offsetTop:45,offsetLeft:0})).toEqual({width:390,height:430,top:45,left:0})
  })
  it('works without Visual Viewport support', () => {
    expect(townViewport(844,390)).toEqual({width:844,height:390,top:0,left:0})
  })
  it('rejects invalid measurements and negative overscroll offsets', () => {
    expect(townViewport(390,844,{width:NaN,height:0,offsetTop:-12,offsetLeft:-5})).toEqual({width:390,height:844,top:0,left:0})
  })
})
