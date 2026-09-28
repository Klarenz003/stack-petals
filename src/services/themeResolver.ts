import { themes, type LetterThemeId } from '@/themes'

export function resolveTheme(letter?: { letter_theme?: string | null; theme?: string | null }) {
  const requested = letter?.letter_theme || letter?.theme || 'romance'
  return themes[requested as LetterThemeId] || themes.romance
}
