"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Calculator, 
  Save, 
  FileText,
  AlertCircle,
  MapPin,
  Box,
  Package,
  Minus,
  Globe
} from "lucide-react";
import { clsx } from "clsx";
import { generateQuotationPDF } from "@/lib/export-pdf";
import { getParameters, saveQuotation, getQuotationById, updateQuotation, findMatchingFreightRate } from "@/lib/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';

type CostLine = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  type: string; // Changed from enum to string for dynamic support
  isForwarding?: boolean;
  buyAmount?: number;
  marginRate?: number;
};

type Parameter = {
  id: string;
  category: string;
  label: string;
  value: string;
  reasons?: { id: string; label: string }[];
};

function QuoteForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [step, setStep] = useState(parseInt(searchParams.get("step") || "1"));
  const [client, setClient] = useState("");
  const [direction, setDirection] = useState<"import" | "export">("import");
  const [mode, setMode] = useState<"sea" | "air">("sea");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [commodity, setCommodity] = useState("");
  const [containers, setContainers] = useState<{ id: string; type: string; quantity: number }[]>([
    { id: "1", type: "20GP", quantity: 1 }
  ]);
  const [baseCosts, setBaseCosts] = useState<CostLine[]>([]);
  const [marge, setMarge] = useState(15); // Percentage
  const [dbParams, setDbParams] = useState<Record<string, Parameter[]>>({});
  const [status, setStatus] = useState("Rate under negotiation");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [clientResponseDate, setClientResponseDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggestedRate, setSuggestedRate] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (origin && destination && commodity && containers.length > 0) {
      const fetchRate = async () => {
        const rate = await findMatchingFreightRate(origin, destination, containers[0].type, commodity);
        setSuggestedRate(rate);
      };
      fetchRate();
    } else {
      setSuggestedRate(null);
    }
  }, [origin, destination, commodity, containers]);
  useEffect(() => {
    loadParams();
    if (editId) {
      loadQuotation(editId);
    }
    
    // Check for explicit step or status in URL
    const urlStep = searchParams.get("step");
    const urlStatus = searchParams.get("status");
    if (urlStep) setStep(parseInt(urlStep));
    if (urlStatus) setStatus(urlStatus);
  }, [editId, searchParams]);

  const loadQuotation = async (id: string) => {
    const q = await getQuotationById(id);
    if (q) {
      setClient(q.clientName || "");
      setDirection((q.direction as any) || "import");
      setOrigin(q.origin || "");
      setDestination(q.destination || "");
      setCommodity(q.commodity || "");
      setStatus(q.status || "Rate under negotiation");
      setReason(q.reason || "");
      setComments(q.comments || "");
      setClientResponseDate(q.clientResponseDate ? new Date(q.clientResponseDate).toISOString().split('T')[0] : "");
      setMode("sea");
      setBaseCosts(q.items.map((i: any) => ({
        id: i.id,
        description: i.description,
        amount: i.amount,
        currency: i.currency,
        type: i.type,
        isForwarding: i.isForwarding,
        buyAmount: i.buyAmount,
        marginRate: i.marginRate
      })));
      if (q.containers && q.containers.length > 0) {
        setContainers(q.containers.map((c: any) => ({
          id: c.id,
          type: c.type,
          quantity: c.quantity
        })));
      }
      if (q.totalBase && q.totalFinal) {
         setMarge(Math.round(((q.totalFinal - q.totalBase) / q.totalBase) * 100));
      }
    }
  };

  const loadParams = async () => {
    const data = await getParameters();
    const grouped = data.reduce((acc, curr) => {
      // @ts-ignore
      if (!acc[curr.category]) acc[curr.category] = [];
      // @ts-ignore
      acc[curr.category].push(curr);
      return acc;
    }, {} as Record<string, Parameter[]>);
    setDbParams(grouped);
  };

  const addCostLine = () => {
    const newLine: CostLine = {
      id: Math.random().toString(36).substr(2, 9),
      description: "",
      amount: 0,
      currency: "EUR",
      type: mode === "sea" ? "fret" : "fret_air",
      isForwarding: false,
      buyAmount: 0,
      marginRate: 15
    };
    setBaseCosts([...baseCosts, newLine]);
  };

  const applyFreightRate = (rate: any) => {
    const newLine: CostLine = {
      id: Math.random().toString(36).substr(2, 9),
      description: `Fret Maritime - ${rate.carrier}`,
      amount: rate.amount * (1 + 15 / 100), // Default 15% margin
      currency: rate.currency,
      type: "fret",
      isForwarding: true,
      buyAmount: rate.amount,
      marginRate: 15
    };
    setBaseCosts([...baseCosts, newLine]);
    setSuggestedRate(null); // Clear after applying
  };

  const removeCostLine = (id: string) => {
    setBaseCosts(baseCosts.filter(line => line.id !== id));
  };

  const updateCostLine = (id: string, field: keyof CostLine, value: any) => {
    setBaseCosts(baseCosts.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        if (updated.isForwarding) {
          updated.amount = (Number(updated.buyAmount) || 0) * (1 + (Number(updated.marginRate) || 0) / 100);
        }
        return updated;
      }
      return line;
    }));
  };

  const totalBase = baseCosts.reduce((acc, line) => {
    if (line.isForwarding) return acc + (Number(line.buyAmount) || 0);
    return acc + (Number(line.amount) || 0);
  }, 0);

  const totalWithMarge = baseCosts.reduce((acc, line) => {
    if (line.isForwarding) return acc + (Number(line.amount) || 0);
    return acc + (Number(line.amount) || 0) * (1 + marge / 100);
  }, 0);

  const getStatusColor = (statusName: string) => {
    switch (statusName) {
      case "Opportunity won": return "#10b981"; // Green
      case "Opportunity Missed": return "#ef4444"; // Red
      case "Rate under negotiation": return "#f59e0b"; // Orange/Amber
      case "Draft": return "#6b7280"; // Grey
      default: return "#3b82f6"; // Blue
    }
  };

  const handleSave = async () => {
    const currentStatusObj = dbParams.status?.find(p => p.label === status);
    const availableReasons = currentStatusObj?.reasons || [];
    
    if (availableReasons.length > 0 && !reason) {
      alert(`Veuillez sélectionner une raison pour le statut "${status}".`);
      return;
    }

    setSaving(true);
    const localId = editId || uuidv4();
    
    const data = {
      clientName: client,
      direction,
      origin,
      destination,
      commodity,
      totalBase,
      totalFinal: totalWithMarge,
      margin: totalWithMarge - totalBase,
      status,
      reason,
      comments,
      clientResponseDate,
      items: baseCosts,
      containers,
      mode: mode as string,
      reference: editId ? "" : `QT-${new Date().getTime()}` // Placeholder ref for local
    };

    try {
      // 1. Save locally first
      await db.quotations.put({
        ...data,
        id: localId,
        remoteId: editId || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSynced: false
      } as any);

      // 2. Try the server
      if (navigator.onLine) {
        if (editId) {
          await updateQuotation(editId, data);
        } else {
          await saveQuotation(data);
        }
        // Mark as synced if successful
        await db.quotations.update(localId, { isSynced: true });
        alert(`Cotation ${editId ? "modifiée" : "enregistrée"} avec succès !`);
      } else {
        // Queue for sync later
        await db.syncQueue.add({
          type: editId ? 'UPDATE' : 'CREATE',
          entityType: 'QUOTATION',
          entityId: localId,
          data,
          timestamp: Date.now()
        });
        alert("Mode hors-ligne : Votre offre est enregistrée localement et sera synchronisée dès le retour de la connexion.");
      }
      
      router.push("/tracking");
    } catch (err) {
      console.error("Save error:", err);
      // Even if server fails, we have it locally if we reach here
      // But usually network errors are handled above with navigator.onLine
      alert("Note: L'enregistrement sur le serveur a échoué, mais l'offre est conservée localement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quote-builder">
      <header className="page-header">
        <div className="breadcrumb">
          <span>Cotations</span>
          <ChevronRight size={14} />
          <span className="current">{editId ? "Modifier l'Offre" : "Nouvelle Offre"}</span>
        </div>
        <h1 className="page-title">{editId ? "Modifier la Cotation" : "Créer une Cotation"}</h1>
      </header>

      <div className="wizard-stepper">
        <div className={clsx("step-node", step >= 1 && "active")}>1. Informations</div>
        <div className="step-divider" />
        <div className={clsx("step-node", step >= 2 && "active")}>2. Coûts & Calculs</div>
        <div className="step-divider" />
        <div className={clsx("step-node", step >= 3 && "active")}>3. Récapitulatif</div>
      </div>

      <div className="builder-content">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="step-container"
            >
              <div className="form-section">
                <h3 className="section-title client">Détails du Client</h3>
                <div className="input-group">
                  <label>Nom du Client / Société</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Sodiam Sarl" 
                    value={client} 
                    onChange={e => setClient(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="grid-2">
                  <div className="input-group">
                    <label>Flux Logistique</label>
                    <div className="toggle-group sm">
                      <button 
                        className={clsx("toggle-btn", direction === "import" && "active")}
                        onClick={() => setDirection("import")}
                      >
                        Import
                      </button>
                      <button 
                        className={clsx("toggle-btn", direction === "export" && "active")}
                        onClick={() => setDirection("export")}
                      >
                        Export
                      </button>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Mode de Transport</label>
                    <div className="toggle-group sm">
                      {dbParams.mode?.map(p => (
                        <button 
                          key={p.id}
                          className={clsx("toggle-btn", mode === p.value && "active")}
                          onClick={() => setMode(p.value as any)}
                        >
                          {p.label}
                        </button>
                      ))}
                      {(!dbParams.mode || dbParams.mode.length === 0) && (
                        <>
                          <button 
                            className={clsx("toggle-btn", mode === "sea" && "active")}
                            onClick={() => setMode("sea")}
                          >
                            Maritime
                          </button>
                          <button 
                            className={clsx("toggle-btn", mode === "air" && "active")}
                            onClick={() => setMode("air")}
                          >
                            Aérien
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title travel">Itinéraire & Marchandise</h3>
                <div className="grid-2">
                  <div className="input-group">
                    <label><MapPin size={14} /> Origine (Port/Aéroport)</label>
                    <input 
                      type="text" 
                      list="origins-list"
                      placeholder="Ex: Shanghai (CNSHA)" 
                      value={origin} 
                      onChange={e => setOrigin(e.target.value)}
                    />
                    <datalist id="origins-list">
                      {dbParams.origin?.map(p => <option key={p.id} value={p.label} />)}
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label><MapPin size={14} className="rotate-180" /> Destination</label>
                    <input 
                      type="text" 
                      list="destinations-list"
                      placeholder="Ex: Lomé (TGLFW)" 
                      value={destination} 
                      onChange={e => setDestination(e.target.value)}
                    />
                    <datalist id="destinations-list">
                      {dbParams.destination?.map(p => <option key={p.id} value={p.label} />)}
                    </datalist>
                  </div>
                </div>
                <div className="input-group mt-16">
                  <label><Package size={14} /> Nature de la Marchandise</label>
                  <input 
                    type="text" 
                    list="commodities-list"
                    placeholder="Ex: Pièces détachées" 
                    value={commodity} 
                    onChange={e => setCommodity(e.target.value)}
                  />
                  <datalist id="commodities-list">
                    {dbParams.commodity?.map(p => <option key={p.id} value={p.label} />)}
                  </datalist>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title equipment">Équipement (Conteneurs)</h3>
                  <button 
                    className="btn-add-small"
                    onClick={() => setContainers([...containers, { id: Math.random().toString(), type: "40HC", quantity: 1 }])}
                  >
                    <Plus size={14} /> Ajouter un type
                  </button>
                </div>
                <div className="container-list">
                  {containers.map((cnt, idx) => (
                    <div key={cnt.id} className="container-row">
                      <select 
                        value={cnt.type}
                        onChange={e => {
                          const newCnt = [...containers];
                          newCnt[idx].type = e.target.value;
                          setContainers(newCnt);
                        }}
                      >
                        {dbParams.container?.map(p => (
                          <option key={p.id} value={p.value}>{p.label}</option>
                        ))}
                        {(!dbParams.container || dbParams.container.length === 0) && (
                          <>
                            <option value="20GP">20' Dry Standard</option>
                            <option value="40HC">40' High Cube</option>
                          </>
                        )}
                      </select>
                      <div className="qty-input">
                        <button onClick={() => {
                          const newCnt = [...containers];
                          newCnt[idx].quantity = Math.max(1, newCnt[idx].quantity - 1);
                          setContainers(newCnt);
                        }}><Minus size={14} /></button>
                        <span>{cnt.quantity}</span>
                        <button onClick={() => {
                          const newCnt = [...containers];
                          newCnt[idx].quantity += 1;
                          setContainers(newCnt);
                        }}><Plus size={14} /></button>
                      </div>
                      {containers.length > 1 && (
                        <button className="btn-delete-small" onClick={() => {
                          setContainers(containers.filter(c => c.id !== cnt.id));
                        }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="nav-actions">
                <button 
                  className={clsx("btn-next", (!client || !origin || !destination || !commodity) && "disabled")}
                  onClick={() => {
                    if (client && origin && destination && commodity) {
                      setStep(2);
                    }
                  }}
                  disabled={!client || !origin || !destination || !commodity}
                >
                  Continuer <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="step-container"
            >
              <div className="form-section">
                <div className="section-header">
                  <h3>Lignes de Coûts</h3>
                  <button className="btn-add" onClick={addCostLine}>
                    <Plus size={16} /> Ajouter une ligne
                  </button>
                </div>

                <div className="costs-list">
                  <AnimatePresence>
                    {suggestedRate && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="suggestion-banner"
                      >
                        <div className="suggestion-icon">
                          <Globe size={20} color="#38bdf8" />
                        </div>
                        <div className="suggestion-text">
                          <p className="title">Taux négocié trouvé !</p>
                          <p className="desc">Un tarif spécial avec <strong>{suggestedRate.carrier}</strong> est disponible pour ce trajet.</p>
                        </div>
                        <div className="suggestion-price">
                          {suggestedRate.amount.toLocaleString()} {suggestedRate.currency}
                        </div>
                        <button className="btn-apply-suggestion" onClick={() => applyFreightRate(suggestedRate)}>
                          Appliquer
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {baseCosts.length === 0 && !suggestedRate && (
                    <div className="empty-state">
                      <AlertCircle size={32} />
                      <p>Aucun coût ajouté. Commencez par ajouter le fret ou les frais locaux.</p>
                    </div>
                  )}
                  {baseCosts.map((line) => (
                    <div key={line.id} className="cost-item-wrapper">
                      <div className="cost-row">
                        <select 
                          value={line.type} 
                          onChange={e => updateCostLine(line.id, "type", e.target.value)}
                        >
                          {dbParams.cost_type?.map(p => (
                            <option key={p.id} value={p.value}>{p.label}</option>
                          ))}
                          {(!dbParams.cost_type || dbParams.cost_type.length === 0) && (
                            <>
                              <option value="fret">Fret Maritime</option>
                              <option value="thc">THC / Manutation</option>
                              <option value="other">Autre</option>
                            </>
                          )}
                        </select>
                        <input 
                          type="text" 
                          placeholder="Description (ex: Ocean Freight)"
                          value={line.description}
                          onChange={e => updateCostLine(line.id, "description", e.target.value)}
                        />
                        <div className="amount-input">
                          <input 
                            type="number" 
                            placeholder={line.isForwarding ? "Auto" : "0.00"}
                            value={line.isForwarding ? (line.buyAmount ? (line.buyAmount * (1 + (line.marginRate || 0)/100)).toFixed(2) : "") : (line.amount || "")}
                            onChange={e => updateCostLine(line.id, "amount", parseFloat(e.target.value))}
                            disabled={line.isForwarding}
                          />
                          <select 
                            className="currency-select"
                            value={line.currency} 
                            onChange={e => updateCostLine(line.id, "currency", e.target.value)}
                          >
                            {dbParams.currency?.map(p => (
                              <option key={p.id} value={p.value}>{p.value.toUpperCase()}</option>
                            ))}
                            {(!dbParams.currency || dbParams.currency.length === 0) && (
                              <option value="EUR">EUR</option>
                            )}
                          </select>
                        </div>
                        <button className="btn-delete" onClick={() => removeCostLine(line.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {(line.type === "fret" || line.type === "fret_air") && (
                        <div className="forwarding-panel">
                          <label className="fwd-toggle">
                            <input 
                              type="checkbox" 
                              checked={!!line.isForwarding}
                              onChange={e => updateCostLine(line.id, "isForwarding", e.target.checked)}
                            />
                            <span>Activer option Freight Forwarding (Achat/Marge)</span>
                          </label>

                          {line.isForwarding && (
                            <div className="fwd-details">
                              <div className="fwd-field">
                                <label>Prix d'Achat Négocié</label>
                                <div className="amount-input">
                                  <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={line.buyAmount || ""}
                                    onChange={e => updateCostLine(line.id, "buyAmount", parseFloat(e.target.value))}
                                  />
                                  <span className="currency-label">{line.currency.toUpperCase()}</span>
                                </div>
                              </div>
                              <div className="fwd-field margin">
                                <label>Marge Commerciale</label>
                                <div className="amount-input">
                                  <input 
                                    type="number" 
                                    placeholder="15"
                                    value={line.marginRate || ""}
                                    onChange={e => updateCostLine(line.id, "marginRate", parseFloat(e.target.value))}
                                  />
                                  <span>%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="calculation-section">
                <div className="calc-card">
                  <h4>Automatisations</h4>
                  <div className="input-group">
                    <label>Marge Commerciale (%)</label>
                    <input 
                      type="range" min="0" max="50" step="0.5"
                      value={marge}
                      onChange={e => setMarge(parseFloat(e.target.value))}
                    />
                    <div className="range-value">{marge}%</div>
                  </div>
                  
                  <div className="divider" />
                  
                  <div className="totaux">
                    <div className="total-row">
                      <span>Total Coût de Revient</span>
                      <span>{totalBase.toLocaleString()} €</span>
                    </div>
                    <div className="total-row primary">
                      <span>Total Offre Client</span>
                      <span>{totalWithMarge.toLocaleString()} €</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nav-actions">
                <button className="btn-back" onClick={() => setStep(1)}>
                  <ChevronLeft size={18} /> Retour
                </button>
                <button className="btn-next" onClick={() => setStep(3)}>
                  Vérifier <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="step-container summary"
            >
              <div className="summary-card">
                <div className="summary-header">
                  <FileText size={40} color="#10b981" />
                  <h2>Récapitulatif de l'Offre</h2>
                </div>
                
                <div className="summary-details grid-3">
                  <div className="detail-item">
                    <label>Client</label>
                    <p>{client || "Client non spécifié"}</p>
                  </div>
                  <div className="detail-item">
                    <label>Origine</label>
                    <p>{origin}</p>
                  </div>
                  <div className="detail-item">
                    <label>Destination</label>
                    <p>{destination}</p>
                  </div>
                  <div className="detail-item">
                    <label>Marchandise</label>
                    <p>{commodity}</p>
                  </div>
                  <div className="detail-item">
                    <label>Flux / Mode</label>
                    <p className="capitalize">{direction} ({mode === "sea" ? "Maritime" : "Aérien"})</p>
                  </div>
                  <div className="detail-item">
                    <label>Équipement (Total)</label>
                    <p>{containers.map(c => `${c.quantity}x${c.type}`).join(" + ")}</p>
                  </div>
                <div className="status-container">
                  <div className="detail-item">
                    <label>Statut</label>
                    <select 
                      className="status-summary-select"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      {dbParams.status?.map(p => (
                        <option key={p.id} value={p.label}>{p.label}</option>
                      ))}
                      {!dbParams.status?.some(p => p.label === "Rate under negotiation") && (
                        <option value="Rate under negotiation">Rate under negotiation</option>
                      )}
                    </select>
                  </div>

                  <div className="detail-item">
                    <label>Date Retour</label>
                    <input 
                      type="date"
                      className="client-date-input"
                      value={clientResponseDate}
                      onChange={e => setClientResponseDate(e.target.value)}
                    />
                  </div>
                </div>
                </div>

                {/* Reasons Badges */}
                {dbParams.status?.find(p => p.label === status)?.reasons && dbParams.status?.find(p => p.label === status)!.reasons!.length > 0 && (
                  <div className="reasons-section">
                    <label className="reasons-label">Motif / Raison (Obligatoire)</label>
                    <div className="reasons-badges">
                      {dbParams.status?.find(p => p.label === status)?.reasons?.map((r: any) => (
                        <button
                          key={r.id}
                          className={clsx("reason-badge", reason === r.label && "active")}
                          onClick={() => setReason(r.label === reason ? "" : r.label)}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditional Comments for "Out Martket" */}
                {(reason === "Out Market" || reason === "Out Martket") && (
                  <div className="comments-section">
                    <label className="comments-label">Détails / Commentaires (Précisez la raison)</label>
                    <textarea
                      className="comments-textarea"
                      placeholder="Saisissez vos commentaires ici..."
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                    />
                  </div>
                )}

                <div className="summary-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Type</th>
                        <th className="right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baseCosts.map(line => (
                        <tr key={line.id}>
                          <td>{line.description || "Frais sans description"}</td>
                          <td>{line.type.toUpperCase()}</td>
                          <td className="right">{line.amount.toLocaleString()} €</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2}>Marge ({marge}%)</td>
                        <td className="right">{(totalWithMarge - totalBase).toLocaleString()} €</td>
                      </tr>
                      <tr className="grand-total">
                        <td colSpan={2}>Total Final TTC</td>
                        <td className="right">{totalWithMarge.toLocaleString()} €</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="final-actions">
                  <button className="btn-back" onClick={() => setStep(2)}>Modifier</button>
                  <button 
                    className="btn-save" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save size={18} /> {saving ? "Enregistrement..." : "Enregistrer l'offre"}
                  </button>
                  <button 
                    className="btn-export"
                    onClick={() => generateQuotationPDF({
                      client,
                      direction,
                      mode,
                      origin,
                      destination,
                      commodity,
                      containers,
                      items: baseCosts.map(item => ({
                        ...item,
                        amount: item.isForwarding ? item.amount : item.amount * (1 + marge / 100)
                      })),
                      totalFinal: totalWithMarge
                    })}
                  >
                    <FileText size={18} /> Générer PDF
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .quote-builder {
          max-width: 900px;
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
          margin-bottom: 32px;
        }

        .wizard-stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 40px;
        }

        .step-node {
          padding: 8px 16px;
          border-radius: 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border-surface);
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 600;
          transition: var(--transition-smooth);
        }

        .step-node.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 0 15px var(--primary-glow);
        }

        .step-divider {
          width: 40px;
          height: 1px;
          background: var(--border-surface);
        }

        .step-container {
          background: var(--bg-surface);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-surface);
          border-radius: 24px;
          padding: 32px;
        }

        .form-section {
          margin-bottom: 32px;
        }

        .form-section h3 {
          font-size: 18px;
          margin-bottom: 16px;
          color: var(--text-main);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .amount-input select.currency-select {
          background: rgba(255, 255, 255, 0.05); /* Add subtle background to make it look clickable */
          border-left: 1px solid var(--border-surface);
          border-radius: 0 12px 12px 0;
          color: var(--primary);
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          width: 80px;
          padding: 0 8px;
          height: 100%;
          margin-left: -12px; /* Pull into the input area if desired, or just keep side-by-side */
          z-index: 2;
        }

        .currency-label {
          font-weight: 700;
          font-size: 11px;
          color: var(--text-dim);
        }

        .rotate-180 { transform: rotate(180deg); }

        input[type="text"],
        input[type="number"],
        select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-surface);
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text-main);
          font-size: 15px;
          transition: var(--transition-smooth);
        }

        input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .toggle-group {
          display: flex;
          gap: 12px;
        }

        .toggle-btn {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-surface);
          color: var(--text-dim);
          font-weight: 600;
          transition: var(--transition-smooth);
        }

        .toggle-btn.active {
          background: rgba(16, 185, 129, 0.1);
          border-color: var(--primary);
          color: var(--primary);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .btn-add {
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cost-item-wrapper {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-surface);
          border-radius: 14px;
          padding: 8px;
          margin-bottom: 12px;
          animation: slideIn 0.3s ease;
        }

        .cost-row {
          display: grid;
          grid-template-columns: 180px 1fr 200px 48px;
          gap: 12px;
        }

        .forwarding-panel {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed var(--border-surface);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .fwd-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: var(--primary);
        }

        .fwd-toggle input {
          accent-color: var(--primary);
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .fwd-details {
          display: flex;
          gap: 16px;
          background: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 10px;
        }

        .fwd-field {
          flex: 1;
        }

        .fwd-field.margin {
          max-width: 120px;
        }

        .fwd-field label {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .amount-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .amount-input input {
          flex: 1;
          min-width: 0;
          padding-right: 44px; /* Space for the absolute span or relative select */
          border-radius: 12px;
        }

        .amount-input span {
          position: absolute;
          right: 14px;
          font-size: 11px;
          font-weight: 700;
          color: var(--primary);
          pointer-events: none;
        }

        .btn-delete {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
          transition: var(--transition-smooth);
        }

        .btn-delete:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
          border: 2px dashed var(--border-surface);
          border-radius: 16px;
        }

        .calculation-section {
          margin-top: 40px;
        }

        .calc-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          padding: 24px;
          border: 1px solid var(--border-surface);
        }

        .calc-card h4 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
          color: var(--text-dim);
        }

        .range-value {
          margin-top: 8px;
          font-weight: 700;
          color: var(--primary);
          font-size: 18px;
        }

        .divider {
          height: 1px;
          background: var(--border-surface);
          margin: 24px 0;
        }

        .totaux {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          color: var(--text-dim);
        }

        .total-row.primary {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-main);
        }

        .nav-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          gap: 16px;
        }

        .btn-next {
          background: var(--primary);
          color: white;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          box-shadow: 0 4px 15px var(--primary-glow);
        }

        .btn-back {
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 700;
          color: var(--text-main);
          border: 1px solid var(--border-surface);
        }

        .summary-card {
          text-align: left;
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .summary-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        .detail-item label {
          display: block;
          margin-bottom: 4px;
        }

        .detail-item p {
          font-size: 18px;
          font-weight: 700;
        }

        .summary-table {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--border-surface);
          margin-bottom: 32px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: rgba(255, 255, 255, 0.05);
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-surface);
          font-size: 14px;
        }

        .right { text-align: right; }

        tfoot td {
          background: rgba(255, 255, 255, 0.02);
          font-weight: 600;
        }

        .grand-total {
          font-size: 18px;
          font-weight: 800;
          color: var(--primary);
        }

        .final-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-save {
          background: #3b82f6;
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-export {
          background: var(--accent);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .capitalize { text-transform: capitalize; }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        .mt-16 { margin-top: 16px; }

        .toggle-group.sm .toggle-btn {
          padding: 8px 12px;
          font-size: 13px;
        }

        .btn-add-small {
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .container-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(255, 255, 255, 0.02);
          padding: 16px;
          border-radius: 16px;
          border: 1px solid var(--border-surface);
        }

        .container-row {
          display: grid;
          grid-template-columns: 1fr 120px 40px;
          gap: 12px;
          align-items: center;
        }

        .qty-input {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 12px;
          border-radius: 10px;
          border: 1px solid var(--border-surface);
        }

        .qty-input span {
          width: 20px;
          text-align: center;
          font-weight: 700;
        }

        .qty-input button {
          color: var(--text-dim);
          transition: var(--transition-smooth);
        }

        .qty-input button:hover {
          color: var(--primary);
        }

        .btn-delete-small {
          color: #ef4444;
          opacity: 0.6;
          transition: var(--transition-smooth);
        }

        .btn-delete-small:hover {
          opacity: 1;
        }

        .disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(1);
        }

        .rotate-180 { transform: rotate(180deg); }

        /* Suggestion Banner */
        .suggestion-banner {
          background: linear-gradient(90deg, rgba(56, 189, 248, 0.1), rgba(16, 185, 129, 0.1));
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
        }

        .suggestion-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: #38bdf8;
        }

        .suggestion-icon {
          width: 40px;
          height: 40px;
          background: rgba(56, 189, 248, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .suggestion-text {
          flex: 1;
        }

        .suggestion-text .title {
          font-weight: 700;
          font-size: 14px;
          color: #38bdf8;
          margin-bottom: 2px;
        }

        .suggestion-text .desc {
          font-size: 13px;
          color: var(--text-dim);
        }

        .suggestion-price {
          font-size: 18px;
          font-weight: 800;
          color: #10b981;
        }

        .status-summary-select {
          flex: 1;
          padding: 8px 12px;
          border-radius: 12px;
          background: #000000;
          border: 1px solid var(--border-surface);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .status-summary-select option {
          background: #000000;
          color: #ffffff;
        }

        .status-summary-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .btn-apply-suggestion {
          background: #38bdf8;
          color: white;
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
        }

        .btn-apply-suggestion:hover {
          background: #0ea5e9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(56, 189, 248, 0.4);
        }
        .section-title {
          font-size: 18px;
          margin-bottom: 16px;
          font-weight: 700;
          padding-left: 12px;
          border-left: 3px solid transparent;
        }

        .section-title.client {
          color: #f59e0b;
          border-left-color: #f59e0b;
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
        }

        .status-container {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
        }

        .status-container .detail-item {
          flex: 1;
          margin-bottom: 0;
        }

        .client-date-input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 12px;
          background: #000000;
          border: 1px solid var(--border-surface);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .client-date-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .section-title.travel {
          color: #e879f9;
          border-left-color: #e879f9;
          text-shadow: 0 0 10px rgba(232, 121, 249, 0.3);
        }

        .section-title.equipment {
          color: #fb7185;
          border-left-color: #fb7185;
          text-shadow: 0 0 10px rgba(251, 113, 133, 0.3);
        }

        .status-summary-select {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-surface);
          padding: 8px 12px;
          border-radius: 12px;
          color: var(--primary);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          margin-top: 4px;
          transition: var(--transition-smooth);
        }

        .status-summary-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .reasons-section {
          margin-top: 24px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          border: 1px dashed var(--border-surface);
        }

        .reasons-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }

        .reasons-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .reason-badge {
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-surface);
          color: var(--text-dim);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .reason-badge:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-main);
          transform: translateY(-2px);
        }

        .reason-badge.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 0 15px var(--primary-glow);
        }

        .comments-section {
          margin-top: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          border: 1px solid var(--border-surface);
        }

        .comments-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }

        .comments-textarea {
          width: 100%;
          min-height: 80px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-surface);
          border-radius: 12px;
          padding: 12px;
          color: var(--text-main);
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          transition: var(--transition-smooth);
        }

        .comments-textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
        }
      `}</style>
    </div>
  );
}

export default function NewQuote() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Chargement...</div>}>
      <QuoteForm />
    </Suspense>
  );
}
