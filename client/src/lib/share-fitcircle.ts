import QRCodeWriter from '@zxing/library/esm/core/qrcode/QRCodeWriter';
import BarcodeFormat from '@zxing/library/esm/core/BarcodeFormat';
import EncodeHintType from '@zxing/library/esm/core/EncodeHintType';
export const FITCIRCLE_URL = 'https://fullstackraven.github.io/FitCircle/';
export function fitcircleQr() {
  const hints = new Map([[EncodeHintType.MARGIN, 4]]);
  return new QRCodeWriter().encode(FITCIRCLE_URL, BarcodeFormat.QR_CODE, 0, 0, hints);
}
export async function copyFitcircleLink() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(FITCIRCLE_URL);
    return;
  }
  const field = document.createElement('textarea');
  field.value = FITCIRCLE_URL;
  field.setAttribute('aria-label', 'FitCircle link');
  field.style.position = 'fixed'; field.style.opacity = '0';
  const previous = document.activeElement as HTMLElement | null;
  document.body.append(field);
  try { field.select(); if (!document.execCommand('copy')) throw new Error('Copy is unavailable. Select and copy the link above.'); }
  finally { field.remove(); previous?.focus({ preventScroll: true }); }
}
