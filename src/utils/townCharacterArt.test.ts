import { describe,expect,it } from 'vitest'
import { characterView } from './townCharacterArt'
describe('native SVG character orientations',()=>{
  it('distinguishes rear diagonals from front diagonals',()=>{
    expect(characterView('up-right')).toMatchObject({back:true,diagonal:true,mirrored:false,projection:.84})
    expect(characterView('down-right')).toMatchObject({back:false,diagonal:true,mirrored:false,projection:.84})
    expect(characterView('up-left')).toMatchObject({back:true,diagonal:true,mirrored:true})
    expect(characterView('down-left')).toMatchObject({back:false,diagonal:true,mirrored:true})
  })
  it('has safe cardinal fallback and symmetric left/right artwork',()=>{
    expect(characterView('unknown').facing).toBe('down')
    expect(characterView('left').projection).toBe(characterView('right').projection)
    expect(characterView('left').mirrored).toBe(true)
    expect(characterView('right').mirrored).toBe(false)
  })
})
