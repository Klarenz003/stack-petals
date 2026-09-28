export const themes = {
  romance: { id: 'romance', name: 'Romance', motif: 'romance' },
  family: { id: 'family', name: 'Family', motif: 'family' },
  birthday: { id: 'birthday', name: 'Birthday', motif: 'birthday' },
  sympathy: { id: 'sympathy', name: 'Sympathy', motif: 'sympathy' },
  friendship: { id: 'friendship', name: 'Friendship', motif: 'friendship' },
  graduation: { id: 'graduation', name: 'Graduation', motif: 'graduation' },
  original: { id: 'original', name: 'Original', motif: 'original' },
} as const

export type LetterThemeId = keyof typeof themes
