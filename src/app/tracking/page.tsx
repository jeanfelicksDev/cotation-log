"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  Mail,
  ChevronDown
} from "lucide-react";
import { clsx } from "clsx";

const mockOffers = [
  { id: "QT-2024-001", client: "Sodiam Sarl", route: "Anvers -> Dakar", amount: 2450.00, status: "Acceptée", date: "10 Avr 2024" },
  { id: "QT-2024-002", client: "Logistics Pro", route: "Le Havre -> Abidjan", amount: 3120.00, status: "En Cours", date: "09 Avr 2024" },
  { id: "QT-2024-003", client: "Africa Trade", route: "Valencia -> Lome", amount: 1890.00, status: "Révisée", date: "08 Avr 2024" },
  { id: "QT-2024-004", client: "Global Transit", route: "Shanghai -> Douala", amount: 5600.00, status: "Refusée", date: "05 Avr 2024" },
  { id: "QT-2024-005", client: "CMA CGM Agent", route: "Marseille -> Tunis", amount: 1200.00, status: "En Cours", date: "02 Avr 2024" },
];

export default function TrackingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Acceptée": return <CheckCircle2 size={16} className="text-emerald-500" />;
      case "Refusée": return <XCircle size={16} className="text-red-500" />;
      case "En Cours": return <Clock size={16} className="text-amber-500" />;
      case "Révisée": return <FileText size={16} className="text-purple-500" />;
      default: return <Clock size={16} />;
    }
  };

  const filteredOffers = mockOffers.filter(offer => {
    const matchesSearch = offer.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          offer.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "Tous" || offer.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="tracking-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Suivi des Offres</h1>
          <p className="page-subtitle">Gérez vos cotations et suivez leur statut d'approbation.</p>
        </div>
      </header>

      <div className="controls-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher par client ou référence..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-wrapper">
          <Filter size={18} className="filter-icon" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Tous">Tous les statuts</option>
            <option value="En Cours">En Cours</option>
            <option value="Acceptée">Acceptée</option>
            <option value="Révisée">Révisée</option>
            <option value="Refusée">Refusée</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Trajet</th>
              <th>Date</th>
              <th className="right">Montant</th>
              <th>Statut</th>
              <th className="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredOffers.map((offer, i) => (
                <motion.tr 
                  key={offer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="table-row"
                >
                  <td><span className="ref-tag">{offer.id}</span></td>
                  <td className="font-semibold">{offer.client}</td>
                  <td>{offer.route}</td>
                  <td className="text-dim">{offer.date}</td>
                  <td className="right font-bold text-primary">
                    {offer.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} €
                  </td>
                  <td>
                    <div className={clsx("status-badge", offer.status.toLowerCase().replace(" ", "-"))}>
                      {getStatusIcon(offer.status)}
                      <span>{offer.status}</span>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn" title="Télécharger PDF">
                      <FileText size={16} />
                    </button>
                    <button className="action-btn" title="Envoyer par email">
                      <Mail size={16} />
                    </button>
                    <div className="dropdown-trigger">
                      <button className="action-btn">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {filteredOffers.length === 0 && (
          <div className="empty-results">
            <Search size={40} className="text-muted mb-4" />
            <h3>Aucune offre trouvée</h3>
            <p>Essayez de modifier vos filtres de recherche.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .tracking-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .page-subtitle {
          color: var(--text-dim);
          font-size: 16px;
        }

        .controls-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .search-wrapper {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-wrapper input {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border-surface);
          padding: 14px 14px 14px 48px;
          border-radius: 12px;
          color: var(--text-main);
          font-size: 15px;
          transition: var(--transition-smooth);
        }
        
        .search-wrapper input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--primary-glow);
        }

        .filter-wrapper {
          position: relative;
          min-width: 200px;
        }

        .filter-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .filter-wrapper select {
          width: 100%;
          appearance: none;
          background: var(--bg-surface);
          border: 1px solid var(--border-surface);
          padding: 14px 40px 14px 48px;
          border-radius: 12px;
          color: var(--text-main);
          font-size: 15px;
          cursor: pointer;
        }

        .filter-wrapper::after {
          content: '';
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid var(--text-muted);
          pointer-events: none;
        }

        .table-card {
          background: var(--bg-surface);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-surface);
          border-radius: 20px;
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: rgba(255, 255, 255, 0.02);
          text-align: left;
          padding: 16px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid var(--border-surface);
        }

        td {
          padding: 16px;
          font-size: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          vertical-align: middle;
        }

        .table-row:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        .right { text-align: right; }
        .center { text-align: center; }
        
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .text-dim { color: var(--text-dim); }
        .text-primary { color: var(--primary); }
        .text-muted { color: var(--text-muted); }

        .ref-tag {
          font-family: monospace;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 6px;
          color: var(--text-main);
          font-size: 13px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.acceptée { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.en-cours { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-badge.révisée { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .status-badge.refusée { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .actions-cell {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-surface);
          transition: var(--transition-smooth);
        }

        .action-btn:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--border-highlight);
        }

        .empty-results {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .empty-results h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }
        
        .empty-results p {
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
}
