"use client";

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, RemoveFormatting, Link2, Unlink, Highlighter } from 'lucide-react';
import { PACKAGE_FONTS, PACKAGE_FONT_SIZES, richTextDocument, serializeRichText, safeRichLink } from '@/lib/packageRichText';
import styles from './PackageRichTextEditor.module.css';

export default function PackageRichTextEditor({ id, label, value, onChange, disabled = false, lineItems = false, describedBy }: {
  id: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean; lineItems?: boolean; describedBy?: string;
}) {
  const current = useRef({ onChange, disabled, lineItems });
  useEffect(() => { current.current = { onChange, disabled, lineItems }; }, [onChange, disabled, lineItems]);
  const lastValue = useRef(value);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] }, codeBlock: false, code: false, horizontalRule: false, link: { openOnClick: false, autolink: false, defaultProtocol: 'https' } }), TextStyleKit.configure({ backgroundColor: false, lineHeight: false }), TextAlign.configure({ types: ['heading', 'paragraph'] }), Highlight.configure({ multicolor: true })],
    content: richTextDocument(value),
    editable: !disabled,
    editorProps: { attributes: { id, role: 'textbox', 'aria-label': label, 'aria-multiline': 'true', ...(describedBy ? { 'aria-describedby': describedBy } : {}) } },
    onUpdate: ({ editor }) => {
      if (current.current.disabled) return;
      const next = serializeRichText(editor.getJSON(), current.current.lineItems);
      lastValue.current = next;
      current.current.onChange(next);
    },
  });
  const state = useEditorState({ editor, selector: ({ editor }) => editor ? {
    bold: editor.isActive('bold'), italic: editor.isActive('italic'), underline: editor.isActive('underline'), strike: editor.isActive('strike'),
    bulletList: editor.isActive('bulletList'), orderedList: editor.isActive('orderedList'), highlight: editor.isActive('highlight'), link: editor.isActive('link'),
    font: editor.getAttributes('textStyle').fontFamily ?? '', size: editor.getAttributes('textStyle').fontSize ?? '', color: editor.getAttributes('textStyle').color ?? '#334155',
    block: [2, 3, 4].find(level => editor.isActive('heading', { level })) ?? 0,
    align: ['left', 'center', 'right', 'justify'].find(textAlign => editor.isActive({ textAlign })) ?? 'left',
    undo: editor.can().undo(), redo: editor.can().redo(),
  } : null });
  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);
  useEffect(() => {
    if (!editor || value === lastValue.current) return;
    lastValue.current = value;
    editor.commands.setContent(richTextDocument(value), { emitUpdate: false });
  }, [editor, value]);
  const commands: { label: string; icon: typeof Bold; active?: boolean; disabled?: boolean; run: () => unknown }[] = editor ? [
    { label: 'Bold', icon: Bold, active: state?.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: Italic, active: state?.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Underline', icon: Underline, active: state?.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: 'Strikethrough', icon: Strikethrough, active: state?.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { label: 'Highlight text', icon: Highlighter, active: state?.highlight, run: () => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run() },
    { label: 'Bulleted list', icon: List, active: state?.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', icon: ListOrdered, active: state?.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
    ...([{ label: 'Align left', value: 'left', icon: AlignLeft }, { label: 'Align center', value: 'center', icon: AlignCenter }, { label: 'Align right', value: 'right', icon: AlignRight }, { label: 'Justify', value: 'justify', icon: AlignJustify }].map(item => ({ ...item, active: state?.align === item.value, run: () => editor.chain().focus().setTextAlign(item.value).run() }))),
    { label: 'Add or edit link', icon: Link2, active: state?.link, run: () => { setLink(editor.getAttributes('link').href ?? ''); setLinkError(''); setLinkOpen(!linkOpen); } },
    { label: 'Remove link', icon: Unlink, disabled: !state?.link, run: () => editor.chain().focus().extendMarkRange('link').unsetLink().run() },
    { label: 'Clear formatting', icon: RemoveFormatting, run: () => editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run() },
    { label: 'Undo', icon: Undo2, disabled: !state?.undo, run: () => editor.chain().focus().undo().run() },
    { label: 'Redo', icon: Redo2, disabled: !state?.redo, run: () => editor.chain().focus().redo().run() },
  ] : [];
  return <div className={styles.root} aria-busy={!editor}>
    <fieldset disabled={disabled || !editor} className={styles.toolbar} aria-label={`${label} formatting`}>
      <div className={styles.selects}>
        <label>Style<select aria-label={`${label}: text style`} value={state?.block ?? 0} onChange={event => Number(event.target.value) ? editor?.chain().focus().setHeading({ level: Number(event.target.value) as 2 | 3 | 4 }).run() : editor?.chain().focus().setParagraph().run()}><option value={0}>Paragraph</option><option value={2}>Heading 2</option><option value={3}>Heading 3</option><option value={4}>Heading 4</option></select></label>
        <label>Font<select aria-label={`${label}: font`} value={state?.font ?? ''} onChange={event => event.target.value ? editor?.chain().focus().setFontFamily(event.target.value).run() : editor?.chain().focus().unsetFontFamily().run()}>{PACKAGE_FONTS.map(([name, font]) => <option key={name} value={font}>{name}</option>)}</select></label>
        <label>Size<select aria-label={`${label}: font size`} value={state?.size ?? ''} onChange={event => event.target.value ? editor?.chain().focus().setFontSize(event.target.value).run() : editor?.chain().focus().unsetFontSize().run()}><option value="">Default</option>{PACKAGE_FONT_SIZES.map(size => <option key={size} value={`${size}px`}>{size} px</option>)}</select></label>
        <label>Color<input type="color" aria-label={`${label}: text color`} value={state?.color ?? '#334155'} onChange={event => editor?.chain().focus().setColor(event.target.value).run()} /></label>
      </div>
      <div className={styles.buttons}>{commands.map(({ label: name, icon: Icon, run, active, disabled: unavailable }) => <button key={name} type="button" title={name} aria-label={`${label}: ${name}`} aria-pressed={active} disabled={disabled || unavailable} onMouseDown={event => event.preventDefault()} onClick={run}><Icon size={16} aria-hidden="true" /></button>)}</div>
      {linkOpen && <div className={styles.link}>
        <label>Link address<input type="url" aria-label={`${label}: link address`} value={link} onChange={event => setLink(event.target.value)} placeholder="https://example.com" /></label>
        <button type="button" onClick={() => { const href = safeRichLink(link.trim()); if (!href) { setLinkError('Enter an https:// link, email, phone number or website path.'); return; } editor?.chain().focus().extendMarkRange('link').setLink({ href }).run(); setLinkOpen(false); }}>Apply link</button>
        <button type="button" onClick={() => setLinkOpen(false)}>Cancel</button>
        {linkError && <p role="alert">{linkError}</p>}
      </div>}
    </fieldset>
    <EditorContent editor={editor} className={styles.content} />
    {!editor && <p className="p-4 text-sm text-cmt-neutral-500">Loading editor…</p>}
  </div>;
}
