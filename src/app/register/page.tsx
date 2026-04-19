"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, Key, Building2, User, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ licenseKey: "", companyName: "", name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur lors de l'inscription.");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    }
    setLoading(false);
  };

  const inputStyle = { width: "100%", padding: "12px 12px 12px 42px", background: "rgba(0,0,0,0.03)", border: "1px solid var(--border-surface)", borderRadius: "12px", fontSize: "14px", color: "var(--text-main)", outline: "none", boxSizing: "border-box" as const };

  const Field = ({ label, icon: Icon, type, field, placeholder }: any) => (
    <div>
      <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "var(--text-dim)" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <Icon size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input type={type} value={form[field as keyof typeof form]} onChange={handleChange(field)} required placeholder={placeholder} style={inputStyle} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-dark)", padding: "20px" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", background: "rgba(16,185,129,0.1)", border: "1px solid var(--primary)", borderRadius: "18px", marginBottom: "16px", boxShadow: "0 0 30px rgba(16,185,129,0.2)" }}>
            <TrendingUp size={30} color="#10b981" />
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-1px" }}>Activer votre <span style={{ color: "var(--primary)" }}>licence</span></h1>
          <p style={{ color: "var(--text-dim)", fontSize: "13px", marginTop: "6px" }}>Entrez votre clé de licence pour créer votre espace entreprise</p>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-surface)", borderRadius: "24px", padding: "32px", backdropFilter: "blur(16px)", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle2 size={48} color="#10b981" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Compte créé avec succès !</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>Redirection vers la page de connexion...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "12px 16px", color: "#ef4444", fontSize: "14px" }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "14px", padding: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>🔑 Clé de licence</label>
                <div style={{ position: "relative" }}>
                  <Key size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--primary)" }} />
                  <input type="text" value={form.licenseKey} onChange={handleChange("licenseKey")} required placeholder="COTA-XXXX-YYYY-ZZZZ" style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "1px", fontWeight: 600, background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }} />
                </div>
              </div>

              <Field label="Nom de l'entreprise" icon={Building2} type="text" field="companyName" placeholder="Ex: DSM Logistics SA" />
              <Field label="Votre nom complet" icon={User} type="text" field="name" placeholder="Ex: Jean Dupont" />
              <Field label="Email administrateur" icon={Mail} type="email" field="email" placeholder="admin@entreprise.com" />
              <Field label="Mot de passe" icon={Lock} type="password" field="password" placeholder="••••••••" />
              <Field label="Confirmer le mot de passe" icon={Lock} type="password" field="confirmPassword" placeholder="••••••••" />

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: "100%", padding: "14px", background: "var(--primary)", color: "white", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 20px rgba(16,185,129,0.3)", marginTop: "4px" }}
              >
                {loading ? <Loader2 size={18} /> : null}
                {loading ? "Activation en cours..." : "Activer la licence & Créer le compte"}
              </motion.button>
            </form>
          )}

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
            Déjà un compte ?{" "}
            <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Se connecter</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
