/**
 * Triggers a browser file download from an in-memory string.
 *
 * Creates a temporary Blob → Object URL → anchor click, then cleans up.
 * Works in all modern browsers; no-op in SSR (guarded by `document`).
 */
export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
