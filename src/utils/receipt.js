import { jsPDF } from "jspdf";

const BRAND = {
  navy: [10, 45, 111], // #0A2D6F
  blue: [15, 77, 184], // #0F4DB8
  gold: [244, 180, 0], // #F4B400
  green: [46, 158, 68], // #2E9E44
  gray: [90, 98, 110],
};

function formatNaira(amount) {
  return `NGN ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value) {
  const d = new Date(value);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

// Given an order and one specific successful payment on it, works out how
// much had been paid in total up to (and including) that payment — the
// receipt reflects the order's state AT THAT MOMENT, not today's totals.
function paymentRunningTotals(order, payment) {
  const successfulUpToThis = order.payment.payments
    .filter((p) => p.status === "successful" && new Date(p.recorded_at) <= new Date(payment.recorded_at))
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const total = Number(order.total_amount);
  const percentPaid = total > 0 ? (successfulUpToThis / total) * 100 : 0;
  const remaining = Math.max(0, total - successfulUpToThis);
  const percentRemaining = 100 - percentPaid;
  return { totalPaidSoFar: successfulUpToThis, percentPaid, remaining, percentRemaining };
}

function drawHeader(doc, title) {
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Bonchris Industry Nig. Ltd", 14, 13);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Lumine Yoghurt — Kaduna, Nigeria", 14, 20);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 196, 16, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

function drawKeyValueRows(doc, rows, startY, x = 14) {
  let y = startY;
  doc.setFontSize(10);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.gray);
    doc.text(label, x, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(String(value), x + 55, y);
    y += 6;
  }
  return y;
}

function drawItemsTable(doc, items, startY) {
  let y = startY;
  doc.setFillColor(...BRAND.navy);
  doc.rect(14, y - 5, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Product", 16, y);
  doc.text("Size", 100, y);
  doc.text("Qty", 125, y);
  doc.text("Unit Price", 145, y);
  doc.text("Line Total", 178, y, { align: "right" });
  y += 7;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  for (const item of items) {
    doc.text(String(item.product_name), 16, y);
    doc.text(String(item.variant_size || "-"), 100, y);
    doc.text(String(item.quantity), 125, y);
    doc.text(formatNaira(item.unit_price), 145, y);
    doc.text(formatNaira(item.line_total), 178, y, { align: "right" });
    y += 6;
  }
  return y;
}

function drawFooter(doc, generatedFor) {
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.gray);
  doc.text(
    `Generated for: ${generatedFor} · Generated on ${formatDateTime(new Date())}`,
    14,
    287
  );
  doc.text("This is a system-generated receipt from Lumine DMS.", 14, 291);
}

// Downloads a receipt for ONE specific successful payment on an order —
// shows that payment's date/time and the order's paid/remaining
// percentage AS OF that payment.
export function downloadPaymentReceipt(order, payment, { generatedFor = "Customer copy" } = {}) {
  if (payment.status !== "successful") return; // never receipt an unconfirmed/failed attempt
  const doc = new jsPDF();
  drawHeader(doc, "Payment Receipt");

  const totals = paymentRunningTotals(order, payment);

  let y = 40;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Order ${order.order_number}`, 14, y);
  y += 8;

  y = drawKeyValueRows(
    doc,
    [
      ["Buyer", order.customer_name || "-"],
      ["Contact", [order.customer_email, order.customer_phone].filter(Boolean).join(" · ") || "-"],
      ["Payment date/time", formatDateTime(payment.recorded_at)],
      ["Amount paid (this payment)", formatNaira(payment.amount)],
      ["Order total", formatNaira(order.total_amount)],
      ["Total paid to date", formatNaira(totals.totalPaidSoFar)],
      ["Percentage paid", `${totals.percentPaid.toFixed(1)}%`],
      ["Percentage remaining", `${totals.percentRemaining.toFixed(1)}%`],
      ["Balance remaining", formatNaira(totals.remaining)],
      ["Payment reference", payment.paystack_reference || "Manual entry"],
    ],
    y
  );

  y += 4;
  y = drawItemsTable(doc, order.items, y + 4);

  drawFooter(doc, generatedFor);
  doc.save(`Receipt-${order.order_number}-${new Date(payment.recorded_at).toISOString().slice(0, 10)}.pdf`);
}

// Downloads a full order summary — every item, every payment, and the
// order's current standing. Used for the overall "Order Receipt" (as
// opposed to a single payment's receipt).
export function downloadOrderReceipt(order, { generatedFor = "Customer copy" } = {}) {
  const doc = new jsPDF();
  drawHeader(doc, "Order Invoice");

  const percentPaid = order.payment.percent;
  const remaining = Math.max(0, Number(order.total_amount) - order.payment.totalPaid);

  let y = 40;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Order ${order.order_number}`, 14, y);
  y += 8;

  y = drawKeyValueRows(
    doc,
    [
      ["Buyer", order.customer_name || "-"],
      ["Contact", [order.customer_email, order.customer_phone].filter(Boolean).join(" · ") || "-"],
      ["Order date", formatDateTime(order.created_at)],
      ["Order total", formatNaira(order.total_amount)],
      ["Total paid to date", formatNaira(order.payment.totalPaid)],
      ["Percentage paid", `${percentPaid.toFixed(1)}%`],
      ["Percentage remaining", `${(100 - percentPaid).toFixed(1)}%`],
      ["Balance remaining", formatNaira(remaining)],
    ],
    y
  );

  y = drawItemsTable(doc, order.items, y + 6);

  const successfulPayments = order.payment.payments.filter((p) => p.status === "successful");
  if (successfulPayments.length > 0) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Payment history", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const p of successfulPayments) {
      doc.text(`${formatDateTime(p.recorded_at)} — ${formatNaira(p.amount)}`, 16, y);
      y += 5;
    }
  }

  drawFooter(doc, generatedFor);
  doc.save(`Invoice-${order.order_number}.pdf`);
}
