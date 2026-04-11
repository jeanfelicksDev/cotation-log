"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit, Trash2, Globe, Calendar, Ship, Home, ArrowRight } from "lucide-react";
import {
  getTariffs, createTariff, deleteTariff, updateTariff, seedTariffs,
  getFreightRates, createFreightRate, deleteFreightRate, updateFreightRate,
  getParameters
} from "@/lib/actions";

type TabType = "maison" | "forwarder";
type ModalType = "maison" | "forwarder" | null;

const EMPTY_TARIFF = { zone: "", description: "", amount: "", type: "Fret", currency: "EUR" };
const EMPTY_RATE = {
  carrier: "", origin: "", destination: "", containerType: "", commodity: "Général",
  amount: "", currency: "EUR",
  validFrom: new Date().toISOString().split("T")[0],
  validTo: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
};

export default function TariffsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("maison");
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Maison state
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [maisonLoading, setMaisonLoading] = useState(true);
  const [maisonSearch, setMaisonSearch] = useState("");
  const [editingTariff, setEditingTariff] = useState<any>(null);
  const [newTariff, setNewTariff] = useState({ ...EMPTY_TARIFF });

  // Forwarder state
  const [rates, setRates] = useState<any[]>([]);
  const [forwarderLoading, setForwarderLoading] = useState(true);
  const [forwarderSearch, setForwarderSearch] = useState("");
  const [editingRate, setEditingRate] = useState<any>(null);
  const [newRate, setNewRate] = useState({ ...EMPTY_RATE });
  const [origins, setOrigins] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);

  // Init
  useEffect(() => {
    const saved = localStorage.getItem("activeTariffTab") as TabType;
    if (saved === "maison" || saved === "forwarder") setActiveTab(saved);
    setIsLoaded(true);
    loadMaison();
    loadForwarder();
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("activeTariffTab", activeTab);
  }, [activeTab, isLoaded]);

  // Close modal on tab switch
  useEffect(() => { setActiveModal(null); }, [activeTab]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = activeModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeModal]);

  async function loadMaison() {
    setMaisonLoading(true);
    const data = await getTariffs();
    setTariffs(data);
    setMaisonLoading(false);
  }

  async function loadForwarder() {
    setForwarderLoading(true);
    const [ratesData, params] = await Promise.all([getFreightRates(), getParameters()]);
    setRates(ratesData);
    setOrigins(params.filter((p: any) => p.category === "origin"));
    setDestinations(params.filter((p: any) => p.category === "destination"));
    setContainers(params.filter((p: any) => p.category === "container"));
    setForwarderLoading(false);
  }

  // Maison handlers
  function openAddMaison() {
    setEditingTariff(null);
    setNewTariff({ ...EMPTY_TARIFF });
    setActiveModal("maison");
  }

  function openEditMaison(t: any) {
    setEditingTariff(t);
    setNewTariff({ zone: t.zone, description: t.description, amount: String(t.amount), type: t.type, currency: t.currency });
    setActiveModal("maison");
  }

  async function handleSubmitMaison(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...newTariff, amount: parseFloat(newTariff.amount) };
      if (editingTariff) {
        const updated = await updateTariff(editingTariff.id, payload);
        setTariffs(tariffs.map(t => t.id === editingTariff.id ? updated : t));
      } else {
        const created = await createTariff(payload);
        setTariffs([created, ...tariffs]);
      }
      setActiveModal(null);
    } catch { alert("Erreur lors de l'opération."); }
  }

  async function handleDeleteMaison(id: string) {
    if (!confirm("Supprimer ce tarif ?")) return;
    await deleteTariff(id);
    setTariffs(tariffs.filter(t => t.id !== id));
  }

  // Forwarder handlers
  function openAddForwarder() {
    setEditingRate(null);
    setNewRate({ ...EMPTY_RATE });
    setActiveModal("forwarder");
  }

  function openEditForwarder(r: any) {
    setEditingRate(r);
    setNewRate({
      carrier: r.carrier, origin: r.origin, destination: r.destination,
      containerType: r.containerType, commodity: r.commodity,
      amount: String(r.amount), currency: r.currency,
      validFrom: new Date(r.validFrom).toISOString().split("T")[0],
      validTo: new Date(r.validTo).toISOString().split("T")[0],
    });
    setActiveModal("forwarder");
  }

  async function handleSubmitForwarder(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...newRate, amount: parseFloat(newRate.amount), validFrom: new Date(newRate.validFrom), validTo: new Date(newRate.validTo) };
      if (editingRate) {
        const updated = await updateFreightRate(editingRate.id, payload);
        setRates(rates.map(r => r.id === editingRate.id ? updated : r));
      } else {
        const created = await createFreightRate(payload);
        setRates([created, ...rates]);
      }
      setActiveModal(null);
    } catch (err: any) { 
      console.error(err);
      alert("Erreur lors de l'opération: " + (err.message || String(err))); 
    }
  }

  async function handleDeleteForwarder(id: string) {
    if (!confirm("Supprimer ce tarif armateur ?")) return;
    await deleteFreightRate(id);
    setRates(rates.filter(r => r.id !== id));
  }

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

  return (
    <div className="tariffs-page">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Grilles Tarifaires</h1>
        <p className="page-subtitle">Visualisez et gérez vos catalogues de prix logistiques.</p>
      </header>

      {/* Tabs */}
      <div className="tabs-wrapper">
        <button
          className={`tab-btn ${activeTab === "maison" ? "tab-active-maison" : ""}`}
          onClick={() => setActiveTab("maison")}
        >
          <Home size={16} />
          <span>Nos Tarifs (Maison)</span>
          {activeTab === "maison" && <motion.div layoutId="tab-line" className="tab-line tab-line-maison" />}
        </button>
        <button
          className={`tab-btn ${activeTab === "forwarder" ? "tab-active-forwarder" : ""}`}
          onClick={() => setActiveTab("forwarder")}
        >
          <Globe size={16} />
          <span>Tarif Armateur (Forwarder)</span>
          {activeTab === "forwarder" && <motion.div layoutId="tab-line" className="tab-line tab-line-forwarder" />}
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === "maison" ? (
          <motion.div key="maison" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
            {/* Maison toolbar */}
            <div className="toolbar">
              <div className="search-wrap">
                <Search size={16} className="search-icon" />
                <input className="search-input" placeholder="Rechercher une zone, description..." value={maisonSearch} onChange={e => setMaisonSearch(e.target.value)} />
              </div>
              <button className="add-btn add-btn-maison" onClick={openAddMaison}>
                <Plus size={16} /> Nouveau Tarif Maison
              </button>
            </div>

            {/* Maison grid */}
            <div className="cards-grid">
              {maisonLoading ? (
                <div className="state-box">Chargement...</div>
              ) : filteredMaison.length === 0 ? (
                <div className="state-box">Aucun tarif maison trouvé.</div>
              ) : filteredMaison.map((t, i) => (
                <motion.div key={t.id} className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className="card-main">
                    <div className="card-type">{t.type}</div>
                    <div className="card-name">{t.zone}</div>
                    <div className="card-desc">{t.description}</div>
                  </div>
                  <div className="card-amount maison-amount">
                    {t.amount.toLocaleString()} {t.currency === "XOF" ? "CFA" : "€"}
                  </div>
                  <div className="card-actions">
                    <button className="icon-btn" onClick={() => openEditMaison(t)}><Edit size={15} /></button>
                    <button className="icon-btn icon-btn-del" onClick={() => handleDeleteMaison(t.id)}><Trash2 size={15} /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="forwarder" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            {/* Forwarder toolbar */}
            <div className="toolbar">
              <div className="search-wrap">
                <Search size={16} className="search-icon" />
                <input className="search-input" placeholder="Rechercher un transporteur, port..." value={forwarderSearch} onChange={e => setForwarderSearch(e.target.value)} />
              </div>
              <button className="add-btn add-btn-forwarder" onClick={openAddForwarder}>
                <Plus size={16} /> Nouveau Tarif Armateur
              </button>
            </div>

            {/* Forwarder grid */}
            <div className="cards-grid">
              {forwarderLoading ? (
                <div className="state-box">Chargement...</div>
              ) : filteredForwarder.length === 0 ? (
                <div className="state-box">Aucun tarif armateur trouvé.</div>
              ) : filteredForwarder.map((r, i) => {
                const expired = new Date(r.validTo) < new Date();
                return (
                  <motion.div key={r.id} className={`card ${expired ? "card-expired" : ""}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="card-main" style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span className="card-name forwarder-name">{r.carrier}</span>
                        <span className="carrier-badge">{r.containerType}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {r.origin} <ArrowRight size={12} /> {r.destination}
                        <span style={{ color: "#6b7280" }}>•</span>
                        <Ship size={13} /> {r.commodity}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={11} /> {new Date(r.validFrom).toLocaleDateString()} – {new Date(r.validTo).toLocaleDateString()}
                        {expired && <span style={{ color: "#f87171", marginLeft: 6, fontWeight: 600 }}>Expiré</span>}
                      </div>
                    </div>
                    <div className="card-amount forwarder-amount">
                      {r.amount.toLocaleString()} {r.currency === "XOF" ? "CFA" : r.currency === "USD" ? "$" : "€"}
                    </div>
                    <div className="card-actions" style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", paddingLeft: 16, marginLeft: 16 }}>
                      <button className="icon-btn" onClick={() => openEditForwarder(r)}><Edit size={15} /></button>
                      <button className="icon-btn icon-btn-del" onClick={() => handleDeleteForwarder(r.id)}><Trash2 size={15} /></button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portal Modal */}
      <TariffModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        editingTariff={editingTariff}
        editingRate={editingRate}
        newTariff={newTariff}
        setNewTariff={setNewTariff}
        newRate={newRate}
        setNewRate={setNewRate}
        onSubmitMaison={handleSubmitMaison}
        onSubmitForwarder={handleSubmitForwarder}
        origins={origins}
        destinations={destinations}
        containers={containers}
      />

      <style jsx>{`
        .tariffs-page { max-width: 960px; margin: 0 auto; }

        .page-header { margin-bottom: 32px; }
        .page-title { font-size: 30px; font-weight: 800; color: #fff; margin-bottom: 6px; }
        .page-subtitle { color: #6b7280; font-size: 14px; }

        .tabs-wrapper {
          display: flex;
          gap: 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 28px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          color: #6b7280;
          font-weight: 500;
          font-size: 14px;
          position: relative;
          transition: color 0.2s;
        }

        .tab-btn:hover { color: #d1d5db; }
        .tab-active-maison { color: #10b981; font-weight: 600; }
        .tab-active-forwarder { color: #a855f7; font-weight: 600; }

        .tab-line {
          position: absolute;
          bottom: -1px;
          left: 0; right: 0;
          height: 2px;
          border-radius: 2px 2px 0 0;
        }
        .tab-line-maison { background: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.5); }
        .tab-line-forwarder { background: #a855f7; box-shadow: 0 0 10px rgba(168,85,247,0.5); }

        .toolbar {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 24px;
        }

        .search-wrap {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          height: 44px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0 14px 0 42px;
          color: #fff;
          font-size: 14px;
          box-sizing: border-box;
        }

        .search-input:focus { outline: none; border-color: rgba(255,255,255,0.2); }
        .search-input::placeholder { color: #4b5563; }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 20px;
          border-radius: 12px;
          border: none;
          box-sizing: border-box;
          font-weight: 600;
          font-size: 14px;
          color: #fff;
          white-space: nowrap;
          cursor: pointer;
          transition: filter 0.2s, transform 0.2s;
        }

        .add-btn:hover { filter: brightness(1.12); transform: translateY(-1px); }

        .add-btn-maison {
          background: #10b981;
          box-shadow: 0 4px 15px rgba(16,185,129,0.35);
        }

        .add-btn-forwarder {
          background: #a855f7;
          box-shadow: 0 4px 15px rgba(168,85,247,0.35);
        }

        .cards-grid { display: flex; flex-direction: column; gap: 12px; }

        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: border-color 0.2s;
        }

        .card:hover { border-color: rgba(255,255,255,0.15); }
        .card-expired { opacity: 0.6; }

        .card-main { flex: 1; min-width: 0; }
        .card-type { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #10b981; text-transform: uppercase; margin-bottom: 2px; }
        .card-name { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .forwarder-name { color: #a855f7; }
        .card-desc { font-size: 13px; color: #6b7280; }

        .card-amount { font-size: 22px; font-weight: 800; white-space: nowrap; }
        .maison-amount { color: #10b981; text-shadow: 0 0 20px rgba(16,185,129,0.4); }
        .forwarder-amount { color: #a855f7; text-shadow: 0 0 20px rgba(168,85,247,0.4); }

        .card-actions { display: flex; gap: 8px; }

        .icon-btn {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover { color: #fff; border-color: rgba(255,255,255,0.2); }
        .icon-btn-del:hover { color: #ef4444; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); }

        .carrier-badge {
          font-size: 11px; font-weight: 600;
          background: rgba(168,85,247,0.15);
          color: #a855f7;
          padding: 2px 8px;
          border-radius: 20px;
          border: 1px solid rgba(168,85,247,0.2);
        }

        .state-box {
          text-align: center;
          padding: 60px;
          color: #4b5563;
          font-style: italic;
          background: rgba(255,255,255,0.01);
          border: 1px dashed rgba(255,255,255,0.07);
          border-radius: 16px;
        }
      `}</style>
    </div>
  );
}

// ─── Portal Modal ─────────────────────────────────────────────────────────────

function TariffModal({ activeModal, onClose, editingTariff, editingRate, newTariff, setNewTariff, newRate, setNewRate, onSubmitMaison, onSubmitForwarder, origins, destinations, containers }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !activeModal) return null;

  const isMaison = activeModal === "maison";
  const color = isMaison ? "#10b981" : "#a855f7";
  const glow = isMaison ? "rgba(16,185,129,0.35)" : "rgba(168,85,247,0.35)";
  const title = isMaison
    ? (editingTariff ? "Modifier Tarif Maison" : "Nouveau Tarif Maison")
    : (editingRate ? "Modifier Tarif Armateur" : "Nouveau Tarif Armateur");

  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 99999, padding: 20,
  };

  const box: React.CSSProperties = {
    background: "#0c0c0c",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    width: "100%", maxWidth: 580,
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: `0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px ${color}22`,
  };

  return createPortal(
    <div style={overlay}>
      <div style={box}>
        <div style={{ padding: "22px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{title}</h2>
          <button onClick={onClose} style={{ color: "#6b7280", cursor: "pointer", display: "flex", padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {isMaison ? (
          <form onSubmit={onSubmitMaison} style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <MField label="Zone / Destination">
                <MInput value={newTariff.zone} onChange={(v: string) => setNewTariff({ ...newTariff, zone: v })} placeholder="ex: Europe, Asie..." required />
              </MField>
              <MField label="Type de tarif">
                <MSelect value={newTariff.type} onChange={(v: string) => setNewTariff({ ...newTariff, type: v })}
                  options={[{ v: "Fret", l: "Fret" }, { v: "THC", l: "THC" }, { v: "Surestaries", l: "Surestaries" }, { v: "Autre", l: "Autre" }]} />
              </MField>
              <div style={{ gridColumn: "1/-1" }}>
                <MField label="Description détaillée">
                  <MInput value={newTariff.description} onChange={(v: string) => setNewTariff({ ...newTariff, description: v })} placeholder="Détails du service..." required />
                </MField>
              </div>
              <MField label="Montant">
                <MInput type="number" value={newTariff.amount} onChange={(v: string) => setNewTariff({ ...newTariff, amount: v })} required />
              </MField>
              <MField label="Devise">
                <MSelect value={newTariff.currency} onChange={(v: string) => setNewTariff({ ...newTariff, currency: v })}
                  options={[{ v: "EUR", l: "Euro (€)" }, { v: "XOF", l: "FCFA (CFA)" }]} />
              </MField>
            </div>
            <MFooter onClose={onClose} isEdit={!!editingTariff} color={color} glow={glow} />
          </form>
        ) : (
          <form onSubmit={onSubmitForwarder} style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <MField label="Compagnie Maritime / Armateur">
                  <MInput value={newRate.carrier} onChange={(v: string) => setNewRate({ ...newRate, carrier: v })} required />
                </MField>
              </div>
              <MField label="Port de Départ">
                <MInput list="p-orig" value={newRate.origin} onChange={(v: string) => setNewRate({ ...newRate, origin: v })} required />
                <datalist id="p-orig">{origins.map((o: any) => <option key={o.id} value={o.value} />)}</datalist>
              </MField>
              <MField label="Port d'Arrivée">
                <MInput list="p-dest" value={newRate.destination} onChange={(v: string) => setNewRate({ ...newRate, destination: v })} required />
                <datalist id="p-dest">{destinations.map((d: any) => <option key={d.id} value={d.value} />)}</datalist>
              </MField>
              <MField label="Type de Conteneur">
                <MSelect value={newRate.containerType} onChange={(v: string) => setNewRate({ ...newRate, containerType: v })} required
                  options={[{ v: "", l: "Sélectionner..." }, ...containers.map((c: any) => ({ v: c.value, l: c.label }))]} />
              </MField>
              <MField label="Marchandise">
                <MInput value={newRate.commodity} onChange={(v: string) => setNewRate({ ...newRate, commodity: v })} required />
              </MField>
              <MField label="Démarrage Validité">
                <MInput type="date" value={newRate.validFrom} onChange={(v: string) => setNewRate({ ...newRate, validFrom: v })} required />
              </MField>
              <MField label="Fin Validité">
                <MInput type="date" value={newRate.validTo} onChange={(v: string) => setNewRate({ ...newRate, validTo: v })} required />
              </MField>
              <MField label="Montant (Achat)">
                <MInput type="number" step="0.01" value={newRate.amount} onChange={(v: string) => setNewRate({ ...newRate, amount: v })} required />
              </MField>
              <MField label="Devise">
                <MSelect value={newRate.currency} onChange={(v: string) => setNewRate({ ...newRate, currency: v })}
                  options={[{ v: "EUR", l: "EUR (€)" }, { v: "USD", l: "USD ($)" }, { v: "XOF", l: "XOF (CFA)" }]} />
              </MField>
            </div>
            <MFooter onClose={onClose} isEdit={!!editingRate} color={color} glow={glow} />
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
  padding: "10px 13px", borderRadius: 10, color: "#fff", fontSize: 14, boxSizing: "border-box",
};

function MInput({ value, onChange, placeholder, type = "text", required, list, step }: any) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value as string)}
    placeholder={placeholder} required={required} list={list} step={step} style={inputStyle} />;
}

function MSelect({ value, onChange, options, required }: any) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as string)} required={required} style={{ ...inputStyle, cursor: "pointer" }}>
      {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function MField({ label, children }: any) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</label>
      {children}
    </div>
  );
}

function MFooter({ onClose, isEdit, color, glow }: any) {
  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 12 }}>
      <button type="button" onClick={onClose}
        style={{ flex: 1, padding: "12px", borderRadius: 11, fontWeight: 600, color: "#6b7280", background: "rgba(255,255,255,0.05)", cursor: "pointer" }}>
        Annuler
      </button>
      <button type="submit"
        style={{ flex: 2, padding: "12px", borderRadius: 11, fontWeight: 700, background: color, color: "#fff", boxShadow: `0 4px 15px ${glow}`, cursor: "pointer" }}>
        {isEdit ? "Enregistrer" : "Créer"}
      </button>
    </div>
  );
}
