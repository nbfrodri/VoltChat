import QRCode from "qrcode";

/**
 * Generate a QR code as an SVG data URL using the qrcode library.
 * Supports URLs of any reasonable length.
 */
export async function generateQRCodeSVG(text: string, size: number = 200): Promise<string> {
  const svg = await QRCode.toString(text, {
    type: "svg",
    width: size,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
