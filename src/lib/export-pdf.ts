import { jsPDF } from "jspdf";
import { getCompanyProfile } from "./actions";

export async function generateQuotationPDF(data: any) {
  const doc = new jsPDF();
  const profile = await getCompanyProfile();
  
  // Header
  doc.setFillColor(16, 185, 129); // Emerald Green
  doc.rect(0, 0, 210, 45, "F");
  
  if (profile?.logo) {
    try {
      // Small cleanup: sometimes base64 includes data:image/png;base64,
      const format = profile.logo.split(';')[0].split('/')[1].toUpperCase() || "PNG";
      doc.addImage(profile.logo, format, 20, 5, 25, 0); 
    } catch (e) {
      console.error("PDF Logo Error:", e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("COTATION COMMERCIALE", profile?.logo ? 50 : 20, 25);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (profile) {
    doc.text(profile.corporateName, 190, 15, { align: "right" });
    doc.text(profile.address || "", 190, 20, { align: "right" });
    doc.text(`${profile.phone || ""} | ${profile.email || ""}`, 190, 25, { align: "right" });
  }

  const dateFiltered = new Date().toLocaleDateString("fr-FR");
  doc.text(`Date d'émission: ${dateFiltered}`, 190, 35, { align: "right" });
  
  // Client Info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATAIRE :", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.text(data.client || "Client non spécifié", 20, 67);
  
  // Logistics Info
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAILS LOGISTIQUES", 120, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Flux: ${data.direction.toUpperCase()} (${data.mode === "sea" ? "MARITIME" : "AÉRIEN"})`, 120, 67);
  doc.text(`Origine: ${data.origin || "-"}`, 120, 72);
  doc.text(`Destination: ${data.destination || "-"}`, 120, 77);
  doc.text(`Marchandise: ${data.commodity || "-"}`, 120, 82);
  doc.text(`Équipement: ${data.containers ? data.containers.map((c: any) => `${c.quantity}x${c.type}`).join(" + ") : "-"}`, 120, 87);
  
  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 95, 170, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Description", 25, 102);
  doc.text("Type", 120, 102);
  doc.text("Montant (EUR)", 160, 102);
  
  // Table Content
  doc.setFont("helvetica", "normal");
  let y = 112;
  data.items.forEach((item: any) => {
    let typeLabel = (item.type || "").toUpperCase();
    if (item.type === "fret") typeLabel = "FRET MARITIME";
    if (item.type === "fret_air") typeLabel = "FRET AÉRIEN";
    if (item.type === "thc") typeLabel = "MANUTENTION";
    
    doc.text(item.description || "-", 25, y);
    doc.text(typeLabel, 120, y);
    doc.text((item.amount || 0).toLocaleString() + " €", 165, y, { align: "right" });
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
  doc.text((data.totalFinal || 0).toLocaleString() + " €", 165, y, { align: "right" });
  
  // Legal notice
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Cette offre est valable 15 jours calendaires à compter de la date d'émission.", 20, 280);
  
  // Save/Download
  doc.save(`Cotation_${data.client.replace(/\s+/g, "_")}.pdf`);
}
