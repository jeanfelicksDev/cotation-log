import { jsPDF } from "jspdf";

export async function generateQuotationPDF(data: any) {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(16, 185, 129); // Emerald Green
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("COTATION COMMERCIALE", 20, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const date = new Date().toLocaleDateString("fr-FR");
  doc.text(`Date: ${date}`, 160, 25);
  
  // Client Info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATAIRE :", 20, 55);
  doc.setFont("helvetica", "normal");
  doc.text(data.client || "Client non spécifié", 20, 62);
  
  // Logistics Info
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAILS LOGISTIQUES", 120, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Flux: ${data.direction.toUpperCase()} (${data.mode === "sea" ? "MARITIME" : "AÉRIEN"})`, 120, 62);
  doc.text(`Origine: ${data.origin || "-"}`, 120, 67);
  doc.text(`Destination: ${data.destination || "-"}`, 120, 72);
  doc.text(`Marchandise: ${data.commodity || "-"}`, 120, 77);
  doc.text(`Équipement: ${data.containers ? data.containers.map((c: any) => `${c.quantity}x${c.type}`).join(" + ") : "-"}`, 120, 82);
  
  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 90, 170, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Description", 25, 97);
  doc.text("Type", 120, 97);
  doc.text("Montant (EUR)", 160, 97);
  
  // Table Content
  doc.setFont("helvetica", "normal");
  let y = 107;
  data.items.forEach((item: any) => {
    let typeLabel = item.type.toUpperCase();
    if (item.type === "fret") typeLabel = "FRET MARITIME";
    if (item.type === "fret_air") typeLabel = "FRET AÉRIEN";
    if (item.type === "thc") typeLabel = "MANUTENTION";
    
    doc.text(item.description || "-", 25, y);
    doc.text(typeLabel, 120, y);
    doc.text(item.amount.toLocaleString() + " €", 165, y, { align: "right" });
    y += 10;
    
    // Line separator
    doc.setDrawColor(230, 230, 230);
    doc.line(20, y - 2, 190, y - 2);
  });
  
  // Footer / Totals
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL OFFRE CLIENT :", 110, y);
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text(data.totalFinal.toLocaleString() + " €", 165, y, { align: "right" });
  
  // Legal notice
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Cette offre est valable 15 jours calendaires à compter de la date d'émission.", 20, 280);
  
  // Save/Download
  doc.save(`Cotation_${data.client.replace(/\s+/g, "_")}.pdf`);
}
