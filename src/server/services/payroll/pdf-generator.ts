import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PayslipDetailItem } from "@/features/payroll/types";

export async function generatePayslipPdf(slip: PayslipDetailItem): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const monoFont = await doc.embedFont(StandardFonts.Courier);

  // A4 Page: 595.28 x 841.89 points
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const margin = 40;
  let y = height - margin;
  const currency = (slip as any).currency || "INR";

  // Colors
  const darkNavy = rgb(0.06, 0.09, 0.16); // #0f172a
  const slate = rgb(0.39, 0.45, 0.55); // #64748b
  const primaryBlue = rgb(0.15, 0.39, 0.92); // #2563eb
  const emerald = rgb(0.09, 0.64, 0.29); // #16a34a
  const rose = rgb(0.86, 0.15, 0.15); // #dc2626
  const lightBg = rgb(0.97, 0.98, 0.99); // #f8fafc
  const borderColor = rgb(0.89, 0.91, 0.94); // #e2e8f0

  // 1. Company Header
  page.drawText("PeoplePay360", {
    x: margin,
    y: y - 20,
    size: 20,
    font: boldFont,
    color: darkNavy,
  });

  page.drawText("Enterprise Payroll & HR Management System", {
    x: margin,
    y: y - 34,
    size: 8.5,
    font: font,
    color: slate,
  });

  page.drawText(`Payrun: ${slip.payrunName || "Standard Cycle"}`, {
    x: margin,
    y: y - 46,
    size: 8.5,
    font: font,
    color: slate,
  });

  // Header Right - Payslip Meta
  const payslipNumText = slip.payslipNumber;
  const numWidth = boldFont.widthOfTextAtSize(payslipNumText, 14);
  page.drawText(payslipNumText, {
    x: width - margin - numWidth,
    y: y - 18,
    size: 14,
    font: boldFont,
    color: primaryBlue,
  });

  const periodText = `Period: ${slip.periodStart} to ${slip.periodEnd}`;
  const periodWidth = font.widthOfTextAtSize(periodText, 8.5);
  page.drawText(periodText, {
    x: width - margin - periodWidth,
    y: y - 32,
    size: 8.5,
    font: font,
    color: slate,
  });

  const statusText = `Status: ${(slip.status || "CONFIRMED").toUpperCase()}`;
  const statusWidth = font.widthOfTextAtSize(statusText, 8.5);
  page.drawText(statusText, {
    x: width - margin - statusWidth,
    y: y - 44,
    size: 8.5,
    font: boldFont,
    color: darkNavy,
  });

  y -= 62;

  // Header divider
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1.5,
    color: darkNavy,
  });

  y -= 16;

  // 2. Employee Details Card (Box)
  const cardHeight = 90;
  page.drawRectangle({
    x: margin,
    y: y - cardHeight,
    width: width - margin * 2,
    height: cardHeight,
    color: lightBg,
    borderColor: borderColor,
    borderWidth: 1,
  });

  const col1X = margin + 14;
  const col2X = margin + (width - margin * 2) / 2 + 10;
  let cardY = y - 18;

  // Row 1
  page.drawText("Employee Name:", { x: col1X, y: cardY, size: 8.5, font: font, color: slate });
  page.drawText(slip.employeeName, { x: col1X + 85, y: cardY, size: 8.5, font: boldFont, color: darkNavy });

  page.drawText("Salary Structure:", { x: col2X, y: cardY, size: 8.5, font: font, color: slate });
  page.drawText(slip.salaryStructureName || "Standard", { x: col2X + 85, y: cardY, size: 8.5, font: boldFont, color: darkNavy });

  cardY -= 18;

  // Row 2
  page.drawText("Employee ID:", { x: col1X, y: cardY, size: 8.5, font: font, color: slate });
  page.drawText(slip.employeeNumber, { x: col1X + 85, y: cardY, size: 8.5, font: font, color: darkNavy });

  page.drawText("Bank Account:", { x: col2X, y: cardY, size: 8.5, font: font, color: slate });
  const bankStr = slip.bankAccountNumber ? `${slip.bankName || "Bank"}: ${slip.bankAccountNumber}` : "Not on file";
  page.drawText(bankStr, { x: col2X + 85, y: cardY, size: 8.5, font: font, color: darkNavy });

  cardY -= 18;

  // Row 3
  page.drawText("Department:", { x: col1X, y: cardY, size: 8.5, font: font, color: slate });
  page.drawText(slip.departmentName || "General", { x: col1X + 85, y: cardY, size: 8.5, font: font, color: darkNavy });

  page.drawText("Worked Time:", { x: col2X, y: cardY, size: 8.5, font: font, color: slate });
  page.drawText(`${slip.workedDays} Days (${slip.workedHours} Hours)`, { x: col2X + 85, y: cardY, size: 8.5, font: font, color: darkNavy });

  cardY -= 18;

  // Row 4
  page.drawText("Designation:", { x: col1X, y: cardY, size: 8.5, font: font, color: slate });
  page.drawText(slip.jobTitle || "Staff", { x: col1X + 85, y: cardY, size: 8.5, font: font, color: darkNavy });

  page.drawText("Contract / Wage:", { x: col2X, y: cardY, size: 8.5, font: font, color: slate });
  page.drawText(`${slip.contractNumber} (${currency} ${slip.contractWage.toLocaleString()})`, { x: col2X + 85, y: cardY, size: 8.5, font: font, color: darkNavy });

  y -= (cardHeight + 20);

  // 3. Compensation Breakdown Table Header
  const tableWidth = width - margin * 2;
  page.drawRectangle({
    x: margin,
    y: y - 20,
    width: tableWidth,
    height: 20,
    color: rgb(0.94, 0.96, 0.98),
  });

  const colCodeX = margin + 10;
  const colDescX = margin + 85;
  const colCatX = margin + 280;
  const colRateX = margin + 370;
  const colAmtX = width - margin - 15;

  page.drawText("CODE", { x: colCodeX, y: y - 14, size: 8, font: boldFont, color: slate });
  page.drawText("DESCRIPTION", { x: colDescX, y: y - 14, size: 8, font: boldFont, color: slate });
  page.drawText("CATEGORY", { x: colCatX, y: y - 14, size: 8, font: boldFont, color: slate });
  page.drawText("RATE / QTY", { x: colRateX, y: y - 14, size: 8, font: boldFont, color: slate });
  const amtHeader = `AMOUNT (${currency})`;
  const amtHeaderW = boldFont.widthOfTextAtSize(amtHeader, 8);
  page.drawText(amtHeader, { x: colAmtX - amtHeaderW, y: y - 14, size: 8, font: boldFont, color: slate });

  y -= 22;

  // Table Body Rows
  for (const line of slip.lines) {
    if (y < 160) break; // Keep space for totals and signatures

    const isDeduction = ["deduction", "contribution"].includes(line.category);
    const amountVal = Number(line.total);
    const formattedAmount = `${isDeduction ? "-" : ""}${amountVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    page.drawText(line.ruleCode, {
      x: colCodeX,
      y: y - 12,
      size: 8,
      font: monoFont,
      color: darkNavy,
    });

    // Truncate description if too long
    const cleanRuleName = line.ruleName.length > 34 ? line.ruleName.substring(0, 32) + "..." : line.ruleName;
    page.drawText(cleanRuleName, {
      x: colDescX,
      y: y - 12,
      size: 8.5,
      font: font,
      color: darkNavy,
    });

    page.drawText(line.category.toUpperCase(), {
      x: colCatX,
      y: y - 12,
      size: 7.5,
      font: font,
      color: slate,
    });

    const rateStr = line.rate !== null && line.rate !== undefined ? `${line.rate}%` : line.quantity !== null && line.quantity !== undefined ? `${line.quantity}` : "—";
    page.drawText(rateStr, {
      x: colRateX,
      y: y - 12,
      size: 8,
      font: font,
      color: slate,
    });

    const valWidth = boldFont.widthOfTextAtSize(formattedAmount, 8.5);
    page.drawText(formattedAmount, {
      x: colAmtX - valWidth,
      y: y - 12,
      size: 8.5,
      font: boldFont,
      color: isDeduction ? rose : darkNavy,
    });

    // Sub-row line
    page.drawLine({
      start: { x: margin, y: y - 18 },
      end: { x: width - margin, y: y - 18 },
      thickness: 0.5,
      color: borderColor,
    });

    y -= 20;
  }

  y -= 10;

  // 4. Totals Card
  const totalsHeight = 54;
  page.drawRectangle({
    x: margin,
    y: y - totalsHeight,
    width: tableWidth,
    height: totalsHeight,
    color: lightBg,
    borderColor: borderColor,
    borderWidth: 1,
  });

  const grossStr = `${currency} ${slip.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dedStr = `-${currency} ${slip.deductionAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const netStr = `${currency} ${slip.netAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  page.drawText("Gross Earnings:", { x: margin + 14, y: y - 20, size: 8.5, font: font, color: slate });
  page.drawText(grossStr, { x: margin + 85, y: y - 20, size: 8.5, font: boldFont, color: darkNavy });

  page.drawText("Total Deductions:", { x: margin + 14, y: y - 36, size: 8.5, font: font, color: slate });
  page.drawText(dedStr, { x: margin + 92, y: y - 36, size: 8.5, font: boldFont, color: rose });

  // Right side net pay
  const netLabel = "NET TAKE-HOME PAY";
  const netLabelW = boldFont.widthOfTextAtSize(netLabel, 8.5);
  page.drawText(netLabel, { x: width - margin - 15 - netLabelW, y: y - 20, size: 8.5, font: boldFont, color: slate });

  const netW = boldFont.widthOfTextAtSize(netStr, 15);
  page.drawText(netStr, { x: width - margin - 15 - netW, y: y - 40, size: 15, font: boldFont, color: emerald });

  y -= (totalsHeight + 40);

  // 5. Signature Section
  const sigLineY = y;
  const sigWidth = 180;
  const leftSigX = margin + 10;
  const rightSigX = width - margin - sigWidth - 10;

  page.drawLine({
    start: { x: leftSigX, y: sigLineY },
    end: { x: leftSigX + sigWidth, y: sigLineY },
    thickness: 1,
    color: slate,
  });

  page.drawText("Authorized Employer Signature", {
    x: leftSigX + 22,
    y: sigLineY - 12,
    size: 7.5,
    font: font,
    color: slate,
  });

  page.drawLine({
    start: { x: rightSigX, y: sigLineY },
    end: { x: rightSigX + sigWidth, y: sigLineY },
    thickness: 1,
    color: slate,
  });

  page.drawText("Employee Signature & Date", {
    x: rightSigX + 35,
    y: sigLineY - 12,
    size: 7.5,
    font: font,
    color: slate,
  });

  // 6. Security Footer
  const footerNotice = "This is a computer-generated confidential legal document powered by PeoplePay360 HRIS & Payroll Engine.";
  const footerW = font.widthOfTextAtSize(footerNotice, 7);
  page.drawText(footerNotice, {
    x: (width - footerW) / 2,
    y: 22,
    size: 7,
    font: font,
    color: rgb(0.65, 0.7, 0.78),
  });

  return await doc.save();
}
