export function letterPasswordShareText(password: string): string {
  return `Your Stack Petals letter password:\n\n${password}\n\nScan your Gift QR card and enter this password to open your letter.\nKeep this message private.`
}
export function letterPasswordSaveText(password: string): string {
  return `STACK PETALS — PRIVATE LETTER PASSWORD\n\n${password}\n\nKeep this file private. Anyone with your QR card and this password can read the letter.\nThis is the letter password, not the card activation code.\n`
}
