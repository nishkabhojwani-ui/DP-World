import fs from "fs";
import { pathToFileURL } from "url";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const filePath = process.argv[2];

if (!filePath) {
  console.error("PDF path is required");
  process.exit(1);
}

try {
  const fileBuffer = fs.readFileSync(filePath);

  pdfParse(fileBuffer).then(data => {
    const text = data.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim();

    process.stdout.write(JSON.stringify({
      source: pathToFileURL(filePath).toString(),
      text: text,
    }));
  }).catch(err => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
