"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Plus,
  ArrowRightLeft
} from "lucide-react";
import Link from "next/link";
import { getQuotations } from "@/lib/actions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { label: "Offres Totales", value: "0", icon: TrendingUp, color: "#10b981", trend: "Actuel" },
    { label: "En Attente", value: "0", icon: Clock, color: "#f59e0b", trend: "-%" },
    { label: "Offres Gagnées", value: "0", icon: CheckCircle2, color: "#3b82f6", trend: "+%" },
    { label: "Flux Import", value: "0", icon: ArrowRightLeft, color: "#8b5cf6", trend: "Flux" },
  ]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const quotes = await getQuotations();
      setData(quotes || []);
      
      const total = (quotes || []).length;
      const pending = (quotes || []).filter(q => q.status === "Sent" || q.status === "Draft").length;
      const won = (quotes || []).filter(q => q.status === "Accepted").length;
      const imports = (quotes || []).filter(q => q.direction === "import").length;

      setStats([
        { label: "Offres Totales", value: total.toString(), icon: TrendingUp, color: "#10b981", trend: "Total" },
        { label: "En Attente", value: pending.toString(), icon: Clock, color: "#f59e0b", trend: "Action" },
        { label: "Offres Gagnées", value: won.toString(), icon: CheckCircle2, color: "#3b82f6", trend: "Fermées" },
        { label: "Flux Import", value: imports.toString(), icon: ArrowRightLeft, color: "#8b5cf6", trend: "Auto" },
      ]);

      setRecentQuotes((quotes || []).slice(0, 5));
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="dashboard-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Tableau de Bord</h1>
          <p className="page-subtitle">Bienvenue, voici l'état de vos offres commerciales.</p>
        </div>
        <Link href="/quote/new">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            <Plus size={18} />
            <span>Nouvelle Cotation</span>
          </motion.button>
        </Link>
      </header>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <div className="stat-header">
              <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={20} />
              </div>
              <span className="trend positive">{stat.trend}</span>
            </div>
            <div className="stat-body">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
            <div className="card-shine" />
          </motion.div>
        ))}
      </div>

      <div className="dashboard-grid">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="content-card wide"
        >
          <div className="card-header">
            <h3>Cotations Récentes</h3>
            <Link href="/tracking" className="link-all">
              <span>Voir tout</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Trajet</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="center">Chargement...</td></tr>
                ) : recentQuotes.length === 0 ? (
                  <tr><td colSpan={5} className="center">Aucune cotation récente.</td></tr>
                ) : recentQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td><span className="ref-tag">{quote.reference}</span></td>
                    <td>{quote.clientName}</td>
                    <td>{quote.origin} -> {quote.destination}</td>
                    <td className="amount">{quote.totalFinal.toLocaleString('fr-FR')} €</td>
                    <td>
                      <span className={`status-pill ${quote.status.toLowerCase()}`}>
                        {quote.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="content-card"
        >
          <div className="card-header">
            <h3>Distribution des Flux</h3>
          </div>
          <div className="chart-placeholder">
            {/* Visual simulation of a chart */}
            <div className="pie-sim">
              <div className="dot" style={{ background: "#10b981", height: "80%" }}></div>
              <div className="dot" style={{ background: "#3b82f6", height: "45%" }}></div>
              <div className="dot" style={{ background: "#f59e0b", height: "60%" }}></div>
              <div className="dot" style={{ background: "#8b5cf6", height: "30%" }}></div>
            </div>
            <div className="chart-labels">
              <div><span className="dot" style={{ background: "#10b981" }}></span> Import</div>
              <div><span className="dot" style={{ background: "#3b82f6" }}></span> Export</div>
              <div><span className="dot" style={{ background: "#f59e0b" }}></span> Transit</div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
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
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .page-subtitle {
          color: var(--text-dim);
          font-size: 16px;
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
          transition: var(--transition-smooth);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: var(--bg-surface);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-surface);
          border-radius: 24px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .trend {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 20px;
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .stat-label {
          color: var(--text-dim);
          font-size: 14px;
          font-weight: 500;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .content-card {
          background: var(--bg-surface);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-surface);
          border-radius: 24px;
          padding: 28px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .card-header h3 {
          font-size: 18px;
          font-weight: 700;
        }

        .link-all {
          color: var(--primary);
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        td {
          padding: 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--border-surface);
        }

        .ref-tag {
          font-family: monospace;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 6px;
          color: var(--text-main);
        }

        .amount {
          font-weight: 700;
          color: var(--text-main);
        }

        .status-pill {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .status-pill.accepted { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-pill.sent { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-pill.draft { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .status-pill.rejected { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .chart-placeholder {
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }

        .pie-sim {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          height: 100px;
          width: 100%;
          justify-content: center;
        }

        .pie-sim .dot {
          width: 12px;
          border-radius: 6px;
          opacity: 0.8;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }

        .chart-labels {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--text-dim);
        }

        .chart-labels div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chart-labels .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
