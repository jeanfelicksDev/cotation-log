"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Key, Copy, Check, Trash2, Plus, Users, Calendar, AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ADMIN_SECRET = typeof window !== "undefined" ? "" : "";

export default function AdminLicensePage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ companyName: "", contactEmail: "", maxUsers: 10, expiresAt: "", notes: "" });
  const [creating, setCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchLicenses = async (s: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/licenses", { headers: { "x-admin-secret": s } });
    if (res.ok) {
      setLicenses(await res.json());
      setAuthenticated(true);
    } else {
      setError("Mot de passe administrateur incorrect.");
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newLicense = await res.json();
      setLicenses(prev => [newLicense, ...prev]);
      setForm({ companyName: "", contactEmail: "", maxUsers: 10, expiresAt: "", notes: "" });
    }
    setCreating(false);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Désactiver cette licence ?")) return;
    await fetch(`/api/admin/licenses?id=${id}`, { method: "DELETE", headers: { "x-admin-secret": secret } });
    setLicenses(prev => prev.map(l => l.id === id ? { ...l, isActive: false } : l));
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const inputStyle = { width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.03)", border: "1px solid var(--border-surface)", borderRadius: "10px", fontSize: "13px", color: "var(--text-main)", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };

  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-dark)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: "360px", padding: "20px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Shield size={48} color="#10b981" style={{ margin: "0 auto 16px", display: "block" }} />
            <h1 style={{ fontSize: "22px", fontWeight: 800 }}>Zone Administrateur</h1>
            <p style={{ color: "var(--text-dim)", fontSize: "13px", marginTop: "6px" }}>Accès réservé</p>
          </div>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-surface)", borderRadius: "20px", padding: "28px" }}>
            {error && <div style={{ background: "rgba(239,68,68,0.08)", borderRadius: "10px", padding: "10px 14px", color: "#ef4444", fontSize: "13px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}><AlertCircle size={14}/>{error}</div>}
            <input
              type="password"
              placeholder="Mot de passe admin"
              value={secret}
              onChange={e => { setSecret(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && fetchLicenses(secret)}
              style={inputStyle}
            />
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => fetchLicenses(secret)} disabled={loading} style={{ width: "100%", padding: "12px", background: "var(--primary)", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "14px", cursor: "pointer", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Shield size={16} />}
              Accéder
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
          <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid var(--primary)", borderRadius: "14px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={24} color="#10b981" />
          </div>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px" }}>Gestion des Licences</h1>
            <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>{licenses.length} licence(s) générée(s) • {licenses.filter(l => l.isActive).length} active(s)</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
          {/* Create form */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-surface)", borderRadius: "20px", padding: "24px", height: "fit-content" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} color="var(--primary)" /> Nouvelle Licence
            </h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-dim)" }}>Nom de l'entreprise *</label>
                <input type="text" required value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder="Ex: DSM Logistics" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-dim)" }}>Email de contact *</label>
                <input type="email" required value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} placeholder="contact@entreprise.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-dim)" }}>Max utilisateurs</label>
                <input type="number" min={1} max={100} value={form.maxUsers} onChange={e => setForm(p => ({ ...p, maxUsers: parseInt(e.target.value) }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-dim)" }}>Date d'expiration (optionnel)</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-dim)" }}>Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Ex: Contrat annuel" style={inputStyle} />
              </div>
              <motion.button type="submit" disabled={creating} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "12px", background: "var(--primary)", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 15px rgba(16,185,129,0.25)" }}>
                {creating ? <Loader2 size={14} /> : <Key size={14} />}
                Générer la clé
              </motion.button>
            </form>
          </div>

          {/* Licenses list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {licenses.length === 0 ? (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-surface)", borderRadius: "20px", padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                <Key size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
                <p>Aucune licence générée</p>
              </div>
            ) : licenses.map(l => (
              <motion.div key={l.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: "var(--bg-surface)", border: `1px solid ${l.isActive ? "rgba(16,185,129,0.2)" : "var(--border-surface)"}`, borderRadius: "16px", padding: "20px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", background: l.isActive ? "rgba(16,185,129,0.05)" : "transparent", borderBottomLeftRadius: "80px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <h3 style={{ fontWeight: 700, fontSize: "15px" }}>{l.companyName}</h3>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: l.isActive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", color: l.isActive ? "#10b981" : "#ef4444" }}>
                        {l.isActive ? "✓ Active" : "Inactive"}
                      </span>
                      {l.activatedAt && <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>Activée</span>}
                    </div>
                    <p style={{ color: "var(--text-dim)", fontSize: "12px" }}>{l.contactEmail}</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => copyKey(l.key)} style={{ padding: "6px 10px", background: "rgba(0,0,0,0.04)", border: "1px solid var(--border-surface)", borderRadius: "8px", cursor: "pointer", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                      {copiedKey === l.key ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copiedKey === l.key ? "Copié" : "Copier"}
                    </button>
                    {l.isActive && (
                      <button onClick={() => handleRevoke(l.id)} style={{ padding: "6px 10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                        <Trash2 size={14} /> Révoquer
                      </button>
                    )}
                  </div>
                </div>

                {/* License key */}
                <div style={{ background: "rgba(0,0,0,0.04)", borderRadius: "10px", padding: "10px 14px", fontFamily: "monospace", fontSize: "15px", fontWeight: 700, letterSpacing: "1.5px", color: "var(--primary)", marginBottom: "12px" }}>
                  {l.key}
                </div>

                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Users size={12} /> {l.organization?.users?.length || 0} / {l.maxUsers} utilisateurs</span>
                  {l.expiresAt && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={12} /> Expire le {format(new Date(l.expiresAt), "dd/MM/yyyy", { locale: fr })}</span>}
                  {l.activatedAt && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} color="#10b981" /> Activée le {format(new Date(l.activatedAt), "dd/MM/yyyy", { locale: fr })}</span>}
                  {l.notes && <span>📝 {l.notes}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
