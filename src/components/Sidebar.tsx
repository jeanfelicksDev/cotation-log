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
import "./Sidebar.css";

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
      </motion.div>
    </>
  );
}
