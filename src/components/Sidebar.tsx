"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  FilePlus, 
  History, 
  Settings, 
  LogOut,
  TrendingUp,
  Layers,
  Menu,
  X
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { name: "Dashboard",        href: "/",          icon: BarChart3, color: "#f97316" },
  { name: "Nouvelle Cotation", href: "/quote/new", icon: FilePlus,  color: "#f59e0b" },
  { name: "Suivi des Offres",  href: "/tracking",  icon: History,   color: "#e879f9" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const renderNavItem = (item: any) => {
    const isActive = pathname === item.href;
    return (
      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
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
          <div className="hover-glow" />
        </motion.div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <Link href="/setup/company">
          <div className="mobile-logo">
            <div className="logo-icon">
              <TrendingUp size={20} color="#10b981" />
            </div>
            <span className="logo-text">Cota<span>Log</span></span>
          </div>
        </Link>
        <button className="hamburger-btn" onClick={() => setIsOpen(true)} aria-label="Ouvrir le menu">
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.div
        className={clsx("sidebar", isOpen && "sidebar-open")}
        initial={false}
        animate={{ x: isOpen ? 0 : undefined }}
      >
        <Link href="/setup/company" onClick={() => setIsOpen(false)}>
          <div className="sidebar-logo">
            <div className="logo-icon">
              <TrendingUp size={24} color="#10b981" />
            </div>
            <span className="logo-text">Cota<span>Log</span></span>
          </div>
        </Link>

        {/* Close button on mobile */}
        <button className="sidebar-close-btn" onClick={() => setIsOpen(false)} aria-label="Fermer">
          <X size={20} />
        </button>

        <nav className="sidebar-nav">
          {navItems.map(renderNavItem)}
        </nav>

        <div className="sidebar-footer">
          <Link href="/settings" onClick={() => setIsOpen(false)}>
            <motion.div 
              whileHover={{ x: 5 }}
              className={clsx("nav-item", pathname === "/settings" && "active")}
            >
              <Settings size={20} className="icon" style={{ color: "#94a3b8" }} />
              <span className="nav-text" style={{ marginLeft: "3px" }}>Paramètres</span>
              {pathname === "/settings" && (
                <motion.div
                  layoutId="active-indicator"
                  className="active-indicator"
                />
              )}
              <div className="hover-glow" />
            </motion.div>
          </Link>

          {renderNavItem({ name: "Grilles Tarifaires", href: "/tariffs", icon: Layers, color: "#fb7185" })}
          
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
            background: #0f172a; /* Deep Dark Navy */
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            padding: 24px 16px;
            position: fixed;
            left: 0;
            top: 0;
            z-index: 100;
            color: white;
          }

          .sidebar-close-btn {
            display: none;
          }

          .mobile-header {
            display: none;
          }

          .mobile-overlay {
            display: none;
          }

          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              z-index: 200;
              box-shadow: 10px 0 50px rgba(0,0,0,0.5);
            }

            .sidebar.sidebar-open {
              transform: translateX(0);
            }

            .sidebar-close-btn {
              display: flex;
              position: absolute;
              top: 20px;
              right: 16px;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 36px;
              background: rgba(255,255,255,0.06);
              border-radius: 10px;
              color: rgba(255,255,255,0.6);
              cursor: pointer;
              border: 1px solid rgba(255,255,255,0.1);
              transition: var(--transition-smooth);
            }

            .sidebar-close-btn:hover {
              background: rgba(239, 68, 68, 0.2);
              color: #f87171;
            }

            .mobile-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: 60px;
              background: var(--bg-surface);
              backdrop-filter: var(--glass-blur);
              border-bottom: 1px solid var(--border-surface);
              padding: 0 20px;
              z-index: 150;
              box-shadow: 0 2px 20px rgba(0,0,0,0.06);
            }

            .mobile-logo {
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .hamburger-btn {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              background: rgba(16, 185, 129, 0.08);
              border-radius: 12px;
              color: var(--primary);
              cursor: pointer;
              border: 1px solid rgba(16, 185, 129, 0.2);
              transition: var(--transition-smooth);
            }

            .hamburger-btn:hover {
              background: rgba(16, 185, 129, 0.15);
            }

            .mobile-overlay {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.4);
              backdrop-filter: blur(4px);
              z-index: 180;
            }
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
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid var(--primary);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
            flex-shrink: 0;
          }

          .logo-text {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: white;
          }

          .logo-text span {
            color: var(--primary);
          }

          .sidebar-nav {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 14px;
            color: rgba(255, 255, 255, 0.85); /* Clearly White/Light */
            position: relative;
            transition: var(--transition-smooth);
            overflow: hidden;
          }

          .nav-item:hover {
            color: white;
            background: rgba(255, 255, 255, 0.08);
          }

          .nav-item.active {
            color: white;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.2);
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
            background: rgba(255, 255, 255, 0.05);
            width: 100%;
          }

          .user-profile {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.06);
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
            flex-shrink: 0;
            color: white;
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
            color: white;
          }

          .role {
            font-size: 11px;
            color: #94a3b8;
          }

          .logout-icon {
            color: #64748b;
            cursor: pointer;
            transition: var(--transition-smooth);
          }

          .logout-icon:hover {
            color: #ef4444;
          }
        `}</style>
      </motion.div>
    </>
  );
}
