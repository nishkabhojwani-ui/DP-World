import fs from "fs";
import { pathToFileURL } from "url";

const filePath = process.argv[2];

if (!filePath) {
  console.error("PDF path is required");
  process.exit(1);
}

try {
  const fileName = filePath.split('/').pop();
  const fileExt = fileName.split('.').pop().toLowerCase();

  // For non-PDF files, just read as text
  if (fileExt !== 'pdf') {
    const data = fs.readFileSync(filePath, 'utf-8');
    process.stdout.write(JSON.stringify({
      source: pathToFileURL(filePath).toString(),
      text: data,
    }));
    process.exit(0);
  }

  // For PDF files, try to extract
  let pdfjs;
  try {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  } catch {
    try {
      pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");
    } catch {
      // PDF libraries not available - return error message that will be displayed to user
      console.error("PDF_NOT_SUPPORTED");
      process.exit(1);
    }
  }

  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjs.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) {
      pages.push(pageText);
    }
  }

  process.stdout.write(JSON.stringify({
    source: pathToFileURL(filePath).toString(),
    text: pages.join("\n\n"),
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
