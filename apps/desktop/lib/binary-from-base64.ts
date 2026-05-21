export function arrayBufferFromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function dataUrlFromBase64(base64: string, mime: string): string {
  return `data:${mime};base64,${base64}`;
}
