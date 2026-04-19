import { jsPDF } from "jspdf";
import { getCompanyProfile } from "./actions";

export async function generateQuotationPDF(data: any) {
  const doc = new jsPDF();
  const profile = await getCompanyProfile();
  const orangeRDT = [255, 102, 0]; // RDT Orange
  const darkBlue = [20, 30, 50];
  const lightGrey = [245, 245, 245];

  // --- HELPER: Header ---
  const drawHeader = () => {
    // Header background (now white/removed)
    // doc.setFillColor(orangeRDT[0], orangeRDT[1], orangeRDT[2]);
    // doc.rect(0, 0, 210, 35, "F");

    if (profile?.logo) {
      try {
        const format = profile.logo.split(';')[0].split('/')[1].toUpperCase() || "PNG";
        doc.addImage(profile.logo, format, 15, 7, 35, 20); 
      } catch (e) {
        console.error("PDF Logo Error:", e);
      }
    }

    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("COTATION LOGISTIQUE", 200, 18, { align: "right" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(profile?.corporateName || "Groupe RDT", 200, 26, { align: "right" });
    doc.text(`${profile?.email || ""} | ${profile?.phone || ""}`, 200, 31, { align: "right" });
  };

  // --- HELPER: Footer ---
  const drawFooter = (pageNum: number) => {
    doc.setDrawColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 282, 195, 282);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text("Cette offre est soumise à nos conditions générales de transport & logistique.", 15, 288);
    doc.text(`Page ${pageNum}`, 195, 288, { align: "right" });
  };

  drawHeader();

  // --- CONTENT START ---
  let y = 50;

  // Title & Reference
  doc.setTextColor(orangeRDT[0], orangeRDT[1], orangeRDT[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`OFFRE DE PRIX : ${data.reference || "PROVISOIRE"}`, 15, y);
  
  doc.setDrawColor(orangeRDT[0], orangeRDT[1], orangeRDT[2]);
  doc.setLineWidth(0.8);
  doc.line(15, y + 2, 80, y + 2);

  y += 15;

  // Client Box
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.rect(15, y, 90, 25, "F");
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATAIRE :", 20, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(data.client || "CLIENT NON SPÉCIFIÉ", 20, y + 15);

  // Date Box
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.rect(110, y, 85, 25, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DATE D'ÉMISSION :", 115, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("fr-FR"), 115, y + 15);
  doc.text(`Validité : 15 jours`, 115, y + 21);

  y += 35;

  // --- ROUTE & SERVICE DETAILS ---
  doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.rect(15, y, 180, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAILS DU SERVICE & ITINÉRAIRE", 20, y + 5.5);

  y += 12;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  
  const drawLogLine = (label: string, value: string, label2: string, value2: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(value || "-", 60, y);

    doc.setFont("helvetica", "bold");
    doc.text(label2, 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(value2 || "-", 150, y);
    y += 7;
  };

  drawLogLine("Origine :", data.origin, "Destination :", data.destination);
  drawLogLine("Mode :", (data.mode || "Maritime").toUpperCase(), "Flux :", (data.direction || "Import").toUpperCase());
  drawLogLine("Compagnie :", data.carrier, "Transit Time :", data.transitTime);
  drawLogLine("Fréquence :", data.frequency, "Via :", data.via);
  drawLogLine("Incoterm :", data.incoterm, "Équipement :", data.containers ? data.containers.map((c: any) => `${c.quantity}x${c.type}`).join(" + ") : "-");

  y += 8;

  // --- GOODS DETAILS ---
  doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.rect(15, y, 180, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("CARACTÉRISTIQUES DE LA MARCHANDISE", 20, y + 5.5);

  y += 12;
  doc.setTextColor(0, 0, 0);
  drawLogLine("Nature :", data.commodity, "Unités (Colis) :", data.nbColis?.toString());
  drawLogLine("Poids Brut :", `${data.grossWeight || 0} KG`, "Volume :", `${data.volume || 0} CBM`);
  drawLogLine("Hered. / Temp :", data.temperature, "Dangereux (IMO) :", data.isDangerous ? "OUI" : "NON");
  drawLogLine("Valeur march. :", `${data.commodityValue || 0} EUR`, "", "");

  y += 10;

  // --- COST TABLE ---
  doc.setFillColor(orangeRDT[0], orangeRDT[1], orangeRDT[2]);
  doc.rect(15, y, 180, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION DES FRAIS", 20, y + 6.5);
  doc.text("UNITÉ", 140, y + 6.5);
  doc.text("MONTANT", 175, y + 6.5, { align: "right" });

  y += 10;
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFontSize(9);

  data.items.forEach((item: any, idx: number) => {
    if (y > 260) {
      drawFooter(1);
      doc.addPage();
      drawHeader();
      y = 50;
    }

    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(15, y, 180, 10, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.text(item.description || "Frais logistique", 20, y + 6.5);
    doc.text(item.type?.toUpperCase() || "UNIT", 140, y + 6.5);
    doc.setFont("helvetica", "bold");
    doc.text(`${(item.amount || 0).toLocaleString()} ${item.currency || '€'}`, 190, y + 6.5, { align: "right" });

    y += 10;
    doc.setDrawColor(240, 240, 240);
    doc.line(15, y, 195, y);
  });

  // --- TOTAL BOX ---
  y += 10;
  if (y > 250) {
    doc.addPage();
    drawHeader();
    y = 50;
  }

  doc.setFillColor(orangeRDT[0], orangeRDT[1], orangeRDT[2]);
  doc.rect(110, y, 85, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL NET À PAYER", 115, y + 9.5);
  doc.setFontSize(14);
  doc.text(`${(data.totalFinal || 0).toLocaleString()} EUR`, 190, y + 9.5, { align: "right" });

  drawFooter(1);

  // --- SAVE ---
  const fileName = `OFFRE_RDT_${data.client?.replace(/\s+/g, "_") || "SANS_NOM"}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}

