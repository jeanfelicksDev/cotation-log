"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Settings, 
  MapPin, 
  Box, 
  Package, 
  Save,
  ChevronRight,
  Search,
  DollarSign,
  Truck,
  CreditCard,
  Clock
} from "lucide-react";
import { clsx } from "clsx";
import { 
  getParameters, 
  createParameter, 
  deleteParameter, 
  seedParameters 
} from "@/lib/actions";

type Parameter = {
  id: string;
  category: "origin" | "destination" | "container" | "commodity" | "cost_type" | "currency" | "mode" | "status";
  label: string;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Parameter["category"]>("destination");
  const [params, setParams] = useState<Parameter[]>([]);
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initSettings();
  }, []);

  const initSettings = async () => {
    setLoading(true);
    await seedParameters();
    const data = await getParameters();
    // @ts-ignore - map fields from DB model if necessary
    setParams(data);
    setLoading(false);
  };

  const addParam = async () => {
    if (!newValue) return;
    try {
      const created = await createParameter(activeTab, newValue);
      // @ts-ignore
      setParams([...params, created]);
      setNewValue("");
    } catch (error) {
      alert("Erreur lors de l'ajout.");
    }
  };

  const removeParam = async (id: string) => {
    try {
      await deleteParameter(id);
      setParams(params.filter(p => p.id !== id));
    } catch (error) {
      alert("Erreur lors de la suppression.");
    }
  };

  const filteredParams = params.filter(p => p.category === activeTab);

  return (
    <div className="settings-container">
      <header className="page-header">
        <div className="breadcrumb">
          <span>Configuration</span>
          <ChevronRight size={14} />
          <span className="current">Paramètres Logistiques</span>
        </div>
        <h1 className="page-title">Gestion des Paramètres</h1>
      </header>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <button 
            className={clsx("nav-item", activeTab === "origin" && "active")}
            onClick={() => setActiveTab("origin")}
          >
            <MapPin size={18} /> Points d'Origine
          </button>
          <button 
            className={clsx("nav-item", activeTab === "destination" && "active")}
            onClick={() => setActiveTab("destination")}
          >
            <MapPin size={18} className="rotate-180" /> Destinations
          </button>
          <button 
            className={clsx("nav-item", activeTab === "container" && "active")}
            onClick={() => setActiveTab("container")}
          >
            <Box size={18} /> Types de Conteneurs
          </button>
          <button 
            className={clsx("nav-item", activeTab === "commodity" && "active")}
            onClick={() => setActiveTab("commodity")}
          >
            <Package size={18} /> Marchandises
          </button>
          <button 
            className={clsx("nav-item", activeTab === "cost_type" && "active")}
            onClick={() => setActiveTab("cost_type")}
          >
            <CreditCard size={18} /> Types de Frais
          </button>
          <button 
            className={clsx("nav-item", activeTab === "currency" && "active")}
            onClick={() => setActiveTab("currency")}
          >
            <DollarSign size={18} /> Devises
          </button>
          <button 
            className={clsx("nav-item", activeTab === "mode" && "active")}
            onClick={() => setActiveTab("mode")}
          >
            <Truck size={18} /> Modes de Transport
          </button>
          <button 
            className={clsx("nav-item", activeTab === "status" && "active")}
            onClick={() => setActiveTab("status")}
          >
            <Clock size={18} /> Statut Cotation
          </button>
        </aside>

        <main className="settings-main">
          <div className="content-card">
            <div className="card-header">
              <h2>{
                activeTab === "origin" ? "Points d'Origine" : 
                activeTab === "destination" ? "Destinations" :
                activeTab === "container" ? "Types de Conteneurs" : 
                activeTab === "commodity" ? "Marchandises" :
                activeTab === "cost_type" ? "Types de Frais" :
                activeTab === "currency" ? "Devises" : 
                activeTab === "mode" ? "Modes de Transport" : "Statuts Cotation"
              }</h2>
              <p>Ajoutez ou modifiez les options disponibles dans le formulaire de cotation.</p>
            </div>

            <div className="add-param-form">
              <input 
                type="text" 
                placeholder="Nouvelle valeur..." 
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addParam()}
              />
              <button className="btn-add" onClick={addParam}>
                <Plus size={18} /> Ajouter
              </button>
            </div>

            <div className="params-list">
              {loading ? (
                <div className="loading-state">Initialisation des données...</div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredParams.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="empty-state"
                    >
                      Aucun paramètre défini pour cette catégorie.
                    </motion.div>
                  ) : (
                    filteredParams.map((p) => (
                      <motion.div 
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="param-item"
                      >
                        <span>{p.label}</span>
                        <button className="btn-delete" onClick={() => removeParam(p.id)}>
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              )}
            </div>

            <div className="card-footer">
              <p className="footer-info">Les changements sont appliqués instantanément.</p>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .settings-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-dim);
          margin-bottom: 12px;
        }

        .breadcrumb .current {
          color: var(--primary);
        }

        .page-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 40px;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
        }

        .settings-sidebar {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 14px;
          color: var(--text-dim);
          font-weight: 600;
          transition: var(--transition-smooth);
          background: transparent;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
        }

        .nav-item.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 15px var(--primary-glow);
        }

        .content-card {
          background: var(--bg-surface);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-surface);
          border-radius: 24px;
          padding: 32px;
        }

        .card-header {
          margin-bottom: 32px;
        }

        .card-header h2 {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .card-header p {
          color: var(--text-dim);
        }

        .add-param-form {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
        }

        .add-param-form input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-surface);
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text-main);
        }

        .btn-add {
          background: var(--primary);
          color: white;
          padding: 0 24px;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .params-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 200px;
          max-height: calc(5 * (48px + 8px));
          overflow-y: auto;
          padding-right: 4px;
          scrollbar-width: thin;
          scrollbar-color: var(--primary) rgba(255,255,255,0.05);
        }

        .params-list::-webkit-scrollbar {
          width: 5px;
        }
        .params-list::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
        }
        .params-list::-webkit-scrollbar-thumb {
          background: var(--primary);
          border-radius: 10px;
          opacity: 0.7;
        }

        .param-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-surface);
          border-radius: 14px;
          transition: var(--transition-smooth);
        }

        .param-item:hover {
          border-color: var(--border-highlight);
          background: rgba(255, 255, 255, 0.05);
        }

        .btn-delete {
          color: #ef4444;
          opacity: 0.6;
          transition: var(--transition-smooth);
          padding: 8px;
          border-radius: 8px;
        }

        .btn-delete:hover {
          opacity: 1;
          background: rgba(239, 68, 68, 0.1);
        }

        .card-footer {
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px solid var(--border-surface);
          display: flex;
          justify-content: flex-end;
        }

        .btn-save {
          background: #3b82f6;
          color: white;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          font-style: italic;
        }

        .loading-state {
          text-align: center;
          padding: 40px;
          color: var(--primary);
          font-weight: 600;
        }

        .footer-info {
          font-size: 12px;
          color: var(--text-dim);
          font-style: italic;
        }

        .rotate-180 { transform: rotate(180deg); }
      `}</style>
    </div>
  );
}
