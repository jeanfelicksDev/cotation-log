"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  FilePlus, 
  Layers, 
  History, 
  Settings, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

const navItems = [
  { name: "Dashboard",       href: "/",          icon: BarChart3, color: "#f97316" },
  { name: "Nouvelle Cotation", href: "/quote/new", icon: FilePlus,  color: "#f59e0b" },
  { name: "Suivi des Offres",  href: "/tracking",  icon: History,   color: "#e879f9" },
  { name: "Grilles Tarifaires",href: "/tariffs",   icon: Layers,    color: "#fb7185" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <TrendingUp size={24} color="#10b981" />
        </div>
        <span className="logo-text">Cota<span>Log</span></span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 5 }}
                className={clsx("nav-item", isActive && "active")}
              >
                <item.icon size={20} className="icon" color={item.color} style={{ color: item.color, filter: `drop-shadow(0 0 5px ${item.color}66)` }} />
                <span className="nav-text" style={{ marginLeft: "3px" }}>{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="active-indicator"
                  />
                )}
                {/* Visual glow on hover */}
                <div className="hover-glow" />
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link href="/settings">
          <div className={clsx("nav-item", pathname === "/settings" && "active")}>
            <Settings size={20} className="icon" style={{ color: "#94a3b8" }} />
            <span className="nav-text" style={{ marginLeft: "3px" }}>Paramètres</span>
          </div>
        </Link>
        <div className="divider" />
        <div className="user-profile">
          <div className="avatar">AD</div>
          <div className="user-info">
            <p className="name">Admin Logistics</p>
            <p className="role">Commercial Expert</p>
          </div>
          <LogOut size={18} className="logout-icon" />
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: var(--bg-surface);
          backdrop-filter: var(--glass-blur);
          border-right: 1px solid var(--border-surface);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px 32px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid var(--primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px var(--primary-glow);
        }

        .logo-text {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .logo-text span {
          color: var(--primary);
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          color: var(--text-dim);
          position: relative;
          transition: var(--transition-smooth);
          overflow: hidden;
        }

        .nav-item:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-item.active {
          color: var(--text-main);
          background: rgba(16, 185, 129, 0.1);
        }

        .icon {
          flex-shrink: 0;
        }

        .nav-text {
          font-size: 15px;
          font-weight: 500;
        }

        .active-indicator {
          position: absolute;
          left: 0;
          width: 3px;
          height: 20px;
          background: var(--primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-top: 16px;
        }

        .divider {
          height: 1px;
          background: var(--border-surface);
          width: 100%;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          border: 1px solid var(--border-surface);
        }

        .avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--primary), #059669);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .name {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role {
          font-size: 11px;
          color: var(--text-dim);
        }

        .logout-icon {
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .logout-icon:hover {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}
