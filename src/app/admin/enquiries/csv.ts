/** Keep customer-supplied values as text when an export is opened in Excel. */
export function csvCell(value: string) {
  // Tabs/newlines and whitespace before a formula can also trigger spreadsheet
  // evaluation. Quoting alone does not stop that; prefix the text with '.
  const guarded = /^[=+\-@\t\r\n]/.test(value) || /^[\s\u0000-\u001f]+[=+\-@]/.test(value)
    ? `'${value}`
    : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}
