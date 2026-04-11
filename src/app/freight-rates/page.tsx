"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit, Trash2, X, Globe, Calendar, Ship } from "lucide-react";
import { 
  getFreightRates, 
  createFreightRate, 
  deleteFreightRate, 
  updateFreightRate,
  getParameters
} from "@/lib/actions";

export default function FreightRatesPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any | null>(null);
  
  // To populate dropdowns
  const [origins, setOrigins] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);

  const [newRate, setNewRate] = useState({
    carrier: "",
    origin: "",
    destination: "",
    containerType: "",
    commodity: "",
    amount: "",
    currency: "EUR",
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    const data = await getFreightRates();
    setRates(data);
    
    // Load params for dropdowns
    const params = await getParameters();
    setOrigins(params.filter((p: any) => p.category === "origin"));
    setDestinations(params.filter((p: any) => p.category === "destination"));
    setContainers(params.filter((p: any) => p.category === "container"));
    
    setLoading(false);
  };

  const openAddModal = () => {
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
    setIsModalOpen(true);
  };

  const openEditModal = (rate: any) => {
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
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      setIsModalOpen(false);
      setEditingRate(null);
    } catch (err) {
      alert(editingRate ? "Erreur lors de la modification du tarif." : "Erreur lors de la création du tarif.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce tarif négocié ?")) return;
    try {
      await deleteFreightRate(id);
      setRates(rates.filter(r => r.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const filteredRates = rates.filter(r => 
    r.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.commodity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tariffs-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Tarifs Fret Négociés</h1>
          <p className="page-subtitle">Gérez vos taux d'achat négociés auprès des compagnies maritimes.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Nouveau Tarif</span>
        </button>
      </header>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Rechercher par transporteur, marchandise, port..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="tariffs-grid">
        {loading ? (
          <div className="loading-state">Chargement des tarifs négociés...</div>
        ) : (
          filteredRates.map((rate, i) => {
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
                    <span className="text-sm px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300">
                      {rate.containerType}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Globe size={14}/> {rate.origin} &rarr; {rate.destination}</span>
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
                  <button className="icon-btn" onClick={() => openEditModal(rate)}>
                    <Edit size={16} />
                  </button>
                  <button className="icon-btn delete" onClick={() => handleDelete(rate.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
        {!loading && filteredRates.length === 0 && (
          <div className="empty-state">Aucun tarif négocié trouvé.</div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
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
            >
              <div className="modal-header">
                <h2>{editingRate ? "Modifier le Tarif Négocié" : "Nouveau Tarif Négocié"}</h2>
                <button onClick={() => { setIsModalOpen(false); setEditingRate(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="input-group full-width">
                    <label>Compagnie Maritime (ex: CMA CGM)</label>
                    <input 
                      type="text" 
                      required
                      value={newRate.carrier}
                      onChange={e => setNewRate({...newRate, carrier: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Port de Départ</label>
                    <input 
                      type="text"
                      list="origins-list"
                      required
                      value={newRate.origin}
                      onChange={e => setNewRate({...newRate, origin: e.target.value})}
                    />
                    <datalist id="origins-list">
                      {origins.map((o: any) => <option key={o.id} value={o.value}>{o.label}</option>)}
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label>Port d'Arrivée</label>
                    <input 
                      type="text"
                      list="dest-list"
                      required
                      value={newRate.destination}
                      onChange={e => setNewRate({...newRate, destination: e.target.value})}
                    />
                    <datalist id="dest-list">
                      {destinations.map((d: any) => <option key={d.id} value={d.value}>{d.label}</option>)}
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label>Type de Conteneur</label>
                    <select 
                      required
                      value={newRate.containerType}
                      onChange={e => setNewRate({...newRate, containerType: e.target.value})}
                    >
                      <option value="">Sélectionner...</option>
                      {containers.map((c: any) => <option key={c.id} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Marchandise</label>
                    <input 
                      type="text"
                      required
                      value={newRate.commodity}
                      onChange={e => setNewRate({...newRate, commodity: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Début de validité</label>
                    <input 
                      type="date"
                      required
                      value={newRate.validFrom}
                      onChange={e => setNewRate({...newRate, validFrom: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Fin de validité</label>
                    <input 
                      type="date"
                      required
                      value={newRate.validTo}
                      onChange={e => setNewRate({...newRate, validTo: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Montant (Achat)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={newRate.amount}
                      onChange={e => setNewRate({...newRate, amount: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Devise</label>
                    <select 
                      value={newRate.currency}
                      onChange={e => setNewRate({...newRate, currency: e.target.value})}
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="XOF">XOF (CFA)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => { setIsModalOpen(false); setEditingRate(null); }}>Annuler</button>
                  <button type="submit" className="btn-submit">{editingRate ? "Modifier" : "Ajouter"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .full-width {
          grid-column: 1 / -1;
        }

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

        .tariff-card.expired {
          opacity: 0.6;
          filter: grayscale(0.5);
        }

        .tariff-card:hover {
          border-color: var(--primary);
          background: rgba(16, 185, 129, 0.05);
        }

        .tariff-amount {
          font-size: 24px;
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

        .loading-state, .empty-state {
          text-align: center;
          padding: 60px;
          color: var(--text-muted);
          font-style: italic;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
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
          max-width: 600px;
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
        .modal-header button { color: var(--text-muted); }

        form { padding: 24px; }
        .form-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr;
          gap: 20px; 
        }
        
        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .input-group input, .input-group select {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-surface);
          padding: 12px;
          border-radius: 12px;
          color: var(--text-main);
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
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
        }

        .btn-submit {
          flex: 2;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          background: var(--primary);
          color: white;
        }

        /* Utilities */
        .flex { display: flex; }
        .items-center { align-items: center; }
        .flex-1 { flex: 1; }
        .gap-1 { gap: 4px; }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .mt-2 { margin-top: 8px; }
        .font-bold { font-weight: 700; }
        .text-lg { font-size: 1.125rem; }
        .text-primary { color: var(--primary); }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .text-gray-300 { color: #d1d5db; }
        .text-gray-400 { color: #9ca3af; }
        .text-gray-500 { color: #6b7280; }
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
        .rounded-md { border-radius: 0.375rem; }
        .bg-white\\/5 { background-color: rgba(255, 255, 255, 0.05); }
        .border-white\\/10 { border-color: rgba(255, 255, 255, 0.1); }
        .text-red-400 { color: #f87171; }
        .ml-2 { margin-left: 0.5rem; }
        .ml-4 { margin-left: 1rem; }
        .pl-4 { padding-left: 1rem; }
        .border-l { border-left-width: 1px; }
        .whitespace-nowrap { white-space: nowrap; }
        .mb-1 { margin-bottom: 0.25rem; }
        .font-semibold { font-weight: 600; }
      `}</style>
    </div>
  );
}
