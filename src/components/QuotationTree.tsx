"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  Calendar, 
  User, 
  FileText,
  Search,
  Database
} from "lucide-react";
import { clsx } from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface QuotationTreeProps {
  data: any[];
  onSelect: (filters: { year?: number; month?: number; client?: string; quoteId?: string }) => void;
  selectedId?: string;
}

export default function QuotationTree({ data, onSelect, selectedId }: QuotationTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    root: true
  });
  const [searchTerm, setSearchTerm] = useState("");

  const toggle = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Transformation logic
  const treeData = useMemo(() => {
    const years: Record<number, any> = {};

    data.forEach(quote => {
      const date = new Date(quote.createdAt);
      const year = date.getFullYear();
      const month = format(date, "MMMM", { locale: fr });
      const client = quote.clientName || "Sans Client";

      if (!years[year]) years[year] = { count: 0, months: {} };
      if (!years[year].months[month]) years[year].months[month] = { count: 0, clients: {} };
      if (!years[year].months[month].clients[client]) years[year].months[month].clients[client] = [];

      years[year].count++;
      years[year].months[month].count++;
      years[year].months[month].clients[client].push(quote);
    });

    return years;
  }, [data]);

  const renderNode = (
    label: string, 
    key: string, 
    count: number, 
    icon: any, 
    level: number, 
    children?: React.ReactNode,
    onClick?: () => void
  ) => {
    const isExpanded = expanded[key];
    const hasChildren = !!children;

    return (
      <div className="tree-node-wrapper" key={key}>
        <div 
          className={clsx(
            "tree-node", 
            level === 0 && "root-node",
            selectedId === key && "active"
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            if (hasChildren) toggle(key);
            if (onClick) onClick();
          }}
        >
          <div className="node-content">
            {hasChildren ? (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="chevron"
              >
                <ChevronRight size={14} />
              </motion.div>
            ) : <div className="chevron-spacer" />}
            
            {React.createElement(icon, { size: 16, className: "node-icon" })}
            <span className="node-label">{label}</span>
            {count > 0 && <span className="node-count">({count})</span>}
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="node-children"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="quotation-tree-container">
      <div className="tree-header">
        <Database size={18} />
        <span>Explorateur</span>
      </div>
      
      <div className="tree-search">
        <Search size={14} />
        <input 
          type="text" 
          placeholder="Filtrer l'arbre..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="tree-scroll-area">
        {Object.entries(treeData)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, monthsData]: [any, any]) => 
            renderNode(
              year, 
              `year-${year}`, 
              monthsData.count, 
              Calendar, 
              0,
              Object.entries(monthsData.months)
                .sort(([a], [b]) => {
                  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
                  return months.indexOf(a.toLowerCase()) - months.indexOf(b.toLowerCase());
                })
                .map(([month, monthData]: [any, any]) => 
                renderNode(
                  month, 
                  `month-${year}-${month}`, 
                  monthData.count, 
                  Folder, 
                  1,
                  Object.entries(monthData.clients).map(([client, quotes]: [any, any]) => 
                    renderNode(
                      client, 
                      `client-${year}-${month}-${client}`, 
                      quotes.length, 
                      User, 
                      2,
                      quotes.map((q: any) => 
                        renderNode(
                          `${format(new Date(q.createdAt), "dd/MM")} - ${q.destination || "Sans dest."}`, 
                          q.id, 
                          0, 
                          FileText, 
                          3,
                          undefined,
                          () => onSelect({ quoteId: q.id })
                        )
                      ),
                      () => onSelect({ year: Number(year), client }) 
                    )
                  ),
                  () => onSelect({ year: Number(year) }) 
                )
              ),
              () => onSelect({ year: Number(year) })
            )
          )}
      </div>

      <style jsx>{`
        .quotation-tree-container {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-surface);
          overflow: hidden;
        }

        .tree-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-surface);
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 14px;
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.01);
        }

        .tree-search {
          padding: 12px 16px;
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.2);
          margin: 12px;
          border-radius: 10px;
          border: 1px solid var(--border-surface);
        }

        .tree-search input {
          background: transparent;
          border: none;
          color: white;
          font-size: 12px;
          width: 100%;
          outline: none;
        }

        .tree-scroll-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 0;
        }

        /* Scrollbar styling */
        .tree-scroll-area::-webkit-scrollbar {
          width: 4px;
        }
        .tree-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .tree-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .tree-node {
          padding-top: 6px;
          padding-bottom: 6px;
          padding-right: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          user-select: none;
        }

        .tree-node:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .tree-node.active {
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
        }

        .node-content {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .chevron {
          display: flex;
          align-items: center;
          color: var(--text-muted);
        }

        .chevron-spacer {
          width: 14px;
        }

        .node-icon {
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .tree-node:hover .node-icon {
          color: var(--text-main);
        }

        .active .node-icon {
          color: var(--primary);
        }

        .node-label {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .node-count {
          font-size: 11px;
          color: #fbbf24; /* Warm amber color */
          font-weight: 700;
          margin-left: 8px;
          text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
        }

        .node-children {
          overflow: hidden;
        }

        .root-node {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
