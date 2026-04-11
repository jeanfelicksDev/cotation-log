"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  DollarSign, 
  Globe, 
  Calendar, 
  Ship,
  Home,
  ArrowRight
} from "lucide-react";
import { 
  getTariffs, 
  createTariff, 
  deleteTariff, 
  updateTariff,
  seedTariffs,
  getFreightRates,
  createFreightRate,
  deleteFreightRate,
  updateFreightRate,
  getParameters
} from "@/lib/actions";

type TabType = "maison" | "forwarder";

export default function TariffsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("maison");
  const [isLoaded, setIsLoaded] = useState(false);

  // States for "Maison" Tariffs
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [maisonSearch, setMaisonSearch] = useState("");
  const [activeModal, setActiveModal] = useState<"maison" | "forwarder" | null>(null);
  const [editingTariff, setEditingTariff] = useState<any | null>(null);
  const [newTariff, setNewTariff] = useState({
    zone: "",
    description: "",
    amount: "",
    type: "Fret",
    currency: "EUR"
  });

  // States for "Forwarder" Tariffs
  const [rates, setRates] = useState<any[]>([]);
  const [forwarderSearch, setForwarderSearch] = useState("");
  const [forwarderLoading, setForwarderLoading] = useState(true);
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [origins, setOrigins] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [newRate, setNewRate] = useState({
    carrier: "",
    origin: "",
    destination: "",
    containerType: "",
    commodity: "Général",
    amount: "",
    currency: "EUR",
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  // Initialization & State Sync
  useEffect(() => {
    // 1. Sync Tab State from LocalStorage
    const savedTab = localStorage.getItem("activeTariffTab") as TabType;
    if (savedTab && (savedTab === "maison" || savedTab === "forwarder")) {
      setActiveTab(savedTab);
    }
    setIsLoaded(true);
    
    // 2. Initial Data Fetch
    const fetchAll = async () => {
      await Promise.all([initMaison(), initForwarder()]);
    };
    fetchAll();
  }, []);

  // Save active tab to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("activeTariffTab", activeTab);
    }
  }, [activeTab, isLoaded]);

  // Reset modal when switching tabs
  useEffect(() => {
    setActiveModal(null);
  }, [activeTab]);

  // Body scroll lock
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [activeModal]);

  const initMaison = async () => {
    setMaisonLoading(true);
    await seedTariffs(); // Ensure base data exists
    const data = await getTariffs();
    setTariffs(data);
    setMaisonLoading(false);
  };

  const initForwarder = async () => {
    setForwarderLoading(true);
    const [ratesData, params] = await Promise.all([
      getFreightRates(),
      getParameters()
    ]);
    setRates(ratesData);
    setOrigins(params.filter((p: any) => p.category === "origin"));
    setDestinations(params.filter((p: any) => p.category === "destination"));
    setContainers(params.filter((p: any) => p.category === "container"));
    setForwarderLoading(false);
  };

  // --- MAISON CRUD ---
  const openAddMaison = () => {
    setEditingTariff(null);
    setNewTariff({ zone: "", description: "", amount: "", type: "Fret", currency: "EUR" });
    setActiveModal("maison");
  };

  const openEditMaison = (tariff: any) => {
    setEditingTariff(tariff);
    setNewTariff({
      zone: tariff.zone,
      description: tariff.description,
      amount: String(tariff.amount),
      type: tariff.type,
      currency: tariff.currency,
    });
    setActiveModal("maison");
  };

  const handleSubmitMaison = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTariff) {
        const updated = await updateTariff(editingTariff.id, {
          ...newTariff,
          amount: parseFloat(newTariff.amount)
        });
        setTariffs(tariffs.map(t => t.id === editingTariff.id ? updated : t));
      } else {
        const created = await createTariff({
          ...newTariff,
          amount: parseFloat(newTariff.amount)
        });
        setTariffs([...tariffs, created]);
      }
      setActiveModal(null);
    } catch (err) {
      alert("Erreur lors de l'opération.");
    }
  };

  const handleDeleteMaison = async (id: string) => {
    if (!confirm("Supprimer ce tarif maison ?")) return;
    await deleteTariff(id);
    setTariffs(tariffs.filter(t => t.id !== id));
  };
  // --- FORWARDER CRUD ---
  const openAddForwarder = () => {
    setEditingRate(null);
    setNewRate({
      carrier: "",
      origin: origins[0]?.value || "",
      destination: destinations[0]?.value || "",
      containerType: containers[0]?.value || "",
      commodity: "Général",
      amount: "",
      currency: "EUR",
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
    setActiveModal("forwarder");
  };

  const openEditForwarder = (rate: any) => {
    setEditingRate(rate);
    setNewRate({
      carrier: rate.carrier,
      origin: rate.origin,
      destination: rate.destination,
      containerType: rate.containerType,
      commodity: rate.commodity,
      amount: String(rate.amount),
      currency: rate.currency,
      validFrom: new Date(rate.validFrom).toISOString().split('T')[0],
      validTo: new Date(rate.validTo).toISOString().split('T')[0]
    });
    setActiveModal("forwarder");
  };

  const handleSubmitForwarder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newRate,
        amount: parseFloat(newRate.amount),
        validFrom: new Date(newRate.validFrom),
        validTo: new Date(newRate.validTo)
      };
      if (editingRate) {
        const updated = await updateFreightRate(editingRate.id, payload);
        setRates(rates.map(r => r.id === editingRate.id ? updated : r));
      } else {
        const created = await createFreightRate(payload);
        setRates([created, ...rates]);
      }
      setActiveModal(null);
    } catch (err) {
      alert("Erreur lors de l'opération.");
    }
  };

  const handleDeleteForwarder = async (id: string) => {
    if (!confirm("Supprimer ce tarif armateur ?")) return;
    await deleteFreightRate(id);
    setRates(rates.filter(r => r.id !== id));
  };

  // --- FILTERING ---
  const filteredMaison = tariffs.filter(t => 
    t.zone.toLowerCase().includes(maisonSearch.toLowerCase()) ||
    t.description.toLowerCase().includes(maisonSearch.toLowerCase())
  );

  const filteredForwarder = rates.filter(r => 
    r.carrier.toLowerCase().includes(forwarderSearch.toLowerCase()) ||
    r.origin.toLowerCase().includes(forwarderSearch.toLowerCase()) ||
    r.destination.toLowerCase().includes(forwarderSearch.toLowerCase())
  );

  if (!isLoaded) return null;

  const themeColor = activeTab === "maison" ? "#10b981" : "#a855f7";
  const themeGlow = activeTab === "maison" ? "rgba(16, 185, 129, 0.4)" : "rgba(168, 85, 247, 0.4)";

  return (
    <>
      <div className="tariffs-container" style={{ ["--theme-color" as any]: themeColor, ["--theme-glow" as any]: themeGlow }}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Grilles Tarifaires</h1>
          <p className="page-subtitle">Visualisez et gérez vos catalogues de prix logistiques.</p>
        </div>
      </header>

      {/* Tabs Switcher */}
      <div className="tabs-wrapper">
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === "maison" ? "active" : ""}`}
            onClick={() => setActiveTab("maison")}
          >
            <Home size={16} />
            <span>Nos Tarifs (Maison)</span>
            {activeTab === "maison" && <motion.div layoutId="tab-underline" className="tab-underline" />}
          </button>
          <button 
            className={`tab-btn ${activeTab === "forwarder" ? "active" : ""}`}
            onClick={() => setActiveTab("forwarder")}
          >
            <Globe size={16} />
            <span>Tarif Armateur (Forwarder)</span>
            {activeTab === "forwarder" && <motion.div layoutId="tab-underline" className="tab-underline" />}
          </button>
        </div>
      </div>

      <div className="search-row">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder={activeTab === "maison" ? "Rechercher une zone, description..." : "Rechercher un transporteur, port..."}
            value={activeTab === "maison" ? maisonSearch : forwarderSearch}
            onChange={e => activeTab === "maison" ? setMaisonSearch(e.target.value) : setForwarderSearch(e.target.value)}
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={activeTab === "maison" ? openAddMaison : openAddForwarder}
        >
          <Plus size={18} />
          <span>{activeTab === "maison" ? "Nouveau Tarif Maison" : "Nouveau Tarif Armateur"}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "maison" ? (
          <motion.div 
            key="maison-content"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="tab-panel"
          >
            <div className="tariffs-grid">
              {maisonLoading ? (
                <div className="loading-state">Chargement des tarifs maison...</div>
              ) : (
                filteredMaison.map((tariff, i) => (
                  <motion.div
                    key={tariff.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="tariff-card"
                  >
                    <div className="tariff-main">
                      <div className="tariff-type">{tariff.type}</div>
                      <h3 className="tariff-zone">{tariff.zone}</h3>
                      <p className="tariff-desc">{tariff.description}</p>
                    </div>
                    <div className="tariff-amount">
                      {tariff.amount.toLocaleString()} {tariff.currency === "XOF" ? "CFA" : "€"}
                    </div>
                    <div className="tariff-actions">
                      <button className="icon-btn" onClick={() => openEditMaison(tariff)}>
                        <Edit size={16} />
                      </button>
                      <button className="icon-btn delete" onClick={() => handleDeleteMaison(tariff.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
              {!maisonLoading && filteredMaison.length === 0 && (
                <div className="empty-state">Aucun tarif maison trouvé.</div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="forwarder-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="tab-panel"
          >
            <div className="tariffs-grid">
              {forwarderLoading ? (
                <div className="loading-state">Chargement des tarifs armateurs...</div>
              ) : (
                filteredForwarder.map((rate, i) => {
                  const isExpired = new Date(rate.validTo) < new Date();
                  return (
                    <motion.div
                      key={rate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`tariff-card ${isExpired ? 'expired' : ''}`}
                    >
                      <div className="tariff-main flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-primary">{rate.carrier}</span>
                          <span className="carrier-badge">{rate.containerType}</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-2 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            {rate.origin} <ArrowRight size={12}/> {rate.destination}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">•</span>
                          <span className="flex items-center gap-1"><Ship size={14}/> {rate.commodity}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Calendar size={12}/> Validité : {new Date(rate.validFrom).toLocaleDateString()} - {new Date(rate.validTo).toLocaleDateString()}
                          {isExpired && <span className="text-red-400 ml-2 font-semibold">Expiré</span>}
                        </div>
                      </div>
                      
                      <div className="tariff-amount whitespace-nowrap">
                        {rate.amount.toLocaleString()} {rate.currency === "XOF" ? "CFA" : rate.currency === "USD" ? "$" : "€"}
                      </div>
                      
                      <div className="tariff-actions pl-4 border-l border-white/10 ml-4">
                        <button className="icon-btn" onClick={() => openEditForwarder(rate)}>
                          <Edit size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDeleteForwarder(rate.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
              {!forwarderLoading && filteredForwarder.length === 0 && (
                <div className="empty-state">Aucun tarif armateur trouvé.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </AnimatePresence>

      <style jsx>{`
        .tariffs-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
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
          background: var(--theme-color);
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px var(--theme-glow);
          transition: var(--transition-smooth);
        }

        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }

        /* Tabs Styles */
        .tabs-wrapper {
          margin-bottom: 32px;
          border-bottom: 1px solid var(--border-surface);
        }

        .tabs-container {
          display: flex;
          gap: 32px;
        }

        .tab-btn {
          padding: 12px 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          position: relative;
          font-weight: 500;
          transition: var(--transition-smooth);
        }

        .tab-btn:hover {
          color: var(--text-main);
        }

        .tab-btn.active {
          color: var(--theme-color);
          font-weight: 600;
        }

        .tab-underline {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--theme-color);
          box-shadow: 0 -2px 10px var(--theme-glow);
        }

        .search-row {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }

        .search-bar {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-dim);
        }

        .search-bar input {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border-surface);
          padding: 14px 14px 14px 48px;
          border-radius: 16px;
          color: var(--text-main);
          font-size: 15px;
          height: 48px;
        }

        .btn-primary {
          background: var(--theme-color);
          color: white;
          padding: 0 24px;
          border-radius: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          height: 48px;
          box-shadow: 0 4px 15px var(--theme-glow);
          transition: var(--transition-smooth);
          white-space: nowrap;
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
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          transition: var(--transition-smooth);
        }

        .tariff-card:hover {
          border-color: var(--theme-color);
          background: rgba(255, 255, 255, 0.02);
          transform: translateY(-2px);
        }

        .tariff-card.expired {
          opacity: 0.6;
          filter: grayscale(0.5);
        }

        .carrier-badge {
          font-size: 11px;
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-surface);
          border-radius: 6px;
          color: var(--text-dim);
          font-weight: 600;
        }

        .tariff-main {
          flex: 1;
        }

        .tariff-type {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--theme-color);
          font-weight: 700;
          margin-bottom: 4px;
        }

        .tariff-zone {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .tariff-desc {
          font-size: 13px;
          color: var(--text-dim);
        }

        .tariff-amount {
          font-size: 24px;
          font-weight: 800;
          color: var(--theme-color);
          text-shadow: 0 0 20px var(--theme-glow);
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

        .loading-state, .empty-state {
          text-align: center;
          padding: 80px;
          color: var(--text-muted);
          font-style: italic;
          background: rgba(255, 255, 255, 0.01);
          border-radius: 20px;
          border: 1px dashed var(--border-surface);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: var(--bg-surface);
          border: 1px solid var(--border-surface);
          border-radius: 24px;
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-surface);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 { font-size: 20px; font-weight: 700; }

        form { padding: 24px; }
        .form-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr;
          gap: 20px; 
        }
        
        .full-width { grid-column: 1 / -1; }

        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .input-group input, .input-group select {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-surface);
          padding: 12px;
          border-radius: 12px;
          color: var(--text-main);
          transition: var(--transition-smooth);
        }

        .input-group input:focus, .input-group select:focus {
          border-color: var(--primary);
          outline: none;
          background: rgba(16, 185, 129, 0.05);
        }

        .modal-footer {
          margin-top: 24px;
          padding-top: 24px;
          display: flex;
          gap: 12px;
          border-top: 1px solid var(--border-surface);
        }

        .btn-cancel {
          flex: 1;
          padding: 14px;
          border-radius: 14px;
          font-weight: 600;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
        }

        .btn-submit {
          flex: 2;
          padding: 14px;
          border-radius: 14px;
          font-weight: 600;
          background: var(--theme-color);
          color: white;
          box-shadow: 0 4px 15px var(--theme-glow);
        }

        /* Shared Utils */
        .flex { display: flex; }
        .items-center { align-items: center; }
        .flex-1 { flex: 1; }
        .gap-1 { gap: 4px; }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .mb-1 { margin-bottom: 4px; }
        .mt-2 { margin-top: 8px; }
        .ml-2 { margin-left: 8px; }
        .ml-4 { margin-left: 16px; }
        .pl-4 { padding-left: 16px; }
        .font-bold { font-weight: 700; }
        .text-lg { font-size: 18px; }
        .text-sm { font-size: 14px; }
        .text-xs { font-size: 12px; }
        .text-primary { color: var(--theme-color); }
        .text-gray-400 { color: #9ca3af; }
        .text-gray-500 { color: #6b7280; }
        .text-red-400 { color: #f87171; }
        .border-l { border-left: 1px solid var(--border-surface); }
        .whitespace-nowrap { white-space: nowrap; }
      `}</style>
    </div>

    <AnimatePresence>
      {activeModal && (
        <motion.div 
          className="modal-overlay" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal-content" 
            initial={{ scale: 0.9, y: 20 }} 
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="modal-header">
              <h2>
                {activeModal === "maison" 
                  ? (editingTariff ? "Modifier Tarif Maison" : "Nouveau Tarif Maison")
                  : (editingRate ? "Modifier Tarif Armateur" : "Nouveau Tarif Armateur")
                }
              </h2>
              <button onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>

            {activeModal === "maison" ? (
              <form onSubmit={handleSubmitMaison}>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Zone / Destination</label>
                    <input type="text" required value={newTariff.zone} onChange={e => setNewTariff({...newTariff, zone: e.target.value})} placeholder="ex: Europe, Asie..." />
                  </div>
                  <div className="input-group">
                    <label>Type de tarif</label>
                    <select value={newTariff.type} onChange={e => setNewTariff({...newTariff, type: e.target.value})}>
                      <option value="Fret">Fret</option>
                      <option value="THC">THC</option>
                      <option value="Surestaries">Surestaries</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div className="input-group full-width">
                    <label>Description détaillée</label>
                    <input type="text" required value={newTariff.description} onChange={e => setNewTariff({...newTariff, description: e.target.value})} placeholder="Détails du service..." />
                  </div>
                  <div className="input-group">
                    <label>Montant</label>
                    <input type="number" required value={newTariff.amount} onChange={e => setNewTariff({...newTariff, amount: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Devise</label>
                    <select value={newTariff.currency} onChange={e => setNewTariff({...newTariff, currency: e.target.value})}>
                      <option value="EUR">Euro (€)</option>
                      <option value="XOF">FCFA (CFA)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Annuler</button>
                  <button type="submit" className="btn-submit">{editingTariff ? "Enregistrer" : "Créer"}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitForwarder}>
                <div className="form-grid">
                  <div className="input-group full-width">
                    <label>Compagnie Maritime / Armateur</label>
                    <input type="text" required value={newRate.carrier} onChange={e => setNewRate({...newRate, carrier: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Port de Départ</label>
                    <input type="text" list="origins-list" required value={newRate.origin} onChange={e => setNewRate({...newRate, origin: e.target.value})} />
                    <datalist id="origins-list">
                      {origins.map((o: any) => <option key={o.id} value={o.value}>{o.label}</option>)}
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label>Port d'Arrivée</label>
                    <input type="text" list="dest-list" required value={newRate.destination} onChange={e => setNewRate({...newRate, destination: e.target.value})} />
                    <datalist id="dest-list">
                      {destinations.map((d: any) => <option key={d.id} value={d.value}>{d.label}</option>)}
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label>Type de Conteneur</label>
                    <select required value={newRate.containerType} onChange={e => setNewRate({...newRate, containerType: e.target.value})}>
                      <option value="">Sélectionner...</option>
                      {containers.map((c: any) => <option key={c.id} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Marchandise</label>
                    <input type="text" required value={newRate.commodity} onChange={e => setNewRate({...newRate, commodity: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Démarrage Validité</label>
                    <input type="date" required value={newRate.validFrom} onChange={e => setNewRate({...newRate, validFrom: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Fin Validité</label>
                    <input type="date" required value={newRate.validTo} onChange={e => setNewRate({...newRate, validTo: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Montant (Achat)</label>
                    <input type="number" step="0.01" required value={newRate.amount} onChange={e => setNewRate({...newRate, amount: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Devise</label>
                    <select value={newRate.currency} onChange={e => setNewRate({...newRate, currency: e.target.value})}>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="XOF">XOF (CFA)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Annuler</button>
                  <button type="submit" className="btn-submit">{editingRate ? "Modifier" : "Ajouter"}</button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
