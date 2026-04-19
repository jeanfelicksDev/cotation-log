"use server";

import { prisma } from "./prisma";
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
      include: { reasons: true },
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

export async function updateParameter(id: string, label: string) {
  try {
    const value = label.toLowerCase().replace(/ /g, "_").replace(/[^\w]/g, "");
    const updatedParam = await prisma.parameter.update({
      where: { id },
      data: { label, value }
    });
    return updatedParam;
  } catch (error) {
    console.error("Error updating parameter:", error);
    throw error;
  }
}

export async function createReason(parameterId: string, label: string) {
  try {
    const reason = await prisma.parameterReason.create({
      data: { parameterId, label }
    });
    return reason;
  } catch (error) {
    console.error("Error creating reason:", error);
    throw error;
  }
}

export async function deleteReason(id: string) {
  try {
    await prisma.parameterReason.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error("Error deleting reason:", error);
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

    // Quotation Statuses
    { category: "status", label: "Brouillon", value: "draft" },
    { category: "status", label: "Envoyé", value: "sent" },
    { category: "status", label: "Accepté", value: "accepted" },
    { category: "status", label: "Refusé", value: "rejected" },
    { category: "status", label: "Expiré", value: "expired" },
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
      mode, frequency, transitTime, via, carrier,
      nbColis, grossWeight, volume, commodityValue, temperature, isDangerous,
      incoterm,
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
        reason: data.reason,
        comments: data.comments,
        clientResponseDate: data.clientResponseDate ? new Date(data.clientResponseDate) : null,
        origin,
        destination,
        commodity,
        mode,
        frequency,
        transitTime,
        via,
        carrier,
        nbColis,
        grossWeight,
        volume,
        commodityValue,
        temperature,
        isDangerous,
        incoterm,
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
      mode, frequency, transitTime, via, carrier,
      nbColis, grossWeight, volume, commodityValue, temperature, isDangerous,
      incoterm,
      totalBase, totalFinal, margin, items, containers 
    } = data;

    // Delete existing related items and containers, then recreate
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    await prisma.quotationContainer.deleteMany({ where: { quotationId: id } });

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        clientName,
        direction,
        status: status || "Draft",
        reason: data.reason,
        comments: data.comments,
        clientResponseDate: data.clientResponseDate ? new Date(data.clientResponseDate) : null,
        origin,
        destination,
        commodity,
        mode,
        frequency,
        transitTime,
        via,
        carrier,
        nbColis,
        grossWeight,
        volume,
        commodityValue,
        temperature,
        isDangerous,
        incoterm,
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

// --- FREIGHT RATES ACTIONS ---

export async function getFreightRates() {
  try {
    const rates = await prisma.freightRate.findMany({
      orderBy: { createdAt: "desc" }
    });
    return JSON.parse(JSON.stringify(rates));
  } catch (error) {
    console.error("Error fetching freight rates:", error);
    return [];
  }
}

export async function createFreightRate(data: { carrier: string; origin: string; destination: string; containerType: string; commodity: string; amount: number; currency: string; validFrom: Date; validTo: Date }) {
  try {
    const rate = await prisma.freightRate.create({ data });
    revalidatePath("/tariffs");
    return JSON.parse(JSON.stringify(rate));
  } catch (error) {
    console.error("Error creating freight rate:", error);
    throw error;
  }
}

export async function updateFreightRate(id: string, data: any) {
  try {
    const rate = await prisma.freightRate.update({ where: { id }, data });
    revalidatePath("/tariffs");
    return JSON.parse(JSON.stringify(rate));
  } catch (error) {
    console.error("Error updating freight rate:", error);
    throw error;
  }
}

export async function deleteFreightRate(id: string) {
  try {
    await prisma.freightRate.delete({ where: { id } });
    revalidatePath("/tariffs");
    return true;
  } catch (error) {
    console.error("Error deleting freight rate:", error);
    throw error;
  }
}

export async function findMatchingFreightRate(origin: string, destination: string, containerType: string, commodity: string) {
  try {
    const now = new Date();
    // We look for a rate mapping the requested fields exactly and that is currently valid
    const rate = await prisma.freightRate.findFirst({
      where: {
        origin,
        destination,
        containerType,
        commodity,
        validFrom: { lte: now },
        validTo: { gte: now }
      },
      orderBy: { amount: "asc" } // Get the cheapest if there are multiple
    });
    return rate;
  } catch (error) {
    console.error("Error finding matching freight rate:", error);
    return null;
  }
}
// --- COMPANY PROFILE ACTIONS ---

export async function getCompanyProfile() {
  try {
    let profile = await prisma.companyProfile.findUnique({
      where: { id: "singleton" }
    });
    
    if (!profile) {
      // Create default if doesn't exist
      profile = await prisma.companyProfile.create({
        data: {
          id: "singleton",
          corporateName: "Ma Société",
          address: "Adresse de l'entreprise",
          phone: "+228 00 00 00 00",
          email: "contact@entreprise.com"
        }
      });
    }
    
    return profile;
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return null;
  }
}

export async function updateCompanyProfile(data: any) {
  try {
    const profile = await prisma.companyProfile.upsert({
      where: { id: "singleton" },
      update: {
        corporateName: data.corporateName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        logo: data.logo,
      },
      create: {
        id: "singleton",
        corporateName: data.corporateName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        logo: data.logo,
      }
    });
    revalidatePath("/setup/company");
    revalidatePath("/tracking");
    revalidatePath("/");
    return profile;
  } catch (error) {
    console.error("Error updating company profile:", error);
    throw error;
  }
}
