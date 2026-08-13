/**
 * Medical OCR Service - Text extraction for medical reports (PDF, JPG, JPEG, PNG)
 * Uses pdf-parse for PDF documents and Tesseract.js for scanned images.
 */
const pdfModule = require("pdf-parse");
const Tesseract = require("tesseract.js");

const extractTextFromReport = async (fileBufferOrBase64, mimeType = "application/pdf") => {
  if (!fileBufferOrBase64) {
    throw new Error("Unable to reliably read this medical report. File data is missing or empty.");
  }

  let text = "";

  try {
    let buffer;
    if (typeof fileBufferOrBase64 === "string") {
      // Base64 data URI format
      const base64Data = fileBufferOrBase64.replace(/^data:([a-zA-Z0-9+\/]+);base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else if (Buffer.isBuffer(fileBufferOrBase64)) {
      buffer = fileBufferOrBase64;
    } else {
      throw new Error("Invalid file buffer format");
    }

    if (buffer.length === 0) {
      throw new Error("File is empty (0 bytes).");
    }

    const isPdf = mimeType.includes("pdf") || (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46);

    if (isPdf) {
      // 1. Try pdf-parse module
      try {
        if (typeof pdfModule === "function") {
          const data = await pdfModule(buffer);
          text = data && data.text ? data.text.trim() : "";
        } else if (pdfModule && pdfModule.PDFParse) {
          const parser = new pdfModule.PDFParse(new Uint8Array(buffer));
          await parser.load();
          const extracted = await parser.getText();
          if (typeof extracted === "string") {
            text = extracted.trim();
          } else if (extracted && Array.isArray(extracted)) {
            text = extracted.join(" ").trim();
          } else if (extracted && extracted.text) {
            text = extracted.text.trim();
          }
        }
      } catch (pdfErr) {
        console.warn("pdf-parse primary extraction note:", pdfErr.message);
      }

      // 2. Fallback text stream extraction for PDF
      if (!text || text.length < 10) {
        const streamText = extractTextFromPdfStream(buffer);
        if (streamText && streamText.length > text.length) {
          text = streamText;
        }
      }
    } else {
      // Image file (JPG, PNG, JPEG, WEBP) -> Run Tesseract OCR engine safely
      try {
        const { data: ocrResult } = await Tesseract.recognize(buffer, "eng", {
          logger: () => {}, // silent
        });
        text = ocrResult && ocrResult.text ? ocrResult.text.trim() : "";
      } catch (ocrErr) {
        console.warn("Tesseract OCR image recognition failed:", ocrErr.message);
      }
    }

    if (!text || text.length < 5) {
      throw new Error("Unable to reliably read this medical report. Please upload a clearer document.");
    }

    return text;
  } catch (error) {
    console.error("OCR Extraction Error:", error.message);
    throw new Error(
      error.message.includes("Unable to reliably read")
        ? error.message
        : "Unable to reliably read this medical report. Please upload a clearer document."
    );
  }
};

// Helper function to extract text streams from PDF binary buffers
function extractTextFromPdfStream(buffer) {
  try {
    const raw = buffer.toString("binary");
    const textParts = [];
    const regex = /\(([^\)\\]*(?:\\.[^\)\\]*)*)\)/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      const str = match[1].replace(/\\([()\\])/g, "$1").trim();
      if (str.length >= 2 && /[a-zA-Z0-9]/.test(str)) {
        textParts.push(str);
      }
    }
    return textParts.join(" ");
  } catch (e) {
    return "";
  }
}

module.exports = {
  extractTextFromReport,
};
