export type DeliveryBeat = 'handoff' | 'thanks' | 'garden'
export const DELIVERY_SCENE_SECONDS = 4.8
export function deliveryBeat(seconds: number): DeliveryBeat { return seconds < 1 ? 'handoff' : seconds < 2.7 ? 'thanks' : 'garden' }
export const LUNA_NOTES = [
  { id: 'comfort', label: 'A little comfort', message: 'You don’t have to have everything figured out today. I’m glad you’re here.', reply: 'I really needed to hear that. I think I’ll take a slow walk by the pond today.' },
  { id: 'celebrate', label: 'Celebrate her', message: 'Look how far you’ve come. I’m cheering for your next little chapter.', reply: 'Sometimes I forget to notice the small wins. You’ve reminded me to celebrate one today.' },
  { id: 'gratitude', label: 'Say thank you', message: 'This town feels warmer because you’re in it. Thank you for being you.', reply: 'That makes me feel so seen. I’ll leave a little flower for someone else tomorrow.' },
] as const
