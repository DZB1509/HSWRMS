/**
 * Utility to auto-heal mojibake (UTF-8 bytes mis-decoded as Windows-1252/ISO-8859-1)
 * in client-side text displays.
 */
export const cleanMojibake = (text?: string | null): string => {
  if (!text) return '';
  if (
    text.includes('Ã') ||
    text.includes('Æ') ||
    text.includes('áº') ||
    text.includes('á»') ||
    text.includes('Ä‘') ||
    text.includes('Å©') ||
    text.includes('â€')
  ) {
    try {
      const bytes = new Uint8Array([...text].map((c) => c.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (!decoded.includes('\uFFFD') && decoded.length < text.length) {
        return decoded;
      }
    } catch {
      // keep text
    }
  }
  return text;
};
