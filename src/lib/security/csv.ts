/**
 * CSV cell encoding that prevents spreadsheet formula ("CSV") injection.
 *
 * A field whose value begins with `=`, `+`, `-`, `@` or a control character
 * (tab / CR / LF) is interpreted as a formula by Excel and Google Sheets — so
 * a student name like `=HYPERLINK("http://evil","click")` or `=cmd|…` would
 * execute when an exported file is opened. We neutralise such values by
 * prefixing a single quote (forcing text), then standard quote-escape.
 */
export function csvCell(value: string): string {
  const guarded = /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}
