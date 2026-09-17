import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { hasRichText, richTextDocument, type RichNode } from '@/lib/packageRichText';

/** Render only supported nodes/marks as React elements. No authored HTML is executed. */
export default function PackageRichText({ value }: { value: string }) {
  if (!hasRichText(value)) return <>{value}</>;
  function render(node: RichNode, key: number): ReactNode {
    const children = node.content?.map(render);
    const align = node.attrs?.textAlign as CSSProperties['textAlign'];
    if (node.type === 'text') {
      let text: ReactNode = node.text;
      for (const mark of node.marks ?? []) {
        switch (mark.type) {
          case 'bold': text = <strong>{text}</strong>; break;
          case 'italic': text = <em>{text}</em>; break;
          case 'underline': text = <u>{text}</u>; break;
          case 'strike': text = <s>{text}</s>; break;
          case 'textStyle': text = <span style={mark.attrs as CSSProperties}>{text}</span>; break;
          case 'highlight': text = <mark style={{ backgroundColor: String(mark.attrs?.color ?? '#fef08a'), color: 'inherit' }}>{text}</mark>; break;
          case 'link': text = <a href={String(mark.attrs?.href)} className="underline underline-offset-2" rel="noopener noreferrer">{text}</a>; break;
        }
      }
      return <Fragment key={key}>{text}</Fragment>;
    }
    if (node.type === 'hardBreak') return <br key={key} />;
    if (node.type === 'bulletList' || node.type === 'orderedList') return <span key={key} role="list" style={{ display: 'block', paddingLeft: '1.5em', listStyleType: node.type === 'bulletList' ? 'disc' : 'decimal' }}>{children}</span>;
    if (node.type === 'listItem') return <span key={key} role="listitem" style={{ display: 'list-item' }}>{children}</span>;
    if (node.type === 'heading') return <span key={key} role="heading" aria-level={Number(node.attrs?.level ?? 3)} style={{ display: 'block', fontWeight: 700, fontSize: ({ 2: '1.5em', 3: '1.25em', 4: '1.1em' }[Number(node.attrs?.level) as 2 | 3 | 4]), textAlign: align, marginBlock: '.5em' }}>{children}</span>;
    if (node.type === 'blockquote') return <span key={key} style={{ display: 'block', borderLeft: '3px solid #e2e8f0', paddingLeft: '1em', fontStyle: 'italic' }}>{children}</span>;
    return <span key={key} style={{ display: 'block', textAlign: align }}>{children?.length ? children : <br />}</span>;
  }
  return <span className="cmt-rich-text whitespace-pre-wrap break-words">{richTextDocument(value).content?.map(render)}</span>;
}
