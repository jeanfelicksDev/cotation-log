"use server";

import { prisma } from "./db";
import { revalidatePath } from "next/cache";

/* 
  NOTE: This file contains server actions for parameter management.
  In a real Next.js app, these would be in a file with "use server".
  Since I'm implementing logic, I'll provide them as functions.
*/

export async function getParameters(category?: string) {
  try {
    const params = await prisma.parameter.findMany({
      where: category ? { category } : {},
      orderBy: { label: "asc" }
    });
    return params;
  } catch (error) {
    console.error("Error fetching parameters:", error);
    return [];
  }
}

export async function createParameter(category: string, label: string) {
  try {
    // Value is usually lowercase slug of label
    const value = label.toLowerCase().replace(/ /g, "_").replace(/[^\w]/g, "");
    
    const newParam = await prisma.parameter.create({
      data: { category, label, value }
    });
    return newParam;
  } catch (error) {
    console.error("Error creating parameter:", error);
    throw error;
  }
}

export async function deleteParameter(id: string) {
  try {
    await prisma.parameter.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error("Error deleting parameter:", error);
    throw error;
  }
}

export async function seedParameters() {
  const counts = await prisma.parameter.count();
  if (counts > 0) return; // Already seeded

  const defaults = [
    // Destinations
    { category: "destination", label: "Lomé (TGLFW)", value: "lome" },
    { category: "destination", label: "Cotonou (BJCOO)", value: "cotonou" },
    { category: "destination", label: "Dakar (SNDKR)", value: "dakar" },
    { category: "destination", label: "Abidjan (CIABJ)", value: "abidjan" },
    
    // Containers
    { category: "container", label: "20' Dry Standard", value: "20gp" },
    { category: "container", label: "40' Dry Standard", value: "40gp" },
    { category: "container", label: "40' High Cube", value: "40hc" },
    { category: "container", label: "20' Reefer", value: "20rf" },
    
    // Cost Types
    { category: "cost_type", label: "Fret Maritime", value: "fret" },
    { category: "cost_type", label: "Fret Aérien", value: "fret_air" },
    { category: "cost_type", label: "THC / Manutention", value: "thc" },
    { category: "cost_type", label: "Documentation", value: "doc" },
    { category: "cost_type", label: "Passage Portuaire", value: "passage" },
    
    // Currencies
    { category: "currency", label: "EUR (€)", value: "eur" },
    { category: "currency", label: "XOF (CFA)", value: "xof" },
    { category: "currency", label: "USD ($)", value: "usd" },
    
    // Modes
    { category: "mode", label: "Maritime", value: "sea" },
    { category: "mode", label: "Aérien", value: "air" },
  ];

  await prisma.parameter.createMany({ data: defaults });
}

// --- TARIFF ACTIONS ---

export async function getTariffs() {
  try {
    return await prisma.tariff.findMany({
      orderBy: { zone: "asc" }
    });
  } catch (error) {
    console.error("Error fetching tariffs:", error);
    return [];
  }
}

export async function createTariff(data: { zone: string; description: string; amount: number; type: string; currency?: string }) {
  try {
    const tariff = await prisma.tariff.create({
      data: {
        zone: data.zone,
        description: data.description,
        amount: data.amount,
        type: data.type,
        currency: data.currency || "EUR"
      }
    });
    revalidatePath("/tariffs");
    return tariff;
  } catch (error) {
    console.error("Error creating tariff:", error);
    throw error;
  }
}

export async function deleteTariff(id: string) {
  try {
    await prisma.tariff.delete({ where: { id } });
    revalidatePath("/tariffs");
    return true;
  } catch (error) {
    console.error("Error deleting tariff:", error);
    throw error;
  }
}

export async function updateTariff(id: string, data: { zone: string; description: string; amount: number; type: string; currency: string }) {
  try {
    const tariff = await prisma.tariff.update({
      where: { id },
      data: {
        zone: data.zone,
        description: data.description,
        amount: data.amount,
        type: data.type,
        currency: data.currency,
      }
    });
    revalidatePath("/tariffs");
    return tariff;
  } catch (error) {
    console.error("Error updating tariff:", error);
    throw error;
  }
}

export async function seedTariffs() {
  const count = await prisma.tariff.count();
  if (count > 0) return;

  const defaults = [
    { zone: "Shanghai -> Lomé", description: "Fret Maritime 20' Dry", amount: 1850, type: "Fret", currency: "USD" },
    { zone: "Anvers -> Dakar", description: "Fret Maritime 40' HC", amount: 2450, type: "Fret", currency: "EUR" },
    { zone: "Lomé (Port)", description: "Passage Portuaire / THC", amount: 150000, type: "Local", currency: "XOF" },
    { zone: "Paris (CDG) -> Abidjan", description: "Fret Aérien (Taux au kg)", amount: 3.5, type: "Fret", currency: "EUR" },
  ];

  await prisma.tariff.createMany({ data: defaults });
}

// --- QUOTATION ACTIONS ---

export async function saveQuotation(data: any) {
  try {
    const { 
      clientName, direction, status, origin, destination, commodity,
      totalBase, totalFinal, margin, items, containers 
    } = data;

    // Generate reference like QT-2024-001
    const count = await prisma.quotation.count();
    const reference = `QT-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    const quotation = await prisma.quotation.create({
      data: {
        reference,
        clientName,
        direction,
        status: status || "Draft",
        origin,
        destination,
        commodity,
        totalBase,
        totalFinal,
        margin,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            amount: item.amount,
            type: item.type,
            currency: item.currency,
            isForwarding: item.isForwarding || false,
            buyAmount: item.buyAmount,
            marginRate: item.marginRate
          }))
        },
        containers: {
          create: containers.map((c: any) => ({
            type: c.type,
            quantity: c.quantity
          }))
        }
      }
    });

    revalidatePath("/tracking");
    revalidatePath("/");
    return quotation;
  } catch (error) {
    console.error("Error saving quotation:", error);
    throw error;
  }
}

export async function getQuotations() {
  try {
    return await prisma.quotation.findMany({
      include: {
        items: true,
        containers: true
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return [];
  }
}

export async function getQuotationById(id: string) {
  try {
    return await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
        containers: true
      }
    });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return null;
  }
}

export async function updateQuotation(id: string, data: any) {
  try {
    const { 
      clientName, direction, status, origin, destination, commodity,
      totalBase, totalFinal, margin, items, containers 
    } = data;

    // Delete existing related items and containers, then recreate
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    await prisma.containerType.deleteMany({ where: { quotationId: id } });

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        clientName,
        direction,
        status: status || "Draft",
        origin,
        destination,
        commodity,
        totalBase,
        totalFinal,
        margin,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            amount: item.amount,
            type: item.type,
            currency: item.currency,
            isForwarding: item.isForwarding || false,
            buyAmount: item.buyAmount,
            marginRate: item.marginRate
          }))
        },
        containers: {
          create: containers.map((c: any) => ({
            type: c.type,
            quantity: c.quantity
          }))
        }
      }
    });

    revalidatePath("/tracking");
    revalidatePath("/");
    return quotation;
  } catch (error) {
    console.error("Error updating quotation:", error);
    throw error;
  }
}

export async function updateQuotationStatus(id: string, status: string) {
  try {
    await prisma.quotation.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/tracking");
    return true;
  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
}

export async function deleteQuotation(id: string) {
  try {
    await prisma.quotation.delete({ where: { id } });
    revalidatePath("/tracking");
    return true;
  } catch (error) {
    console.error("Error deleting quotation:", error);
    throw error;
  }
}
