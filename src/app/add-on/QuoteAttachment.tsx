import type { RefObject } from "react";
import { AlertCircle, FileText, ShieldCheck, Upload, X } from "lucide-react";
import styles from "./FlightEnquiry.module.css";

export default function QuoteAttachment({ id, file, inputRef, error, onChange }: {
  id: string;
  file: File | null;
  inputRef: RefObject<HTMLInputElement | null>;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className={styles.uploadArea}>
      <label htmlFor={id} className="block text-sm font-semibold text-cmt-neutral-900">
        Attach your quote <span className="font-normal text-cmt-neutral-500">(optional)</span>
      </label>
      <div className={`${styles.uploadBox} ${error ? styles.uploadInvalid : ""}`}>
        <span className={styles.uploadIcon}><Upload size={22} aria-hidden="true" /></span>
        <div className={styles.uploadCopy}>
          <p className="text-sm font-semibold text-cmt-neutral-900">{file ? "PDF ready to send" : "Add your quote as a PDF"}</p>
          <p id={`${id}-format`} className="mt-1 text-xs text-cmt-neutral-500">PDF only · Maximum 10 MB</p>
        </div>
        <input ref={inputRef} id={id} name="quote" type="file" accept=".pdf,application/pdf"
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-format ${id}-hint${error ? ` ${id}-error` : ""}`}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          className={styles.fileInput} />
        <span className={styles.uploadButton} aria-hidden="true">{file ? "Change PDF" : "Choose PDF"}</span>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-cmt-error-700">
        <AlertCircle size={14} className="shrink-0" aria-hidden="true" />{error}
      </p>}
      {file && <div className={styles.selectedFile} role="status">
        <FileText size={18} aria-hidden="true" />
        <div><p>{file.name}</p><span>{(file.size / 1_000_000).toFixed(2)} MB · Uploaded when you send</span></div>
        <button type="button" aria-label="Remove PDF" onClick={() => onChange(null)}><X size={18} aria-hidden="true" /></button>
      </div>}
      <p id={`${id}-hint`} className={styles.uploadHint}>
        <ShieldCheck size={15} aria-hidden="true" />
        <span>Your attachment expires after 72 hours and is automatically deleted. Your enquiry details stay with our travel desk.</span>
      </p>
    </div>
  );
}
