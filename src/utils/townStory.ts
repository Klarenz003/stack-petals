export type Stem = 'pink' | 'blue' | 'sun'
export type StoryStage = 'new' | 'gather' | 'arrange' | 'deliver' | 'complete'
export type StorySave = { stage: StoryStage; stems: Stem[]; wrapping: 'rose' | 'sage' | 'cream'; bow: number; completed: boolean }
export const FIRST_DELIVERY = {
  title: 'A little sunshine', requester: 'Milo', recipient: 'Luna',
  request: 'Luna has had a difficult week. Could you make her something that feels like sunshine? A yellow flower, a soft pink one, and a little blue for brighter days.',
  thanks: 'These are my favourite colours. I thought today would be another ordinary day... but you made it feel a little brighter. Thank you.',
  card: 'Some days, sunshine arrives on two little feet. Thank you for bringing a little of it to me.',
}
export const freshStory = (): StorySave => ({ stage: 'new', stems: [], wrapping: 'cream', bow: 0, completed: false })
export function restoreStory(value: unknown): StorySave {
  const fallback = freshStory()
  if (!value || typeof value !== 'object') return fallback
  const data = value as Partial<StorySave>
  if (!['new', 'gather', 'arrange', 'deliver', 'complete'].includes(data.stage || '')) return fallback
  const stems = Array.isArray(data.stems) ? data.stems.filter((stem): stem is Stem => ['pink', 'blue', 'sun'].includes(stem)).slice(0, 3) : []
  const complete = data.completed === true
  const ready = isSunshineBouquet(stems)
  const stage = complete ? 'complete' : data.stage === 'complete' ? 'new' : data.stage === 'deliver' && !ready ? 'arrange' : data.stage as StoryStage
  return { stage, stems, wrapping: data.wrapping === 'rose' || data.wrapping === 'sage' ? data.wrapping : 'cream', bow: typeof data.bow === 'number' && Number.isFinite(data.bow) ? Math.max(0, Math.min(1, data.bow)) : 0, completed: complete }
}
export const isSunshineBouquet = (stems: Stem[]) => stems.length === 3 && new Set(stems).size === 3
export function gardenLevel(deliveries: number) { return deliveries >= 5 ? 3 : deliveries >= 3 ? 2 : deliveries >= 1 ? 1 : 0 }
export const STORY_STEPS = ['Meet Milo', 'Collect 3 petals', 'Arrange & wrap', 'Find Luna', 'A garden grows']
