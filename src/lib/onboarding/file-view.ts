/**
 * Turn a stored file's URL into one that OPENS in the browser rather than
 * downloading. Browsers render PDFs and images inline, but Office documents
 * (.docx, .xlsx, .pptx, …) can't be displayed, so a plain link to them just
 * downloads. Those are routed through Microsoft's Office Online viewer, which
 * previews them in a new tab; everything else keeps its direct URL.
 *
 * The extension comes from the file name — Airtable attachment URLs often
 * carry no extension (and a query string), so the URL itself isn't reliable.
 */

const OFFICE_EXTENSIONS = new Set([
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
]);

const OFFICE_VIEWER = "https://view.officeapps.live.com/op/view.aspx?src=";

export function inlineViewUrl(url: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (OFFICE_EXTENSIONS.has(ext)) {
    return `${OFFICE_VIEWER}${encodeURIComponent(url)}`;
  }
  return url;
}
