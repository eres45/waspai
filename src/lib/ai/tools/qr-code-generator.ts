import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { serverFileStorage } from "lib/file-storage";

/**
 * QR Code Generator Tool
 * Generates QR codes from text, URLs, or images and provides download links
 */
export const qrCodeGeneratorTool = createTool({
  name: "generate-qr-code",
  description:
    "Generate a QR code from text, URL, or image data. Returns a downloadable PNG image of the QR code.",
  inputSchema: z.object({
    content: z
      .string()
      .describe(
        "The content to encode in the QR code (URL, text, email, phone number, etc.)",
      ),
    size: z
      .number()
      .optional()
      .describe(
        "Size of the QR code in pixels (default: 300, range: 100-1000)",
      ),
    errorCorrection: z
      .enum(["L", "M", "Q", "H"])
      .optional()
      .describe(
        "Error correction level: L (7%), M (15%), Q (25%), H (30%) - default: M",
      ),
    filename: z
      .string()
      .optional()
      .describe("Optional filename (without .png extension)"),
  }),
  execute: async (
    { content, size = 300, errorCorrection = "M", filename },
    { abortSignal: _abortSignal },
  ) => {
    logger.info(
      `QR Code Generator: Creating QR code for content length: ${content.length}`,
    );

    try {
      // Import qrcode library dynamically
      const QRCode = (await import("qrcode")).default;

      // Validate size
      const validSize = Math.max(100, Math.min(1000, size));
      if (validSize !== size) {
        logger.warn(
          `QR Code Generator: Size adjusted from ${size} to ${validSize}`,
        );
      }

      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(content, {
        errorCorrectionLevel: errorCorrection,
        type: "png",
        width: validSize,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      logger.info(
        `QR Code Generator: QR code created, size: ${qrBuffer.length} bytes`,
      );

      // Upload to storage
      const qrFilename =
        filename && !filename.endsWith(".png")
          ? `${filename}.png`
          : filename || `qrcode-${Date.now()}.png`;

      const uploadResult = await serverFileStorage.upload(qrBuffer, {
        filename: qrFilename,
        contentType: "image/png",
      });

      logger.info(
        `QR Code Generator: QR code uploaded to ${uploadResult.sourceUrl}`,
      );

      return {
        success: true,
        downloadUrl: uploadResult.sourceUrl,
        filename: qrFilename,
        size: qrBuffer.length,
        contentEncoded: content,
        qrSize: validSize,
        errorCorrectionLevel: errorCorrection,
        guide: `QR code has been generated successfully! You can download it or scan it with any QR code reader. The QR code encodes: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
      };
    } catch (error) {
      logger.error("QR Code Generator Error:", error);
      throw error;
    }
  },
});

/**
 * QR Code with Logo Tool
 * Generates QR codes with a logo/image in the center
 */
export const qrCodeWithLogoTool = createTool({
  name: "generate-qr-code-with-logo",
  description:
    "Generate a QR code with a logo or image in the center. The logo should be a URL to an image. Returns a downloadable PNG image.",
  inputSchema: z.object({
    content: z
      .string()
      .describe("The content to encode in the QR code (URL, text, etc.)"),
    logoUrl: z
      .string()
      .url()
      .describe("URL to the logo/image to place in the center of the QR code"),
    size: z
      .number()
      .optional()
      .describe(
        "Size of the QR code in pixels (default: 400, range: 200-1000)",
      ),
    logoSize: z
      .number()
      .optional()
      .describe(
        "Logo size as percentage of QR code (default: 30, range: 10-40)",
      ),
    filename: z
      .string()
      .optional()
      .describe("Optional filename (without .png extension)"),
  }),
  execute: async (
    { content, logoUrl, size = 400, logoSize = 30, filename },
    { abortSignal: _abortSignal },
  ) => {
    logger.info(
      `QR Code with Logo Generator: Creating QR code with logo from ${logoUrl}`,
    );

    try {
      // Import required libraries
      const QRCode = (await import("qrcode")).default;
      const sharp = (await import("sharp")).default;

      // Validate sizes
      const validSize = Math.max(200, Math.min(1000, size));
      const validLogoSize = Math.max(10, Math.min(40, logoSize));

      // Generate base QR code
      const qrBuffer = await QRCode.toBuffer(content, {
        errorCorrectionLevel: "H", // High error correction for logo overlay
        type: "png",
        width: validSize,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Fetch logo image
      logger.info(`QR Code with Logo Generator: Fetching logo from ${logoUrl}`);
      const logoResponse = await fetch(logoUrl);
      if (!logoResponse.ok) {
        throw new Error(`Failed to fetch logo: ${logoResponse.status}`);
      }
      const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

      // Calculate logo dimensions
      const logoDimension = Math.round((validSize * validLogoSize) / 100);
      const logoX = Math.round((validSize - logoDimension) / 2);
      const logoY = Math.round((validSize - logoDimension) / 2);

      // Resize and overlay logo on QR code
      const finalBuffer = await sharp(qrBuffer)
        .composite([
          {
            input: await sharp(logoBuffer)
              .resize(logoDimension, logoDimension, {
                fit: "cover",
              })
              .toBuffer(),
            top: logoY,
            left: logoX,
          },
        ])
        .png()
        .toBuffer();

      logger.info(
        `QR Code with Logo Generator: QR code with logo created, size: ${finalBuffer.length} bytes`,
      );

      // Upload to storage
      const qrFilename =
        filename && !filename.endsWith(".png")
          ? `${filename}.png`
          : filename || `qrcode-logo-${Date.now()}.png`;

      const uploadResult = await serverFileStorage.upload(finalBuffer, {
        filename: qrFilename,
        contentType: "image/png",
      });

      logger.info(
        `QR Code with Logo Generator: QR code uploaded to ${uploadResult.sourceUrl}`,
      );

      return {
        success: true,
        downloadUrl: uploadResult.sourceUrl,
        filename: qrFilename,
        size: finalBuffer.length,
        contentEncoded: content,
        qrSize: validSize,
        logoSize: validLogoSize,
        guide: `QR code with logo has been generated successfully! The logo is overlaid in the center. You can download it or scan it with any QR code reader.`,
      };
    } catch (error) {
      logger.error("QR Code with Logo Generator Error:", error);
      throw error;
    }
  },
});
