"use client";

import React, { useState, useEffect } from "react";
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
  ChevronDown,
  Trash2,
  Calendar,
  ArrowRightLeft,
  Edit
} from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { 
  getQuotations, 
  deleteQuotation, 
  updateQuotationStatus,
  getParameters
} from "@/lib/actions";
import { generateQuotationPDF } from "@/lib/export-pdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import QuotationTree from "@/components/QuotationTree";

export default function TrackingPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterDirection, setFilterDirection] = useState("Tous");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [statusParams, setStatusParams] = useState<any[]>([]);
  const [treeFilters, setTreeFilters] = useState<{ year?: number; month?: number; client?: string; quoteId?: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [quotes, statusList] = await Promise.all([
      getQuotations(),
      getParameters("status")
    ]);
    setOffers(quotes);
    setStatusParams(statusList);
    setLoading(false);
  };

  const handleStatusChange = (id: string, status: string) => {
    router.push(`/quote/new?id=${id}&step=3&status=${encodeURIComponent(status)}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) return;
    try {
      await deleteQuotation(id);
      setOffers(offers.filter(o => o.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleDownload = (offer: any) => {
    generateQuotationPDF({
      client: offer.clientName || "Client",
      direction: offer.direction || "import",
      origin: offer.origin || "-",
      destination: offer.destination || "-",
      commodity: offer.commodity || "-",
      mode: offer.mode || "sea",
      containers: offer.containers || [],
      items: offer.items || [],
      totalFinal: offer.totalFinal || 0
    });
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      offer.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "Tous" || offer.status === filterStatus;
    const matchesDirection = filterDirection === "Tous" || offer.direction === filterDirection.toLowerCase();
    
    // Date filter logic
    if (filterDateRange !== "all") {
      const date = new Date(offer.createdAt);
      const now = new Date();
      if (filterDateRange === "today") {
        if (date.toDateString() !== now.toDateString()) return false;
      }
      if (filterDateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (date < weekAgo) return false;
      }
      if (filterDateRange === "month") {
        if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
      }
    }

    // Tree-based filters
    if (treeFilters.year) {
      if (new Date(offer.createdAt).getFullYear() !== treeFilters.year) return false;
    }
    if (treeFilters.client) {
      if (offer.clientName !== treeFilters.client) return false;
    }
    if (treeFilters.quoteId) {
      if (offer.id !== treeFilters.quoteId) return false;
    }

    return matchesSearch && matchesStatus && matchesDirection;
  });

  const getStatusColor = (statusName: string) => {
    switch (statusName) {
      case "Accepted": 
      case "Acceptée":
      case "Opportunity won": return "#10b981"; // Green
      case "Rejected":
      case "Refusée":
      case "Opportunity Missed": return "#ef4444"; // Red
      case "Sent":
      case "Envoyée": return "#3b82f6"; // Blue
      case "Draft":
      case "Brouillon": return "#6b7280"; // Grey
      case "Rate under negotiation": return "#f59e0b"; // Orange/Amber
      default: return "#3b82f6";
    }
  };

  return (
    <div className="tracking-wrapper">
      <div className="tracking-container">
        <header className="page-header">
          <div>
            <h1 className="page-title">Suivi des Offres</h1>
            <p className="page-subtitle">Gérez vos cotations et suivez leur statut d'approbation.</p>
          </div>
        </header>
        
        {/* Contenu principal */}

      <div className="tab-control">
        <div className="search-bar-primary">
          <Search size={18} className="icon" />
          <input 
            type="text" 
            placeholder="Rechercher un client, une référence..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button 
            className={clsx("btn-filter-toggle", isFilterPanelOpen && "active")}
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          >
            <Filter size={18} />
            Filtres
          </button>
        </div>

        <AnimatePresence>
          {isFilterPanelOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="filter-panel"
            >
              <div className="filter-grid">
                <div className="filter-item">
                  <label><Clock size={14} /> Statut</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="Tous">Tous</option>
                    {statusParams.map(s => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-item">
                  <label><ArrowRightLeft size={14} /> Flux</label>
                  <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)}>
                    <option value="Tous">Tous</option>
                    <option value="import">Import</option>
                    <option value="export">Export</option>
                  </select>
                </div>
                <div className="filter-item">
                  <label><Calendar size={14} /> Date</label>
                  <select value={filterDateRange} onChange={e => setFilterDateRange(e.target.value)}>
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">7 derniers jours</option>
                    <option value="month">Ce mois-ci</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
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
                  <td className="font-semibold">{offer.clientName}</td>
                  <td>
                    <div className="route-cell">
                      <span>{offer.origin}</span>
                      <ChevronDown size={12} className="-rotate-90 text-muted" />
                      <span>{offer.destination}</span>
                    </div>
                  </td>
                  <td className="text-dim">
                    {format(new Date(offer.createdAt), "dd MMM yyyy", { locale: fr })}
                  </td>
                  <td className="right font-bold text-primary">
                    {offer.totalFinal.toLocaleString('fr-FR')} €
                  </td>
                  <td>
                    <select 
                      className="status-select"
                      value={offer.status}
                      onChange={e => handleStatusChange(offer.id, e.target.value)}
                      style={{ 
                        backgroundColor: getStatusColor(offer.status),
                        borderColor: getStatusColor(offer.status),
                        color: 'white',
                        boxShadow: `0 0 10px ${getStatusColor(offer.status)}44`
                      }}
                    >
                      {statusParams.length > 0 ? (
                        statusParams.map(s => (
                          <option key={s.id} value={s.label}>{s.label}</option>
                        ))
                      ) : (
                        <>
                          <option value="Draft">Brouillon</option>
                          <option value="Sent">Envoyée</option>
                          <option value="Accepted">Acceptée</option>
                          <option value="Rejected">Refusée</option>
                        </>
                      )}
                    </select>
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn download" title="Télécharger PDF" onClick={() => handleDownload(offer)}>
                      <FileText size={16} />
                    </button>
                    <button className="action-btn edit" title="Modifier" onClick={() => router.push(`/quote/new?id=${offer.id}`)}>
                      <Edit size={16} />
                    </button>
                    <button className="action-btn delete" title="Supprimer" onClick={() => handleDelete(offer.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {loading ? (
          <div className="loading-state">Chargement des données...</div>
        ) : filteredOffers.length === 0 && (
          <div className="empty-results">
            <Search size={40} className="text-muted mb-4" />
            <h3>Aucune offre trouvée</h3>
            <p>Essayez de modifier vos filtres ou de créer une nouvelle cotation.</p>
          </div>
        )}
      </div>
      </div>

      <aside className="tracking-sidebar">
        <QuotationTree 
          data={offers} 
          onSelect={setTreeFilters} 
          selectedId={treeFilters.quoteId} 
        />
        {Object.keys(treeFilters).length > 0 && (
          <button 
            className="btn-reset-tree"
            onClick={() => setTreeFilters({})}
          >
            Réinitialiser l'explorateur
          </button>
        )}
      </aside>
    </div>

    <style jsx>{`
        .tracking-wrapper {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          max-width: 1600px;
          margin: 0 auto;
        }

        .tracking-sidebar {
          width: 300px;
          position: sticky;
          top: 24px;
          height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn-reset-tree {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-surface);
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-reset-tree:hover {
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
          border-color: var(--primary);
        }

        .tracking-container {
          flex: 1;
          min-width: 0; /* Prevents flex items from overflowing */
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
        .status-batch.refusée { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .status-select {
          appearance: none;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-surface);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-main);
          cursor: pointer;
        }

        .status-select:focus {
          outline: none;
          box-shadow: 0 0 15px var(--primary-glow);
        }

        .loading-state {
          padding: 60px;
          text-align: center;
          color: var(--primary);
          font-weight: 600;
        }

        .tab-control {
          margin-bottom: 24px;
        }

        .search-bar-primary {
          display: flex;
          gap: 12px;
          background: var(--bg-surface);
          padding: 8px;
          border-radius: 16px;
          border: 1px solid var(--border-surface);
        }

        .search-bar-primary .icon {
          margin-left: 12px;
          align-self: center;
          color: var(--text-muted);
        }

        .search-bar-primary input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px;
          color: var(--text-main);
          font-size: 15px;
        }

        .btn-filter-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
          font-weight: 600;
          transition: 0.2s;
        }

        .btn-filter-toggle.active {
          background: var(--primary);
          color: white;
        }

        .filter-panel {
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          padding: 20px;
          border: 1px dashed var(--border-surface);
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
        }

        .filter-item label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .filter-item select {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-surface);
          padding: 8px;
          border-radius: 8px;
          color: var(--text-main);
        }

        .route-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .actions-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }

        .action-btn {
          color: #ffffff;
          background: transparent;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
        }

        .action-btn:hover {
          opacity: 1;
          transform: scale(1.15);
        }

        .action-btn.download:hover {
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        }

        .action-btn.edit:hover {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.15);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
        }

        .action-btn.delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
        }
      `}</style>
    </div>
  );
}
