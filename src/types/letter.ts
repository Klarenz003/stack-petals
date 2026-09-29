export interface LetterRecord {
  id: string
  order_id: string
  recipient: string
  sender: string
  message: string
  petal_messages: string[]
  petal_artworks?: number[]
  memories: string[]
  angle_photos: string[]
  backgrounds: Record<string, string | null>
  music_url: string
  bouquet_image_url: string
  published: boolean
  template: string
  letter_theme?: string | null
  has_360_view?: boolean | null
  has_photo_upload?: boolean | null
}
