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
    // Try standard import first
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  } catch (err) {
    // Fallback: try with .js extension for Node.js
    try {
      pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");
    } catch {
      // Last resort: use pdf-parse
      const pdf = await import("pdf-parse/lib/pdf-parse.js");
      const dataBuffer = fs.readFileSync(filePath);
      const result = await pdf.default(dataBuffer);
      const text = result.text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .replace(/\s+/g, ' ')
        .trim();

      process.stdout.write(JSON.stringify({
        source: pathToFileURL(filePath).toString(),
        text: text,
      }));
      process.exit(0);
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
