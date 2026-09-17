/** Versioned, line-safe rich text. Plain strings remain valid package content. */
export type RichNode = { type: string; text?: string; attrs?: Record<string, unknown>; marks?: RichNode[]; content?: RichNode[] };
const PREFIX = 'cmt-rich:v1:';
export const PACKAGE_FONTS = [
  ['Website font', ''], ['Arial', 'Arial, sans-serif'], ['Georgia', 'Georgia, serif'],
  ['Verdana', 'Verdana, sans-serif'], ['Times New Roman', '"Times New Roman", serif'], ['Courier New', '"Courier New", monospace'],
] as const;
export const PACKAGE_FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32'];
const nodes = new Set(['doc', 'paragraph', 'heading', 'text', 'hardBreak', 'bulletList', 'orderedList', 'listItem', 'blockquote']);
const marks = new Set(['bold', 'italic', 'underline', 'strike', 'textStyle', 'highlight', 'link']);
export function safeRichLink(value: unknown): string | undefined {
  if (typeof value !== 'string' || /[\u0000-\u0020]/.test(value)) return;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value) || /^\/(?!\/)/.test(value) || /^#[\w-]+$/.test(value)) return value;
}
export function cleanRichNode(value: unknown, depth = 0, mark = false): RichNode | null {
  if (!value || typeof value !== 'object' || depth > 20) return null;
  const node = value as RichNode;
  if (!(mark ? marks : nodes).has(node.type)) return null;
  const result: RichNode = { type: node.type };
  if (node.type === 'text') { if (typeof node.text !== 'string' || !node.text) return null; result.text = node.text; }
  const attrs: Record<string, unknown> = {};
  const a = node.attrs ?? {};
  if (['paragraph', 'heading'].includes(node.type) && ['left', 'center', 'right', 'justify'].includes(String(a.textAlign))) attrs.textAlign = a.textAlign;
  if (node.type === 'heading') attrs.level = [2, 3, 4].includes(Number(a.level)) ? Number(a.level) : 3;
  if (node.type === 'orderedList' && Number.isInteger(a.start) && Number(a.start) > 0 && Number(a.start) < 1000) attrs.start = a.start;
  if (node.type === 'textStyle') {
    if (PACKAGE_FONTS.some(([, font]) => font && font === a.fontFamily)) attrs.fontFamily = a.fontFamily;
    if (PACKAGE_FONT_SIZES.some(size => `${size}px` === a.fontSize)) attrs.fontSize = a.fontSize;
    if (typeof a.color === 'string' && /^#[\da-f]{6}$/i.test(a.color)) attrs.color = a.color;
  }
  if (node.type === 'highlight' && typeof a.color === 'string' && /^#[\da-f]{6}$/i.test(a.color)) attrs.color = a.color;
  if (node.type === 'link') { const href = safeRichLink(a.href); if (!href) return null; attrs.href = href; }
  if (Object.keys(attrs).length) result.attrs = attrs;
  if (!mark && Array.isArray(node.marks)) result.marks = node.marks.map(m => cleanRichNode(m, depth + 1, true)).filter((m): m is RichNode => m !== null);
  if (!mark && Array.isArray(node.content)) result.content = node.content.map(n => cleanRichNode(n, depth + 1)).filter((n): n is RichNode => n !== null);
  return result;
}
function decode(line: string): RichNode | null {
  if (!line.startsWith(PREFIX)) return null;
  try { return cleanRichNode(JSON.parse(line.slice(PREFIX.length))); } catch { return null; }
}
export const hasRichText = (value: string) => value.split('\n').some(line => Boolean(decode(line)));
const textNode = (text: string): RichNode[] => text ? [{ type: 'text', text }] : [];
export function richTextDocument(value: string): RichNode {
  const content: RichNode[] = [];
  for (const line of value.replace(/\r\n?/g, '\n').split('\n')) {
    const rich = decode(line);
    if (rich) { content.push(...(rich.type === 'doc' ? rich.content ?? [] : [rich])); continue; }
    const bullet = line.match(/^\s*[•*\-–]\s+(.+)$/);
    const heading = line.match(/^\s*\[([^\]\n]+)\]\s*$/);
    if (bullet) {
      const item = { type: 'listItem', content: [{ type: 'paragraph', content: textNode(bullet[1]) }] };
      if (content.at(-1)?.type === 'bulletList') content.at(-1)!.content!.push(item);
      else content.push({ type: 'bulletList', content: [item] });
    } else content.push({ type: heading ? 'heading' : 'paragraph', ...(heading ? { attrs: { level: 3 } } : {}), content: textNode(heading ? heading[1] : line) });
  }
  return { type: 'doc', content };
}
export function richNodeText(node: RichNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  return (node.content ?? []).map(richNodeText).join(['paragraph', 'heading'].includes(node.type) ? '' : '\n');
}
/** Also handles formatted text embedded in PDF labels, e.g. "- <rich line>". */
export function plainPackageText(value: string): string {
  return value.split('\n').map(line => {
    const index = line.indexOf(PREFIX);
    const node = index < 0 ? null : decode(line.slice(index));
    return node ? line.slice(0, index) + richNodeText(node) : line;
  }).join('\n');
}
export function serializeRichText(document: RichNode, lineItems = false): string {
  const clean = cleanRichNode(document);
  if (!clean || !richNodeText(clean).trim()) return '';
  const blocks = (clean.content ?? []).flatMap(node => lineItems && ['bulletList', 'orderedList'].includes(node.type)
    ? (node.content ?? []).flatMap(item => item.content ?? []) : [node]);
  return blocks.map(node => {
    // Keep unformatted paragraphs as ordinary text, preserving old exports and imports.
    if (node.type === 'paragraph' && !node.attrs && (node.content ?? []).every(child => child.type === 'text' && !child.marks?.length) && !richNodeText(node).includes('\n') && !richNodeText(node).startsWith(PREFIX)) return richNodeText(node);
    return PREFIX + JSON.stringify(node);
  }).join('\n');
}
