"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Layers, Edit, Trash2 } from "lucide-react";

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState([
    { id: "1", zone: "Europe -> Africa", description: "Ocean Freight 20GP", amount: 1200, type: "Fret" },
    { id: "2", zone: "Europe -> Africa", description: "THC Anvers", amount: 250, type: "Local" },
    { id: "3", zone: "Asia -> Europe", description: "Ocean Freight 40HC", amount: 3500, type: "Fret" },
  ]);

  return (
    <div className="tariffs-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Grilles Tarifaires</h1>
          <p className="page-subtitle">Gérez vos tarifs standards pour automatiser les cotations.</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          <span>Ajouter un Tarif</span>
        </button>
      </header>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Rechercher par zone ou description..." />
      </div>

      <div className="tariffs-grid">
        {tariffs.map((tariff, i) => (
          <motion.div
            key={tariff.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="tariff-card"
          >
            <div className="tariff-type">{tariff.type}</div>
            <div className="tariff-main">
              <h3>{tariff.zone}</h3>
              <p>{tariff.description}</p>
            </div>
            <div className="tariff-amount">
              {tariff.amount.toLocaleString()} €
            </div>
            <div className="tariff-actions">
              <button className="icon-btn"><Edit size={16} /></button>
              <button className="icon-btn delete"><Trash2 size={16} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        .tariffs-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .page-subtitle {
          color: var(--text-dim);
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px var(--primary-glow);
        }

        .search-bar {
          position: relative;
          margin-bottom: 32px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-bar input {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border-surface);
          padding: 14px 14px 14px 48px;
          border-radius: 16px;
          color: var(--text-main);
          font-size: 15px;
        }

        .tariffs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .tariff-card {
          background: var(--bg-surface);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-surface);
          border-radius: 20px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          transition: var(--transition-smooth);
        }

        .tariff-card:hover {
          border-color: var(--primary);
          background: rgba(16, 185, 129, 0.05);
        }

        .tariff-type {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px;
          border-radius: 8px;
          color: var(--text-muted);
        }

        .tariff-main {
          flex: 1;
        }

        .tariff-main h3 {
          font-size: 16px;
          margin-bottom: 4px;
        }

        .tariff-main p {
          font-size: 14px;
          color: var(--text-dim);
        }

        .tariff-amount {
          font-size: 18px;
          font-weight: 800;
          color: var(--primary);
        }

        .tariff-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          transition: var(--transition-smooth);
        }

        .icon-btn:hover {
          color: var(--text-main);
          border-color: var(--border-highlight);
        }

        .icon-btn.delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}
