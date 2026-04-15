import fs from "fs";
import { pathToFileURL } from "url";

const filePath = process.argv[2];

if (!filePath) {
  console.error("PDF path is required");
  process.exit(1);
}

try {
  let pdfjs;
  try {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  } catch (importError) {
    // Fallback: try alternative import paths for Lambda environments
    try {
      pdfjs = await import("/opt/nodejs/node_modules/pdfjs-dist/legacy/build/pdf.mjs");
    } catch {
      // Last resort: try relative to node_modules
      pdfjs = await import("../node_modules/pdfjs-dist/legacy/build/pdf.mjs");
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
