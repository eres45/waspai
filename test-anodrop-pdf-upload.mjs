/**
 * Test uploading a real PDF to AnoDrop
 */

import { jsPDF } from "jspdf";
import fs from "fs";

const ANODROP_KEY = "1377679324043542622";
const ANODROP_URL = "https://anondrop.net";

async function testPdfUploadToAnodrop() {
  console.log("🧪 Testing PDF Upload to AnoDrop\n");
  console.log("=".repeat(60));

  try {
    // Generate a test PDF
    console.log("📝 Generating test PDF...");
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
    const title = "Test Resume PDF";
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
    const content = `John Doe
Email: john@example.com
Phone: +1-234-567-8900

EXPERIENCE
Senior Developer at Tech Corp (2020-Present)
- Led development of cloud infrastructure
- Managed team of 5 developers
- Improved performance by 40%

Junior Developer at StartUp Inc (2018-2020)
- Developed web applications
- Fixed critical bugs
- Mentored new developers

SKILLS
- JavaScript, TypeScript, Python
- React, Node.js, PostgreSQL
- AWS, Docker, Kubernetes`;

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

    console.log(`✅ PDF Generated: ${pdfBuffer.length} bytes`);
    console.log(`✅ PDF Magic: ${pdfBuffer.slice(0, 4).toString("ascii")}\n`);

    // Save locally for reference
    fs.writeFileSync("test-resume.pdf", pdfBuffer);
    console.log("💾 Saved locally to test-resume.pdf\n");

    // Upload to AnoDrop
    console.log("📤 Uploading to AnoDrop...");
    const formData = new FormData();
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    formData.append("file", blob, "test-resume.pdf");

    const uploadUrl = `${ANODROP_URL}/upload?key=${ANODROP_KEY}`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    console.log(`📊 Response Status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Upload failed:", error);
      return;
    }

    const responseText = await response.text();
    console.log(`📄 Response Body: ${responseText}\n`);

    // Extract file ID
    const match = responseText.match(/https:\/\/anondrop\.net\/(\d{18,})/);
    const fileId = match ? match[1] : null;

    if (fileId) {
      const downloadUrl = `${ANODROP_URL}/${fileId}`;
      console.log(`✅ File uploaded successfully!`);
      console.log(`✅ Download URL: ${downloadUrl}`);
      console.log(`\n🔗 Try opening this link in your browser:`);
      console.log(`   ${downloadUrl}`);
    } else {
      console.error("❌ Could not extract file ID");
    }

    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }
}

testPdfUploadToAnodrop();
