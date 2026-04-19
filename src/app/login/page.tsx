"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email ou mot de passe incorrect, ou licence expirée.");
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-dark)", padding: "20px" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: "420px" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", background: "rgba(16,185,129,0.1)", border: "1px solid var(--primary)", borderRadius: "18px", marginBottom: "16px", boxShadow: "0 0 30px rgba(16,185,129,0.2)" }}>
            <TrendingUp size={30} color="#10b981" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-1px" }}>Cota<span style={{ color: "var(--primary)" }}>Log</span></h1>
          <p style={{ color: "var(--text-dim)", fontSize: "14px", marginTop: "6px" }}>Connectez-vous à votre espace</p>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-surface)", borderRadius: "24px", padding: "32px", backdropFilter: "blur(16px)", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "12px 16px", color: "#ef4444", fontSize: "14px" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "var(--text-dim)" }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  style={{ width: "100%", padding: "12px 12px 12px 42px", background: "rgba(0,0,0,0.03)", border: "1px solid var(--border-surface)", borderRadius: "12px", fontSize: "14px", color: "var(--text-main)", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "var(--text-dim)" }}>Mot de passe</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "12px 12px 12px 42px", background: "rgba(0,0,0,0.03)", border: "1px solid var(--border-surface)", borderRadius: "12px", fontSize: "14px", color: "var(--text-main)", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: "100%", padding: "14px", background: "var(--primary)", color: "white", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
            >
              {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : null}
              {loading ? "Connexion..." : "Se connecter"}
            </motion.button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-muted)" }}>
            Première connexion ?{" "}
            <Link href="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>Activer votre licence</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
