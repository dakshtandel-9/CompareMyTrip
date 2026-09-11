export const MAX_QUOTE_BYTES = 10_000_000;
export const QUOTE_RETENTION_MS = 72 * 60 * 60 * 1000;

export function quoteFileError(file: { name: string; size: number; type: string }): string {
  if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) return 'Please choose a PDF file.';
  if (file.size <= 0) return 'The PDF is empty. Please choose another file.';
  if (file.size > MAX_QUOTE_BYTES) return 'The PDF must be 10 MB or smaller.';
  return '';
}

export type QuoteEnquiry = {
  name: string; email: string; phone: string; destination: string;
  departure: string; travellers: string; message: string;
};

export function validQuoteEnquiry(value: unknown): value is QuoteEnquiry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const limits: Record<string, number> = { name: 120, email: 254, phone: 24, destination: 160, departure: 20, travellers: 20, message: 5000 };
  if (!Object.entries(limits).every(([key, max]) => typeof v[key] === 'string' && (v[key] as string).length <= max)) return false;
  return (v.name as string).trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email as string) && (v.phone as string).replace(/\D/g, '').length >= 7;
}

export async function sendEnquiryWithQuote(file: File, enquiry: QuoteEnquiry) {
  const error = quoteFileError(file);
  if (error) throw new Error(error);
  const start = await fetch('/api/quotes', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: { name: file.name, size: file.size, type: file.type }, enquiry }),
  });
  const upload = await start.json();
  if (!start.ok) throw new Error(upload.error || 'Could not prepare your PDF upload.');
  const result = await fetch(upload.url, { method: 'PUT', headers: upload.headers, body: file });
  if (!result.ok) throw new Error('The PDF could not be uploaded. Please try again.');
  // Retrying finalization is safe: the server creates one enquiry per upload.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const complete = await fetch(`/api/quotes/${upload.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: upload.token }),
      });
      const data = await complete.json();
      if (!complete.ok) throw new Error(data.error || 'Your quote could not be submitted.');
      return;
    } catch (cause) { if (attempt === 1) throw cause; }
  }
}
