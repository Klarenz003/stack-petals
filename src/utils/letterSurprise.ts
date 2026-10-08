export type LetterSurprise = { title: string; message: string; photo: string | null }
export function getLetterSurprise(value: unknown): LetterSurprise | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const input = value as Record<string, unknown>
  const message = typeof input.message === 'string' ? input.message.trim().slice(0, 600) : ''
  if (!message) return null
  const photo = typeof input.photo === 'string' && input.photo.length <= 3000000
    && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(input.photo) ? input.photo : null
  return { title: typeof input.title === 'string' && input.title.trim() ? input.title.trim().slice(0, 80) : 'One more thing: you are loved.', message, photo }
}
