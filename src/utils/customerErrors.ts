/** Only explicitly recognized customer guidance may cross the UI error boundary. */
export function checkoutErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'No proof') return 'Please upload your payment proof before continuing.'
    if (error.message === 'Stock is no longer available') {
      return 'Some items are no longer available. Please review your cart before continuing.'
    }
  }
  return 'We couldn’t complete your order. Please try again. If this continues, contact us for help.'
}
