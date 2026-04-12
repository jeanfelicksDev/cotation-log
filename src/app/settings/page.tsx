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
  Clock,
  X
} from "lucide-react";
import { clsx } from "clsx";
import { 
  getParameters, 
  createParameter, 
  deleteParameter, 
  seedParameters,
  createReason,
  deleteReason
} from "@/lib/actions";

type Parameter = {
  id: string;
  category: "origin" | "destination" | "container" | "commodity" | "cost_type" | "currency" | "mode" | "status";
  label: string;
  reasons: { id: string; label: string }[];
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Parameter["category"]>("destination");
  const [params, setParams] = useState<Parameter[]>([]);
  const [newValue, setNewValue] = useState("");
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});
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
  
  const handleAddReason = async (paramId: string) => {
    const val = reasonInputs[paramId] || "";
    if (!val) return;
    try {
      const created = await createReason(paramId, val);
      setParams(params.map(p => {
        if (p.id === paramId) {
          return { ...p, reasons: [...(p.reasons || []), created] };
        }
        return p;
      }));
      setReasonInputs({ ...reasonInputs, [paramId]: "" });
    } catch (err) {
      alert("Erreur lors de l'ajout de la raison.");
    }
  };

  const handleRemoveReason = async (paramId: string, reasonId: string) => {
    try {
      await deleteReason(reasonId);
      setParams(params.map(p => {
        if (p.id === paramId) {
          return { ...p, reasons: (p.reasons || []).filter(r => r.id !== reasonId) };
        }
        return p;
      }));
    } catch (err) {
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
                        className={clsx("param-card", activeTab === "status" && "with-details")}
                      >
                        <div className="param-main">
                          <span className="param-label">{p.label}</span>
                          <button className="btn-delete" onClick={() => removeParam(p.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {activeTab === "status" && (
                          <div className="reasons-section">
                            <div className="reasons-list">
                              <AnimatePresence>
                                {p.reasons?.map((r) => (
                                  <motion.span 
                                    key={r.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="reason-tag"
                                  >
                                    {r.label}
                                    <button 
                                      className="btn-remove-reason" 
                                      onClick={() => handleRemoveReason(p.id, r.id)}
                                    >
                                      <X size={10} />
                                    </button>
                                  </motion.span>
                                ))}
                              </AnimatePresence>
                              
                              <div className="add-reason-inline">
                                <input 
                                  type="text" 
                                  placeholder="Nouvelle raison..."
                                  value={reasonInputs[p.id] || ""}
                                  onChange={e => setReasonInputs({ ...reasonInputs, [p.id]: e.target.value })}
                                  onKeyDown={e => e.key === "Enter" && handleAddReason(p.id)}
                                />
                                <button className="inline-add-btn" onClick={() => handleAddReason(p.id)}>
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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

        .param-card {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-surface);
          border-radius: 14px;
          transition: var(--transition-smooth);
          overflow: hidden;
        }

        .param-card:hover {
          border-color: var(--border-highlight);
          background: rgba(255, 255, 255, 0.05);
        }

        .param-main {
          display: flex;
          justify-content: flex-start;
          gap: 12px;
          align-items: center;
          padding: 14px 20px;
        }

        .param-label {
          font-weight: 700;
          color: var(--text-main);
        }

        .reasons-section {
          padding: 0 20px 16px 20px;
        }

        .reasons-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .reason-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .btn-remove-reason {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
          color: var(--primary);
          opacity: 0.6;
          transition: 0.2s;
        }

        .btn-remove-reason:hover {
          opacity: 1;
          background: rgba(16, 185, 129, 0.2);
        }

        .add-reason-inline {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 100px;
          padding: 2px 2px 2px 10px;
          border: 1px dashed var(--border-surface);
        }

        .add-reason-inline input {
          background: transparent;
          border: none;
          padding: 2px 4px;
          color: var(--text-main);
          font-size: 11px;
          width: 100px;
          outline: none;
        }

        .inline-add-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }

        .inline-add-btn:hover {
          transform: scale(1.1);
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
