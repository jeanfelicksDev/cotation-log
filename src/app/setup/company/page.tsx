"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Upload, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCompanyProfile, updateCompanyProfile } from "@/lib/actions";

export default function CompanySetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState({
    corporateName: "",
    address: "",
    phone: "",
    email: "",
    logo: ""
  });

  useEffect(() => {
    async function loadData() {
      const data = await getCompanyProfile();
      if (data) {
        setProfile({
          corporateName: data.corporateName || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          logo: data.logo || ""
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 2Mo)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompanyProfile(profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Erreur lors de l'enregistrement des informations.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-container">Chargement...</div>;

  return (
    <div className="setup-wrapper">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="setup-container"
      >
        <header className="setup-header">
          <button className="btn-back" onClick={() => router.back()}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1>Profil de l'Entreprise</h1>
            <p>Configurez les informations qui apparaîtront sur vos cotations et documents.</p>
          </div>
        </header>

        <form onSubmit={handleSave} className="setup-form">
          <div className="logo-upload-section">
            <div className="logo-preview-box">
              {profile.logo ? (
                <div className="logo-display">
                  <img src={profile.logo} alt="Logo" />
                  <button type="button" className="btn-remove-logo" onClick={() => setProfile({ ...profile, logo: "" })}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="logo-placeholder" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={32} />
                  <span>Charger le logo</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <div className="logo-info">
              <h3>Logo de l'entreprise</h3>
              <p>Format recommandé : PNG ou SVG (max 2Mo). Ce logo sera utilisé sur vos exports PDF.</p>
              <button type="button" className="btn-upload-trigger" onClick={() => fileInputRef.current?.click()}>
                {profile.logo ? "Changer le logo" : "Sélectionner un fichier"}
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group full">
              <label><Building2 size={14} /> Raison Sociale</label>
              <input 
                type="text" 
                required
                placeholder="Nom officiel de l'entreprise"
                value={profile.corporateName}
                onChange={e => setProfile({ ...profile, corporateName: e.target.value })}
              />
            </div>
            
            <div className="input-group full">
              <label><MapPin size={14} /> Adresse Siège</label>
              <input 
                type="text" 
                placeholder="N°, Rue, Ville, Pays"
                value={profile.address}
                onChange={e => setProfile({ ...profile, address: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label><Phone size={14} /> Téléphone</label>
              <input 
                type="tel" 
                placeholder="+228 90 00 00 00"
                value={profile.phone}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label><Mail size={14} /> Email de Contact</label>
              <input 
                type="email" 
                placeholder="contact@entreprise.com"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className="btn-save-profile" disabled={saving}>
              {saving ? (
                "Enregistrement..."
              ) : success ? (
                <><CheckCircle2 size={18} /> Enregistré !</>
              ) : (
                <><Save size={18} /> Enregistrer les modifications</>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <style jsx>{`
        .setup-wrapper {
          max-width: 800px;
          margin: 40px auto;
          padding: 0 20px;
        }

        .setup-container {
          background: var(--bg-surface);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-surface);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .setup-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 40px;
        }

        .btn-back {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-surface);
          padding: 10px;
          border-radius: 12px;
          color: var(--text-main);
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-3px);
        }

        h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        p {
          color: var(--text-dim);
          font-size: 15px;
        }

        .setup-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .logo-upload-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed var(--border-surface);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .logo-preview-box {
          width: 120px;
          height: 120px;
          border-radius: 16px;
          background: #000;
          border: 1px solid var(--border-surface);
          flex-shrink: 0;
          overflow: hidden;
        }

        .logo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-muted);
          cursor: pointer;
          transition: 0.2s;
        }

        .logo-placeholder:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--primary);
        }

        .logo-placeholder span {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .logo-display {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
        }

        .logo-display img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .btn-remove-logo {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #ef4444;
          color: white;
          border: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0.8;
          transition: 0.2s;
        }

        .btn-remove-logo:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .logo-info h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .logo-info p {
          font-size: 13px;
          margin-bottom: 12px;
        }

        .btn-upload-trigger {
          background: var(--primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px var(--primary-glow);
          transition: 0.2s;
        }

        .btn-upload-trigger:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .input-group.full {
          grid-column: span 2;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        .input-group input {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-surface);
          padding: 14px 16px;
          border-radius: 12px;
          color: var(--text-main);
          font-size: 15px;
          transition: 0.2s;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(0, 0, 0, 0.3);
          box-shadow: 0 0 0 2px var(--primary-glow);
        }

        .form-footer {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }

        .btn-save-profile {
          background: linear-gradient(to right, var(--primary), #059669);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 10px 25px var(--primary-glow);
        }

        .btn-save-profile:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px var(--primary-glow);
        }

        .btn-save-profile:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
