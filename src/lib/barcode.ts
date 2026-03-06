import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";

export function generateBarcodeValue(itemName: string, category: string): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}-${random}`;
}

export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  options?: { width?: number; height?: number; displayValue?: boolean }
) {
  JsBarcode(canvas, value, {
    format: "CODE128",
    width: options?.width ?? 2,
    height: options?.height ?? 60,
    displayValue: options?.displayValue ?? true,
    font: "Outfit",
    fontSize: 14,
    margin: 10,
    background: "#ffffff",
    lineColor: "#000000",
  });
}

export function downloadBarcodeAsPNG(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function downloadCanvasesAsSinglePagePDF(
  items: { canvas: HTMLCanvasElement; label?: string }[],
  filename = "barcodes.pdf"
) {
  if (!items || items.length === 0) return;
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const gutter = 8;
  let x = gutter;
  let y = gutter;

  items.forEach(({ canvas, label }) => {
    const imgWidth = canvas.width * 0.75;
    const imgHeight = canvas.height * 0.75;

    if (x + imgWidth + gutter > pageWidth) {
      x = gutter;
      y += imgHeight + 3 * gutter;
    }

    if (y + imgHeight + gutter > pageHeight) {
      doc.addPage();
      y = gutter;
      x = gutter;
    }

    const dataUrl = canvas.toDataURL("image/png");
    doc.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);
    if (label) {
      doc.setFontSize(10);
      const textX = x;
      const textY = y + imgHeight + 12;
      doc.text(label, textX, textY, { maxWidth: imgWidth });
    }

    x += imgWidth + gutter;
  });

  doc.save(filename);
}
