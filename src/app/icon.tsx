import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Generate the icon
export default function Icon() {
  try {
    // Read the existing logo file
    const imagePath = join(process.cwd(), "public", "wasp-ai-logo.png");
    const imageBuffer = readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString("base64");
    const imageSrc = `data:image/png;base64,${imageBase64}`;

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          overflow: "hidden", // Ensure zoomed image doesn't overflow (though it's clipped by viewport usually)
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Wasp AI"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            // Scale up to remove padding. 1.5 is a good starting point based on "looking small"
            transform: "scale(1.5)",
          }}
        />
      </div>,
      {
        ...size,
      },
    );
  } catch (_e) {
    // Fallback if something goes wrong reading the file
    return new ImageResponse(
      <div
        style={{
          fontSize: 20,
          background: "black",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "50%",
          fontWeight: "bold",
        }}
      >
        W
      </div>,
      {
        ...size,
      },
    );
  }
}
