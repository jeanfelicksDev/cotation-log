"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit, Trash2, X, DollarSign } from "lucide-react";
import { 
  getTariffs, 
  createTariff, 
  deleteTariff, 
  seedTariffs 
} from "@/lib/actions";

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTariff, setNewTariff] = useState({
    zone: "",
    description: "",
    amount: "",
    type: "Fret",
    currency: "EUR"
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    await seedTariffs();
    const data = await getTariffs();
    setTariffs(data);
    setLoading(false);
  };

  const handleAddTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createTariff({
        ...newTariff,
        amount: parseFloat(newTariff.amount)
      });
      setTariffs([...tariffs, created]);
      setIsModalOpen(false);
      setNewTariff({ zone: "", description: "", amount: "", type: "Fret", currency: "EUR" });
    } catch (err) {
      alert("Erreur lors de la création du tarif.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce tarif ?")) return;
    try {
      await deleteTariff(id);
      setTariffs(tariffs.filter(t => t.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const filteredTariffs = tariffs.filter(t => 
    t.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tariffs-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Grilles Tarifaires</h1>
          <p className="page-subtitle">Gérez vos tarifs standards pour automatiser les cotations.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Ajouter un Tarif</span>
        </button>
      </header>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Rechercher par zone ou description..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="tariffs-grid">
        {loading ? (
          <div className="loading-state">Chargement des tarifs...</div>
        ) : (
          filteredTariffs.map((tariff, i) => (
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
                {tariff.amount.toLocaleString()} {tariff.currency === "XOF" ? "CFA" : tariff.currency === "USD" ? "$" : "€"}
              </div>
              <div className="tariff-actions">
                <button className="icon-btn" onClick={() => alert("Edition en cours de développement")}>
                  <Edit size={16} />
                </button>
                <button className="icon-btn delete" onClick={() => handleDelete(tariff.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
        {!loading && filteredTariffs.length === 0 && (
          <div className="empty-state">Aucun tarif trouvé.</div>
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
                <h2>Nouveau Tarif</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTariff}>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Zone / Trajet</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Shanghai -> Lomé" 
                      required
                      value={newTariff.zone}
                      onChange={e => setNewTariff({...newTariff, zone: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Description</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Fret Maritime 20' Dry" 
                      required
                      value={newTariff.description}
                      onChange={e => setNewTariff({...newTariff, description: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Montant</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      required
                      value={newTariff.amount}
                      onChange={e => setNewTariff({...newTariff, amount: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Devise</label>
                    <select 
                      value={newTariff.currency}
                      onChange={e => setNewTariff({...newTariff, currency: e.target.value})}
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="XOF">XOF (CFA)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Type</label>
                    <select 
                      value={newTariff.type}
                      onChange={e => setNewTariff({...newTariff, type: e.target.value})}
                    >
                      <option value="Fret">Fret</option>
                      <option value="Local">Local</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
                  <button type="submit" className="btn-submit">Valider le Tarif</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
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
          max-width: 500px;
          overflow: hidden;
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
        .form-grid { display: grid; gap: 20px; }
        
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
          padding: 24px;
          display: flex;
          gap: 12px;
          border-top: 1px solid var(--border-surface);
          background: rgba(255, 255, 255, 0.01);
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
      `}</style>
    </div>
  );
}
