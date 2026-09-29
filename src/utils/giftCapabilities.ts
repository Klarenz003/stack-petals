export interface GiftCapabilities {
  hasPhotoUpload: boolean
  has360View: boolean
}

/** Normalizes QR claim fields from Supabase rows and local storage payloads. */
export function getGiftCapabilities(source: any): GiftCapabilities {
  return {
    hasPhotoUpload: source?.has_photo_upload ?? source?.hasPhotoUpload ?? true,
    has360View: source?.has_360_view ?? source?.has360Viewer ?? false,
  }
}
