import { supabase } from '@/supabaseClient'
import { createTimedCache } from '@/utils/timedCache'

export interface GalleryImage {
  id: string
  image_url: string
  title: string
  caption: string
  category: string
  focal_position: 'top' | 'center' | 'bottom'
}
export const galleryCache = createTimedCache<string, GalleryImage[]>()
export function fetchGalleryImages() {
  return galleryCache.load('featured', async () => {
    const { data, error } = await supabase.from('gallery_images')
      .select('id, image_url, title, caption, category, focal_position')
      .eq('featured', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as GalleryImage[]
  })
}
