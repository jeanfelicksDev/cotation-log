import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  const vars = {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    DATABASE_URL: !!process.env.DATABASE_URL,
  };

  const connectionString = process.env.DATABASE_URL_UNPOOLED
    || process.env.POSTGRES_URL_NON_POOLING 
    || process.env.POSTGRES_PRISMA_URL 
    || process.env.POSTGRES_URL
    || process.env.DATABASE_URL;
  
  if (!connectionString) {
    return NextResponse.json({ error: "No connection string", available_vars: vars }, { status: 500 });
  }

  const pool = new Pool({ connectionString });
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Quotation" (
        "id" TEXT NOT NULL,
        "reference" TEXT NOT NULL,
        "clientName" TEXT NOT NULL,
        "direction" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Draft',
        "origin" TEXT,
        "destination" TEXT,
        "commodity" TEXT,
        "totalBase" DOUBLE PRECISION NOT NULL,
        "totalFinal" DOUBLE PRECISION NOT NULL,
        "margin" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
      );

      CREATE UNIQUE INDEX IF NOT EXISTS "Quotation_reference_key" ON "Quotation"("reference");

      CREATE TABLE IF NOT EXISTS "QuotationContainer" (
        "id" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "quotationId" TEXT NOT NULL,
        CONSTRAINT "QuotationContainer_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "QuotationItem" (
        "id" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "type" TEXT NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'EUR',
        "isForwarding" BOOLEAN NOT NULL DEFAULT false,
        "buyAmount" DOUBLE PRECISION,
        "marginRate" DOUBLE PRECISION,
        "quotationId" TEXT NOT NULL,
        CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Parameter" (
        "id" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Parameter_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Tariff" (
        "id" TEXT NOT NULL,
        "zone" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'EUR',
        "type" TEXT NOT NULL,
        CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
      );
    `);

    // Add foreign keys separately (ignore if they already exist)
    try {
      await pool.query(`
        ALTER TABLE "QuotationContainer" 
          ADD CONSTRAINT "QuotationContainer_quotationId_fkey" 
          FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_) {}
    
    try {
      await pool.query(`
        ALTER TABLE "QuotationItem" 
          ADD CONSTRAINT "QuotationItem_quotationId_fkey" 
          FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_) {}

    return NextResponse.json({ success: true, message: "Database tables created successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
