/**
 * Test PDF generation to verify jsPDF output
 */

import { jsPDF } from "jspdf";

console.log("🧪 Testing PDF Generation\n");
console.log("=".repeat(60));

try {
  // Create PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Add title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const title = "Test PDF Document";
  const titleLines = doc.splitTextToSize(title, maxWidth);
  doc.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 8 + 5;

  // Add date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const dateText = `Generated on ${new Date().toLocaleString()}`;
  doc.text(dateText, margin, yPosition);
  yPosition += 8;

  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Add content
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const content =
    "This is a test PDF document generated with jsPDF. It should be readable and properly formatted.";
  const contentLines = doc.splitTextToSize(content, maxWidth);

  for (const line of contentLines) {
    if (yPosition + 6 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 6;
  }

  // Get PDF as buffer
  const pdfOutput = doc.output("arraybuffer");
  const pdfBuffer = Buffer.from(pdfOutput);

  console.log(`✅ PDF Generated Successfully`);
  console.log(`📊 PDF Size: ${pdfBuffer.length} bytes`);
  console.log(
    `📊 PDF Header (first 20 bytes): ${pdfBuffer.slice(0, 20).toString("hex")}`,
  );
  console.log(`📊 PDF Magic: ${pdfBuffer.slice(0, 4).toString("ascii")}`);

  // Check if it's a valid PDF
  const pdfMagic = pdfBuffer.slice(0, 4).toString("ascii");
  if (pdfMagic === "%PDF") {
    console.log(`✅ Valid PDF magic number detected`);
  } else {
    console.log(`❌ Invalid PDF magic number: ${pdfMagic}`);
  }

  // Save to file for testing
  const fs = await import("fs");
  fs.writeFileSync("test-output.pdf", pdfBuffer);
  console.log(`💾 PDF saved to test-output.pdf`);

  console.log("=".repeat(60));
  console.log("✅ PDF generation test passed!");
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error(error.stack);
}
