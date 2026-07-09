import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Minus,
  AlertTriangle,
  Package,
  Trash2,
  X,
  Truck,
  Wine,
  ClipboardList,
  TrendingDown,
  Loader2,
  Pencil,
  Tags,
  Check,
  Sparkles,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  Boxes,
  Ruler,
  ListChecks,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase, STORAGE_ROW_ID } from "./supabaseClient";

const THEME = {
  bg: "#F3F9FE",
  surface: "#FFFFFF",
  surface2: "#EFF7FD",
  surface3: "#E1F0FB",
  border: "#CFE7F7",
  borderLight: "#AAD6F2",
  text: "#123049",
  textDim: "#4F7C97",
  textFaint: "#8FB4CB",
  amber: "#2E9CE0",
  amberDim: "#DBF0FC",
  copper: "#0E7CC4",
  red: "#E15347",
  redDim: "#FCE6E3",
  olive: "#2E9C7E",
  oliveDim: "#E1F5EE",
  onAccent: "#FFFFFF",
};

const FALLBACK_CATEGORY = "Autres";
const FALLBACK_UNIT = "unité(s)";
const FALLBACK_SUPPLIER = "Non assigné";

const DEFAULT_SUPPLIERS = ["OBD", "David", "Richard Vin", "Vinickles", "Café Richard", "Non assigné"];
const FALLBACK_ICON = "📦";

const DEFAULT_CATEGORY_ICONS = {
  "Bières pression": "🍺",
  "Bières bouteilles": "🍾",
  "Softs": "🥤",
  "Eaux": "💧",
  "Vins": "🍷",
  "Spiritueux": "🥃",
  "Whiskies": "🥃",
  "Rhums": "🍹",
  "Gins": "🍸",
  "Vodkas": "🧊",
  "Cachaça": "🍹",
  "Apéritifs": "🍋",
  "Sirops": "🧴",
  "Jus": "🧃",
  "Autres": "📦",
};

const DEFAULT_UNITS = ["fût(s)", "bouteille(s)", "canette(s)", "litre(s)", "carton(s)", "caisse(s)", "unité(s)"];

const REASONS = [
  { key: "livraison", label: "Livraison", sign: 1, icon: Truck },
  { key: "vente", label: "Vente", sign: -1, icon: Wine },
  { key: "perte", label: "Casse / perte", sign: -1, icon: TrendingDown },
  { key: "inventaire", label: "Correction inventaire", sign: 0, icon: ClipboardList },
];

const DEFAULT_TEMPLATES = [
  { id: "t01", name: "Blonde pression 30L", category: "Bières pression", unit: "fût(s)", quantity: 4, threshold: 2 },
  { id: "t02", name: "IPA pression 20L", category: "Bières pression", unit: "fût(s)", quantity: 2, threshold: 1 },
  { id: "t03", name: "Ambrée pression 30L", category: "Bières pression", unit: "fût(s)", quantity: 3, threshold: 1 },
  { id: "t04", name: "Blonde bouteille 33cl", category: "Bières bouteilles", unit: "bouteille(s)", quantity: 48, threshold: 24 },
  { id: "t05", name: "Triple bouteille 33cl", category: "Bières bouteilles", unit: "bouteille(s)", quantity: 36, threshold: 12 },
  { id: "t06", name: "Sans alcool 33cl", category: "Bières bouteilles", unit: "bouteille(s)", quantity: 24, threshold: 12 },
  { id: "t07", name: "Coca-Cola 33cl", category: "Softs", unit: "canette(s)", quantity: 60, threshold: 24 },
  { id: "t08", name: "Eau plate 50cl", category: "Eaux", unit: "bouteille(s)", quantity: 48, threshold: 24 },
  { id: "t09", name: "Eau gazeuse 50cl", category: "Eaux", unit: "bouteille(s)", quantity: 36, threshold: 18 },
  { id: "t10", name: "Jus d'orange 25cl", category: "Softs", unit: "bouteille(s)", quantity: 24, threshold: 12 },
  { id: "t11", name: "Vin rouge maison 75cl", category: "Vins", unit: "bouteille(s)", quantity: 18, threshold: 6 },
  { id: "t12", name: "Vin blanc maison 75cl", category: "Vins", unit: "bouteille(s)", quantity: 18, threshold: 6 },
  { id: "t13", name: "Rosé 75cl", category: "Vins", unit: "bouteille(s)", quantity: 12, threshold: 6 },
  { id: "t14", name: "Vodka 70cl", category: "Spiritueux", unit: "bouteille(s)", quantity: 4, threshold: 2 },
  { id: "t15", name: "Rhum ambré 70cl", category: "Spiritueux", unit: "bouteille(s)", quantity: 4, threshold: 2 },
  { id: "t16", name: "Whisky 70cl", category: "Spiritueux", unit: "bouteille(s)", quantity: 3, threshold: 1 },
  { id: "t17", name: "Pastis 1L", category: "Spiritueux", unit: "bouteille(s)", quantity: 3, threshold: 1 },
  { id: "t18", name: "Sirop grenadine 1L", category: "Autres", unit: "bouteille(s)", quantity: 4, threshold: 2 },
  { id: "t19", name: "Glaçons (sac)", category: "Autres", unit: "unité(s)", quantity: 10, threshold: 4 },
];

const DEFAULT_CATEGORIES = [
  "Bières pression",
  "Bières bouteilles",
  "Softs",
  "Eaux",
  "Vins",
  "Spiritueux",
  "Autres",
];

const uid = () => Math.random().toString(36).slice(2, 10);

const CHART_COLORS = [
  "#2E9CE0",
  "#0E7CC4",
  "#2E9C7E",
  "#E15347",
  "#D9A441",
  "#8B6FD1",
  "#4FA6A6",
  "#C97BB0",
  "#6B8E4E",
  "#B85C38",
  "#5E7CE2",
  "#A3A15E",
  "#C4667A",
  "#4F7C97",
];

function getItemSuppliers(item) {
  if (item.suppliers && item.suppliers.length) return item.suppliers;
  if (item.supplier) return [item.supplier];
  return [FALLBACK_SUPPLIER];
}

function isImageUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function CategoryIcon({ value, size = 20 }) {
  if (isImageUrl(value)) {
    return (
      <img
        src={value}
        alt=""
        style={{ width: size, height: size, objectFit: "cover", borderRadius: 4 }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{value || FALLBACK_ICON}</span>;
}

function fontFace() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
      .font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
      .font-body { font-family: 'Work Sans', sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: ${THEME.surface}; }
      ::-webkit-scrollbar-thumb { background: ${THEME.borderLight}; border-radius: 4px; }
      @keyframes fadeSlide { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in { animation: fadeSlide 0.25s ease-out; }
      .gauge-fill { transition: height 0.4s cubic-bezier(0.4,0,0.2,1), background-color 0.4s; }
      input:focus, select:focus, button:focus-visible {
        outline: 2px solid ${THEME.amber};
        outline-offset: 2px;
      }
    `}</style>
  );
}

function statusOf(item) {
  if (item.quantity <= item.threshold) return "low";
  if (item.quantity <= item.threshold * 1.5) return "watch";
  return "ok";
}

function statusColor(status) {
  if (status === "low") return THEME.red;
  if (status === "watch") return THEME.amber;
  return THEME.olive;
}

function Gauge({ item }) {
  const status = statusOf(item);
  const color = statusColor(status);
  const cap = Math.max(item.threshold * 2, 1);
  const pct = Math.max(4, Math.min(100, (item.quantity / cap) * 100));
  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 34 }}>
      <div
        className="relative w-full rounded-sm overflow-hidden"
        style={{ height: 64, background: THEME.surface3, border: `1px solid ${THEME.border}` }}
      >
        <div
          className="gauge-fill absolute bottom-0 left-0 w-full"
          style={{ height: `${pct}%`, backgroundColor: color }}
        />
        <div
          className="absolute left-0 w-full border-t border-dashed"
          style={{
            bottom: `${Math.min(100, (item.threshold / cap) * 100)}%`,
            borderColor: THEME.textFaint,
          }}
        />
      </div>
    </div>
  );
}

function Badge({ status }) {
  if (status === "low")
    return (
      <span
        className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm tracking-wide"
        style={{ background: THEME.redDim, color: "#A33327" }}
      >
        BAS
      </span>
    );
  if (status === "watch")
    return (
      <span
        className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm tracking-wide"
        style={{ background: THEME.amberDim, color: "#0E5C8C" }}
      >
        SURVEILLER
      </span>
    );
  return (
    <span
      className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm tracking-wide"
      style={{ background: THEME.oliveDim, color: "#1B6E56" }}
    >
      OK
    </span>
  );
}

function ItemRow({ item, onAdjust, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const status = statusOf(item);
  return (
    <div
      className="fade-in flex items-center gap-3 px-3 py-2.5 rounded-md"
      style={{ background: THEME.surface2, border: `1px solid ${THEME.border}` }}
    >
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          onClick={() => onMoveUp(item)}
          disabled={isFirst}
          className="w-6 h-5 flex items-center justify-center rounded-sm disabled:opacity-25"
          style={{ background: THEME.surface3, color: THEME.textDim, border: `1px solid ${THEME.border}` }}
          aria-label={`Monter ${item.name}`}
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={() => onMoveDown(item)}
          disabled={isLast}
          className="w-6 h-5 flex items-center justify-center rounded-sm disabled:opacity-25"
          style={{ background: THEME.surface3, color: THEME.textDim, border: `1px solid ${THEME.border}` }}
          aria-label={`Descendre ${item.name}`}
        >
          <ChevronDown size={12} />
        </button>
      </div>
      <Gauge item={item} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display text-[15px] leading-tight" style={{ color: THEME.text }}>
            {item.name}
          </span>
          <Badge status={status} />
        </div>
        <div className="font-mono text-xs mt-0.5" style={{ color: THEME.textDim }}>
          {item.quantity}
          {item.idealQuantity !== undefined && item.idealQuantity !== null
            ? ` / ${item.idealQuantity}`
            : ""}{" "}
          {item.unit} · seuil {item.threshold}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onAdjust(item, -1, "vente")}
          className="w-7 h-7 flex items-center justify-center rounded-sm"
          style={{ background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }}
          aria-label={`Retirer une unité de ${item.name}`}
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => onAdjust(item, 1, "livraison")}
          className="w-7 h-7 flex items-center justify-center rounded-sm"
          style={{ background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }}
          aria-label={`Ajouter une unité à ${item.name}`}
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => onEdit(item)}
          className="w-7 h-7 flex items-center justify-center rounded-sm"
          style={{ background: THEME.surface3, color: THEME.textDim, border: `1px solid ${THEME.border}` }}
          aria-label={`Modifier ${item.name}`}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="w-7 h-7 flex items-center justify-center rounded-sm ml-1"
          style={{ color: THEME.textFaint }}
          aria-label={`Supprimer ${item.name}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(10,8,5,0.6)" }}
      onClick={onClose}
    >
      <div
        className="fade-in w-full max-w-md rounded-lg flex flex-col"
        style={{ background: THEME.surface, border: `1px solid ${THEME.borderLight}`, maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 pb-4 flex-shrink-0">
          <h3 className="font-display text-lg" style={{ color: THEME.text }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ color: THEME.textFaint }} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function fieldStyle() {
  return {
    background: THEME.surface2,
    border: `1px solid ${THEME.border}`,
    color: THEME.text,
  };
}

function ItemFormModal({ categories, units, suppliers, initial, onClose, onSubmit }) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || categories[0]);
  const [unit, setUnit] = useState(initial?.unit || units[0]);
  const [selectedSuppliers, setSelectedSuppliers] = useState(
    initial ? getItemSuppliers(initial) : []
  );
  const [isPercentage, setIsPercentage] = useState(initial?.isPercentage || false);
  const [quantity, setQuantity] = useState(
    initial ? String(initial.quantity) : ""
  );
  const [threshold, setThreshold] = useState(
    initial ? String(initial.threshold) : ""
  );
  const [idealQuantity, setIdealQuantity] = useState(
    initial?.idealQuantity !== undefined ? String(initial.idealQuantity) : ""
  );

  const canSubmit = name.trim() && quantity !== "" && threshold !== "";

  const toggleSupplier = (s) => {
    setSelectedSuppliers((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const togglePercentage = (checked) => {
    setIsPercentage(checked);
    if (checked) {
      // Valeurs de départ sensées pour une bouteille pleine à son arrivée.
      if (!isEdit) {
        setQuantity("100");
        setThreshold("20");
        setIdealQuantity("100");
      }
    }
  };

  return (
    <Modal title={isEdit ? `Modifier — ${initial.name}` : "Ajouter un produit"} onClose={onClose}>
      <div className="flex flex-col gap-3 font-body text-sm">
        <div>
          <label className="block mb-1" style={{ color: THEME.textDim }}>
            Nom du produit
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. Pils du Nord 30L"
            className="w-full rounded-sm px-2.5 py-2"
            style={fieldStyle()}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1" style={{ color: THEME.textDim }}>
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-sm px-2.5 py-2"
              style={fieldStyle()}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block mb-1" style={{ color: THEME.textDim }}>
              Unité
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={isPercentage}
              className="w-full rounded-sm px-2.5 py-2 disabled:opacity-50"
              style={fieldStyle()}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block mb-1" style={{ color: THEME.textDim }}>
            Fournisseur(s)
          </label>
          <div
            className="flex flex-col gap-1 rounded-sm p-2 max-h-36 overflow-y-auto"
            style={fieldStyle()}
          >
            {suppliers.map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={selectedSuppliers.includes(s)}
                  onChange={() => toggleSupplier(s)}
                />
                <span style={{ color: THEME.text }}>{s}</span>
              </label>
            ))}
          </div>
        </div>
        <label
          className="flex items-center gap-2 px-2.5 py-2 rounded-sm cursor-pointer"
          style={{ background: THEME.surface2, border: `1px solid ${THEME.border}` }}
        >
          <input
            type="checkbox"
            checked={isPercentage}
            onChange={(e) => togglePercentage(e.target.checked)}
          />
          <span style={{ color: THEME.text }}>
            Suivi en pourcentage (bouteille unique, jamais rachetée en lot)
          </span>
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1" style={{ color: THEME.textDim }}>
              {isPercentage
                ? "Niveau restant (%)"
                : isEdit
                ? "Quantité"
                : "Quantité de départ"}
            </label>
            <input
              type="number"
              min="0"
              max={isPercentage ? 100 : undefined}
              step={isPercentage ? 5 : 0.1}
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-sm px-2.5 py-2 font-mono"
              style={fieldStyle()}
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1" style={{ color: THEME.textDim }}>
              {isPercentage ? "Seuil d'alerte (%)" : "Seuil d'alerte"}
            </label>
            <input
              type="number"
              min="0"
              max={isPercentage ? 100 : undefined}
              step={isPercentage ? 5 : 0.1}
              inputMode="decimal"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full rounded-sm px-2.5 py-2 font-mono"
              style={fieldStyle()}
            />
          </div>
        </div>
        <div>
          <label className="block mb-1" style={{ color: THEME.textDim }}>
            {isPercentage ? "Niveau idéal (%)" : "Quantité idéale"}
            <span className="font-normal" style={{ color: THEME.textFaint }}>
              {" "}(optionnel)
            </span>
          </label>
          <input
            type="number"
            min="0"
            max={isPercentage ? 100 : undefined}
            step={isPercentage ? 5 : 0.1}
            inputMode="decimal"
            placeholder={isPercentage ? "ex. 100" : "ex. 24"}
            value={idealQuantity}
            onChange={(e) => setIdealQuantity(e.target.value)}
            className="w-full rounded-sm px-2.5 py-2 font-mono"
            style={fieldStyle()}
          />
        </div>
        <button
          disabled={!canSubmit}
          onClick={() => {
            const q = isPercentage ? Math.min(100, Number(quantity)) : Number(quantity);
            const t = isPercentage ? Math.min(100, Number(threshold)) : Number(threshold);
            const ideal =
              idealQuantity !== ""
                ? isPercentage
                  ? Math.min(100, Number(idealQuantity))
                  : Number(idealQuantity)
                : undefined;
            onSubmit({
              id: initial?.id || uid(),
              name: name.trim(),
              category,
              unit: isPercentage ? "%" : unit,
              isPercentage,
              quantity: q,
              threshold: t,
              idealQuantity: ideal,
              suppliers: selectedSuppliers.length ? selectedSuppliers : [FALLBACK_SUPPLIER],
            });
            onClose();
          }}
          className="mt-2 rounded-sm py-2.5 font-display text-[15px] tracking-wide disabled:opacity-40"
          style={{ background: THEME.amber, color: THEME.onAccent }}
        >
          {isEdit ? "Enregistrer les modifications" : "Ajouter au stock"}
        </button>
      </div>
    </Modal>
  );
}

function AdjustModal({ item, onClose, onConfirm }) {
  const [reason, setReason] = useState(item.__prefillReason || "livraison");
  const [amount, setAmount] = useState(item.isPercentage ? 10 : 1);
  const reasonObj = REASONS.find((r) => r.key === reason);

  return (
    <Modal title={`Mouvement — ${item.name}`} onClose={onClose}>
      <div className="flex flex-col gap-3 font-body text-sm">
        <div>
          <label className="block mb-1" style={{ color: THEME.textDim }}>
            Motif
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => {
              const Icon = r.icon;
              const active = reason === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setReason(r.key)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-sm text-xs"
                  style={{
                    background: active ? THEME.surface3 : THEME.surface2,
                    border: `1px solid ${active ? THEME.amber : THEME.border}`,
                    color: active ? THEME.amber : THEME.textDim,
                  }}
                >
                  <Icon size={13} />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block mb-1" style={{ color: THEME.textDim }}>
            {reasonObj.sign === 0
              ? item.isPercentage
                ? "Nouveau niveau (%)"
                : "Nouvelle quantité totale"
              : item.isPercentage
              ? "Points de %"
              : "Quantité"}
          </label>
          <input
            type="number"
            min="0"
            max={item.isPercentage ? 100 : undefined}
            step={item.isPercentage ? 5 : 0.1}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-sm px-2.5 py-2 font-mono"
            style={fieldStyle()}
          />
        </div>
        <button
          onClick={() => {
            onConfirm(item, Number(amount), reason);
            onClose();
          }}
          className="mt-1 rounded-sm py-2.5 font-display text-[15px] tracking-wide"
          style={{ background: THEME.amber, color: THEME.onAccent }}
        >
          Valider le mouvement
        </button>
      </div>
    </Modal>
  );
}

function CategoryManagerModal({ categories, itemCounts, categoryIcons, onClose, onAdd, onRename, onDelete, onMove, onSetIcon }) {
  const [newCat, setNewCat] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editingIcon, setEditingIcon] = useState(null);
  const [iconValue, setIconValue] = useState("");

  const startEdit = (cat) => {
    setEditingId(cat);
    setEditValue(cat);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== editingId) {
      onRename(editingId, trimmed);
    }
    setEditingId(null);
  };

  const startEditIcon = (cat) => {
    setEditingIcon(cat);
    setIconValue(categoryIcons[cat] || FALLBACK_ICON);
  };

  const commitIcon = () => {
    const trimmed = iconValue.trim();
    if (trimmed) onSetIcon(editingIcon, trimmed);
    setEditingIcon(null);
  };

  return (
    <Modal title="Gérer les catégories" onClose={onClose}>
      <div className="flex flex-col gap-2 font-body text-sm">
        {categories.map((cat, idx) => (
          <div
            key={cat}
            className="flex items-center gap-2 px-2.5 py-2 rounded-sm"
            style={{ background: THEME.surface2, border: `1px solid ${THEME.border}` }}
          >
            {editingId === cat ? (
              <>
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                  className="flex-1 rounded-sm px-2 py-1"
                  style={fieldStyle()}
                />
                <button
                  onClick={commitEdit}
                  className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                  style={{ background: THEME.amber, color: THEME.onAccent }}
                  aria-label="Valider le renommage"
                >
                  <Check size={14} />
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => onMove(cat, -1)}
                    disabled={idx === 0}
                    className="w-6 h-5 flex items-center justify-center rounded-sm disabled:opacity-25"
                    style={{ background: THEME.surface3, color: THEME.textDim, border: `1px solid ${THEME.border}` }}
                    aria-label={`Monter ${cat}`}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => onMove(cat, 1)}
                    disabled={idx === categories.length - 1}
                    className="w-6 h-5 flex items-center justify-center rounded-sm disabled:opacity-25"
                    style={{ background: THEME.surface3, color: THEME.textDim, border: `1px solid ${THEME.border}` }}
                    aria-label={`Descendre ${cat}`}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
                {editingIcon === cat ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input
                      autoFocus
                      value={iconValue}
                      onChange={(e) => setIconValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && commitIcon()}
                      placeholder="emoji ou lien image (https://...)"
                      className="w-40 rounded-sm px-2 py-1 text-sm"
                      style={fieldStyle()}
                    />
                    <button
                      onClick={commitIcon}
                      className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                      style={{ background: THEME.amber, color: THEME.onAccent }}
                      aria-label="Valider l'icône"
                    >
                      <Check size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditIcon(cat)}
                    className="w-8 h-8 flex items-center justify-center rounded-sm flex-shrink-0 overflow-hidden"
                    style={{ background: THEME.surface3, border: `1px solid ${THEME.border}` }}
                    aria-label={`Changer l'icône de ${cat}`}
                  >
                    <CategoryIcon value={categoryIcons[cat]} size={24} />
                  </button>
                )}
                <span className="flex-1" style={{ color: THEME.text }}>
                  {cat}
                </span>
                <span className="font-mono text-xs" style={{ color: THEME.textFaint }}>
                  {itemCounts[cat] || 0} produit{(itemCounts[cat] || 0) !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => startEdit(cat)}
                  className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                  style={{ color: THEME.textDim }}
                  aria-label={`Renommer ${cat}`}
                >
                  <Pencil size={13} />
                </button>
                {cat !== FALLBACK_CATEGORY && (
                  <button
                    onClick={() => onDelete(cat)}
                    className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                    style={{ color: THEME.textFaint }}
                    aria-label={`Supprimer ${cat}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 mt-1">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCat.trim()) {
                onAdd(newCat.trim());
                setNewCat("");
              }
            }}
            placeholder="Nouvelle catégorie"
            className="flex-1 rounded-sm px-2.5 py-2"
            style={fieldStyle()}
          />
          <button
            onClick={() => {
              if (newCat.trim()) {
                onAdd(newCat.trim());
                setNewCat("");
              }
            }}
            className="w-9 h-9 flex items-center justify-center rounded-sm flex-shrink-0"
            style={{ background: THEME.amber, color: THEME.onAccent }}
            aria-label="Ajouter la catégorie"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-xs mt-1" style={{ color: THEME.textFaint }}>
          Supprimer une catégorie déplace ses produits vers « {FALLBACK_CATEGORY} ».
        </p>
      </div>
    </Modal>
  );
}

function UnitManagerModal({ units, unitCounts, onClose, onAdd, onRename, onDelete }) {
  const [newUnit, setNewUnit] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (u) => {
    setEditingId(u);
    setEditValue(u);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== editingId) {
      onRename(editingId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <Modal title="Gérer les unités" onClose={onClose}>
      <div className="flex flex-col gap-2 font-body text-sm">
        {units.map((u) => (
          <div
            key={u}
            className="flex items-center gap-2 px-2.5 py-2 rounded-sm"
            style={{ background: THEME.surface2, border: `1px solid ${THEME.border}` }}
          >
            {editingId === u ? (
              <>
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                  className="flex-1 rounded-sm px-2 py-1"
                  style={fieldStyle()}
                />
                <button
                  onClick={commitEdit}
                  className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                  style={{ background: THEME.amber, color: THEME.onAccent }}
                  aria-label="Valider le renommage"
                >
                  <Check size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1" style={{ color: THEME.text }}>
                  {u}
                </span>
                <span className="font-mono text-xs" style={{ color: THEME.textFaint }}>
                  {unitCounts[u] || 0} produit{(unitCounts[u] || 0) !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => startEdit(u)}
                  className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                  style={{ color: THEME.textDim }}
                  aria-label={`Renommer ${u}`}
                >
                  <Pencil size={13} />
                </button>
                {u !== FALLBACK_UNIT && (
                  <button
                    onClick={() => onDelete(u)}
                    className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                    style={{ color: THEME.textFaint }}
                    aria-label={`Supprimer ${u}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 mt-1">
          <input
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newUnit.trim()) {
                onAdd(newUnit.trim());
                setNewUnit("");
              }
            }}
            placeholder="Nouvelle unité (ex. sachet(s))"
            className="flex-1 rounded-sm px-2.5 py-2"
            style={fieldStyle()}
          />
          <button
            onClick={() => {
              if (newUnit.trim()) {
                onAdd(newUnit.trim());
                setNewUnit("");
              }
            }}
            className="w-9 h-9 flex items-center justify-center rounded-sm flex-shrink-0"
            style={{ background: THEME.amber, color: THEME.onAccent }}
            aria-label="Ajouter l'unité"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-xs mt-1" style={{ color: THEME.textFaint }}>
          Supprimer une unité bascule ses produits vers « {FALLBACK_UNIT} ».
        </p>
      </div>
    </Modal>
  );
}

function SupplierManagerModal({ suppliers, supplierCounts, onClose, onAdd, onRename, onDelete }) {
  const [newSupplier, setNewSupplier] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (s) => {
    setEditingId(s);
    setEditValue(s);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== editingId) {
      onRename(editingId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <Modal title="Gérer les fournisseurs" onClose={onClose}>
      <div className="flex flex-col gap-2 font-body text-sm">
        {suppliers.map((s) => (
          <div
            key={s}
            className="flex items-center gap-2 px-2.5 py-2 rounded-sm"
            style={{ background: THEME.surface2, border: `1px solid ${THEME.border}` }}
          >
            {editingId === s ? (
              <>
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                  className="flex-1 rounded-sm px-2 py-1"
                  style={fieldStyle()}
                />
                <button
                  onClick={commitEdit}
                  className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                  style={{ background: THEME.amber, color: THEME.onAccent }}
                  aria-label="Valider le renommage"
                >
                  <Check size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1" style={{ color: THEME.text }}>
                  {s}
                </span>
                <span className="font-mono text-xs" style={{ color: THEME.textFaint }}>
                  {supplierCounts[s] || 0} produit{(supplierCounts[s] || 0) !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => startEdit(s)}
                  className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                  style={{ color: THEME.textDim }}
                  aria-label={`Renommer ${s}`}
                >
                  <Pencil size={13} />
                </button>
                {s !== FALLBACK_SUPPLIER && (
                  <button
                    onClick={() => onDelete(s)}
                    className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                    style={{ color: THEME.textFaint }}
                    aria-label={`Supprimer ${s}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 mt-1">
          <input
            value={newSupplier}
            onChange={(e) => setNewSupplier(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSupplier.trim()) {
                onAdd(newSupplier.trim());
                setNewSupplier("");
              }
            }}
            placeholder="Nouveau fournisseur"
            className="flex-1 rounded-sm px-2.5 py-2"
            style={fieldStyle()}
          />
          <button
            onClick={() => {
              if (newSupplier.trim()) {
                onAdd(newSupplier.trim());
                setNewSupplier("");
              }
            }}
            className="w-9 h-9 flex items-center justify-center rounded-sm flex-shrink-0"
            style={{ background: THEME.amber, color: THEME.onAccent }}
            aria-label="Ajouter le fournisseur"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-xs mt-1" style={{ color: THEME.textFaint }}>
          Supprimer un fournisseur bascule ses produits vers « {FALLBACK_SUPPLIER} ».
        </p>
      </div>
    </Modal>
  );
}

function TemplateFormModal({ categories, units, initial, onClose, onSubmit }) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || categories[0]);
  const [unit, setUnit] = useState(initial?.unit || units[0]);
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "1");
  const [threshold, setThreshold] = useState(initial ? String(initial.threshold) : "1");

  const canSubmit = name.trim() && quantity !== "" && threshold !== "";

  return (
    <Modal title={isEdit ? `Modifier le modèle — ${initial.name}` : "Nouveau modèle de produit"} onClose={onClose}>
      <div className="flex flex-col gap-3 font-body text-sm">
        <div>
          <label className="block mb-1" style={{ color: THEME.textDim }}>
            Nom du produit
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. Pils du Nord 30L"
            className="w-full rounded-sm px-2.5 py-2"
            style={fieldStyle()}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1" style={{ color: THEME.textDim }}>
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-sm px-2.5 py-2"
              style={fieldStyle()}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block mb-1" style={{ color: THEME.textDim }}>
              Unité
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-sm px-2.5 py-2"
              style={fieldStyle()}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1" style={{ color: THEME.textDim }}>
              Quantité par défaut
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-sm px-2.5 py-2 font-mono"
              style={fieldStyle()}
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1" style={{ color: THEME.textDim }}>
              Seuil par défaut
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full rounded-sm px-2.5 py-2 font-mono"
              style={fieldStyle()}
            />
          </div>
        </div>
        <button
          disabled={!canSubmit}
          onClick={() => {
            onSubmit({
              id: initial?.id || uid(),
              name: name.trim(),
              category,
              unit,
              quantity: Number(quantity),
              threshold: Number(threshold),
            });
            onClose();
          }}
          className="mt-2 rounded-sm py-2.5 font-display text-[15px] tracking-wide disabled:opacity-40"
          style={{ background: THEME.amber, color: THEME.onAccent }}
        >
          {isEdit ? "Enregistrer les modifications" : "Ajouter le modèle"}
        </button>
      </div>
    </Modal>
  );
}

function TemplateManagerModal({ templates, categories, units, onClose, onAdd, onEdit, onDelete }) {
  const [formTarget, setFormTarget] = useState(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <Modal title="Gérer les produits type" onClose={onClose}>
        <div className="flex flex-col gap-2 font-body text-sm">
          {templates.length === 0 && (
            <p className="text-xs" style={{ color: THEME.textFaint }}>
              Aucun modèle. Ajoute-en un pour pouvoir le charger en un clic depuis l'écran principal.
            </p>
          )}
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded-sm"
                style={{ background: THEME.surface2, border: `1px solid ${THEME.border}` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ color: THEME.text }}>
                    {t.name}
                  </p>
                  <p className="font-mono text-xs" style={{ color: THEME.textFaint }}>
                    {t.category} · {t.quantity} {t.unit} · seuil {t.threshold}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormTarget(t);
                    setShowForm(true);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                  style={{ color: THEME.textDim }}
                  aria-label={`Modifier ${t.name}`}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(t)}
                  className="w-7 h-7 flex items-center justify-center rounded-sm flex-shrink-0"
                  style={{ color: THEME.textFaint }}
                  aria-label={`Supprimer ${t.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setFormTarget(null);
              setShowForm(true);
            }}
            className="mt-1 flex items-center justify-center gap-2 rounded-sm py-2.5 font-display text-[15px] tracking-wide"
            style={{ background: THEME.amber, color: THEME.onAccent }}
          >
            <Plus size={16} /> Nouveau modèle
          </button>
        </div>
      </Modal>
      {showForm && (
        <TemplateFormModal
          categories={categories}
          units={units}
          initial={formTarget}
          onClose={() => setShowForm(false)}
          onSubmit={(t) => {
            if (formTarget) onEdit(t);
            else onAdd(t);
          }}
        />
      )}
    </>
  );
}
function StatCard({ label, value, sub, color }) {
  return (
    <div
      className="rounded-lg p-4 flex-1 min-w-[140px]"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <p className="font-mono text-xs tracking-widest uppercase" style={{ color: THEME.textDim }}>
        {label}
      </p>
      <p className="font-display text-3xl mt-1" style={{ color: color || THEME.text }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: THEME.textFaint }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Dashboard({ items, categories, alerts, onSelectCategory, categoryIcons }) {
  const totalUnits = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const byCategory = useMemo(() => {
    return categories
      .map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        return {
          category: cat,
          produits: catItems.length,
          unites: catItems.reduce((sum, i) => sum + i.quantity, 0),
        };
      })
      .filter((c) => c.produits > 0);
  }, [items, categories]);

  const okCount = items.length - alerts.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Produits suivis" value={items.length} />
        <StatCard label="Unités en stock" value={totalUnits} sub="tous produits confondus" />
        <StatCard
          label="En alerte"
          value={alerts.length}
          sub={alerts.length > 0 ? "seuil atteint" : "rien à signaler"}
          color={alerts.length > 0 ? THEME.red : THEME.olive}
        />
        <StatCard label="Catégories actives" value={byCategory.length} />
      </div>

      {byCategory.length > 0 && (
        <div
          className="rounded-lg p-4 sm:p-5"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <h2 className="font-display text-lg mb-3" style={{ color: THEME.text }}>
            Répartition par catégorie
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div style={{ width: "100%", height: 220 }} className="md:w-1/2">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="produits"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    onClick={(entry) => onSelectCategory && onSelectCategory(entry.category)}
                    style={{ cursor: "pointer" }}
                  >
                    {byCategory.map((entry, idx) => (
                      <Cell key={entry.category} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: THEME.surface3,
                      border: `1px solid ${THEME.borderLight}`,
                      borderRadius: 6,
                      color: THEME.text,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5 md:w-1/2 justify-center">
              {byCategory.map((c, idx) => (
                <div
                  key={c.category}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => onSelectCategory && onSelectCategory(c.category)}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  <span className="flex-1 underline decoration-dotted flex items-center gap-1.5" style={{ color: THEME.text }}>
                    <CategoryIcon value={categoryIcons[c.category]} size={16} /> {c.category}
                  </span>
                  <span className="font-mono text-xs" style={{ color: THEME.textDim }}>
                    {c.produits} produit{c.produits !== 1 ? "s" : ""} · {c.unites} unité{c.unites !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div
          className="rounded-lg p-4 sm:p-5"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <h2 className="font-display text-lg mb-3 flex items-center gap-2" style={{ color: THEME.text }}>
            <AlertTriangle size={18} color={THEME.red} /> Produits en alerte
          </h2>
          <div className="flex flex-col gap-1.5">
            {alerts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm px-2.5 py-1.5 rounded-sm"
                style={{ background: THEME.redDim }}
              >
                <span style={{ color: THEME.text }}>{item.name}</span>
                <span className="font-mono text-xs" style={{ color: "#A33327" }}>
                  {item.quantity} / seuil {item.threshold} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div
          className="rounded-lg py-12 flex flex-col items-center justify-center text-center gap-2"
          style={{ background: THEME.surface, border: `1px dashed ${THEME.border}` }}
        >
          <Boxes size={26} color={THEME.textFaint} />
          <p className="text-sm" style={{ color: THEME.textDim }}>
            Ajoute des produits pour voir apparaître le tableau de bord.
          </p>
        </div>
      )}
    </div>
  );
}

function OrderList({ items, categories, categoryIcons }) {
  const toOrder = useMemo(() => {
    return items
      .filter(
        (i) =>
          i.idealQuantity !== undefined &&
          i.idealQuantity !== null &&
          i.idealQuantity > i.quantity
      )
      .map((i) => ({ ...i, needed: i.idealQuantity - i.quantity }));
  }, [items]);

  const grouped = useMemo(() => {
    const map = {};
    for (const c of categories) map[c] = [];
    for (const item of toOrder) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [toOrder, categories]);

  const totalItems = toOrder.length;

  if (totalItems === 0) {
    return (
      <div
        className="rounded-lg py-16 flex flex-col items-center justify-center text-center gap-3"
        style={{ background: THEME.surface, border: `1px dashed ${THEME.border}` }}
      >
        <Truck size={28} color={THEME.textFaint} />
        <p className="font-display text-lg" style={{ color: THEME.text }}>
          Rien à commander pour l'instant
        </p>
        <p className="text-sm max-w-xs" style={{ color: THEME.textDim }}>
          Renseigne une « quantité idéale » sur tes produits pour voir apparaître ici ce qu'il
          manque.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-lg p-4 flex items-center justify-between"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <span className="text-sm" style={{ color: THEME.text }}>
          <strong>{totalItems}</strong> produit{totalItems !== 1 ? "s" : ""} sous le niveau idéal
        </span>
      </div>

      {categories
        .filter((c) => grouped[c] && grouped[c].length > 0)
        .map((cat) => (
          <div key={cat} className="flex flex-col gap-2">
            <h2
              className="font-mono text-xs tracking-widest uppercase px-1 flex items-center gap-1.5"
              style={{ color: THEME.copper }}
            >
              <CategoryIcon value={categoryIcons[cat]} size={16} /> {cat}
            </h2>
            <div className="flex flex-col gap-2">
              {grouped[cat].map((item) => (
                <div
                  key={item.id}
                  className="fade-in flex items-center justify-between gap-3 px-3 py-2.5 rounded-md"
                  style={{ background: THEME.surface2, border: `1px solid ${THEME.border}` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[15px]" style={{ color: THEME.text }}>
                      {item.name}
                    </p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: THEME.textFaint }}>
                      {item.quantity} / {item.idealQuantity} {item.unit}
                    </p>
                    <p className="font-mono text-[11px] mt-0.5" style={{ color: THEME.copper }}>
                      {getItemSuppliers(item).join(" · ")}
                    </p>
                  </div>
                  <div
                    className="font-mono text-sm font-semibold px-3 py-1.5 rounded-sm flex-shrink-0"
                    style={{ background: THEME.amberDim, color: "#0E5C8C" }}
                  >
                    + {item.needed} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function SupplierBrowse({ items, suppliers, onSelectSupplier }) {
  const bySupplier = useMemo(() => {
    return suppliers
      .map((s) => {
        const supplierItems = items.filter((i) => getItemSuppliers(i).includes(s));
        return { supplier: s, count: supplierItems.length };
      })
      .filter((s) => s.count > 0);
  }, [items, suppliers]);

  if (bySupplier.length === 0) {
    return (
      <div
        className="rounded-lg py-16 flex flex-col items-center justify-center text-center gap-3"
        style={{ background: THEME.surface, border: `1px dashed ${THEME.border}` }}
      >
        <Package size={28} color={THEME.textFaint} />
        <p className="font-display text-lg" style={{ color: THEME.text }}>
          Aucun produit assigné à un fournisseur
        </p>
        <p className="text-sm max-w-xs" style={{ color: THEME.textDim }}>
          Renseigne le fournisseur de chaque produit dans son formulaire d'édition pour les voir
          apparaître ici.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2
        className="font-mono text-xs tracking-widest uppercase px-1 mb-1"
        style={{ color: THEME.copper }}
      >
        Choisis un fournisseur
      </h2>
      {bySupplier.map((s) => (
        <button
          key={s.supplier}
          onClick={() => onSelectSupplier(s.supplier)}
          className="fade-in flex items-center justify-between gap-3 px-4 py-3 rounded-md text-left"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <span className="font-display text-[16px]" style={{ color: THEME.text }}>
            {s.supplier}
          </span>
          <span className="font-mono text-xs" style={{ color: THEME.textFaint }}>
            {s.count} produit{s.count !== 1 ? "s" : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function StockBrasserie() {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoryIcons, setCategoryIcons] = useState(DEFAULT_CATEGORY_ICONS);
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [suppliers, setSuppliers] = useState(DEFAULT_SUPPLIERS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [view, setView] = useState("stock");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [supplierFilter, setSupplierFilter] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("stock_brasserie")
          .select("data")
          .eq("id", STORAGE_ROW_ID)
          .maybeSingle();

        if (error) throw error;

        if (data && data.data) {
          const parsed = data.data;
          setItems(parsed.items || []);
          setHistory(parsed.history || []);
          const savedCategories =
            parsed.categories && parsed.categories.length ? parsed.categories : DEFAULT_CATEGORIES;
          // Ajoute "Eaux" pour les données déjà existantes qui ne l'ont pas encore,
          // sans supprimer ni réordonner les catégories déjà présentes.
          const mergedCategories = savedCategories.includes("Eaux")
            ? savedCategories
            : [...savedCategories, "Eaux"];
          setCategories(mergedCategories);
          setUnits(parsed.units && parsed.units.length ? parsed.units : DEFAULT_UNITS);
          setSuppliers(parsed.suppliers && parsed.suppliers.length ? parsed.suppliers : DEFAULT_SUPPLIERS);
          setTemplates(parsed.templates !== undefined ? parsed.templates : DEFAULT_TEMPLATES);
          setCategoryIcons({ ...DEFAULT_CATEGORY_ICONS, ...(parsed.categoryIcons || {}) });
        } else {
          // Aucune ligne encore en base : on en crée une avec les valeurs par défaut.
          await supabase.from("stock_brasserie").upsert({
            id: STORAGE_ROW_ID,
            data: {
              items: [],
              history: [],
              categories: DEFAULT_CATEGORIES,
              units: DEFAULT_UNITS,
              suppliers: DEFAULT_SUPPLIERS,
              templates: DEFAULT_TEMPLATES,
              categoryIcons: DEFAULT_CATEGORY_ICONS,
            },
          });
        }
      } catch (e) {
        console.error("Erreur de chargement depuis Supabase:", e);
      } finally {
        setLoaded(true);
      }
    })();

    // Écoute les changements en temps réel faits par d'autres personnes
    // utilisant l'appli en même temps, pour que tout le monde reste synchronisé.
    const channel = supabase
      .channel("stock_brasserie_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "stock_brasserie", filter: `id=eq.${STORAGE_ROW_ID}` },
        (payload) => {
          const parsed = payload.new.data;
          if (!parsed) return;
          setItems(parsed.items || []);
          setHistory(parsed.history || []);
          setCategories(
            parsed.categories && parsed.categories.length ? parsed.categories : DEFAULT_CATEGORIES
          );
          setUnits(parsed.units && parsed.units.length ? parsed.units : DEFAULT_UNITS);
          setSuppliers(parsed.suppliers && parsed.suppliers.length ? parsed.suppliers : DEFAULT_SUPPLIERS);
          setTemplates(parsed.templates !== undefined ? parsed.templates : DEFAULT_TEMPLATES);
          setCategoryIcons({ ...DEFAULT_CATEGORY_ICONS, ...(parsed.categoryIcons || {}) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // `persist` accepte un objet partiel : seuls les champs fournis sont mis à jour,
  // les autres gardent leur valeur actuelle (via les refs ci-dessous).
  const stateRef = React.useRef({});
  stateRef.current = { items, history, categories, units, suppliers, templates, categoryIcons };

  const persist = useCallback(async (partial) => {
    const next = { ...stateRef.current, ...partial };
    const payload = {
      items: next.items,
      history: next.history,
      categories: next.categories,
      units: next.units,
      suppliers: next.suppliers,
      templates: next.templates,
      categoryIcons: next.categoryIcons,
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { error } = await supabase
          .from("stock_brasserie")
          .upsert({ id: STORAGE_ROW_ID, data: payload });
        if (!error) return;
      } catch (e) {
        // retry once silently
      }
    }
    console.error("Cave Manager: échec de la sauvegarde après 2 tentatives.");
  }, []);

  const addItem = (item) => {
    const next = [...items, item];
    setItems(next);
    persist({ items: next });
  };

  const updateItem = (updated) => {
    const next = items.map((i) => (i.id === updated.id ? updated : i));
    setItems(next);
    persist({ items: next });
  };

  const deleteItem = (item) => {
    const next = items.filter((i) => i.id !== item.id);
    setItems(next);
    persist({ items: next });
  };

  const moveItem = (item, direction) => {
    const sameCategoryIds = items.filter((i) => i.category === item.category).map((i) => i.id);
    const posInCategory = sameCategoryIds.indexOf(item.id);
    const targetPos = posInCategory + direction;
    if (targetPos < 0 || targetPos >= sameCategoryIds.length) return;
    const neighborId = sameCategoryIds[targetPos];

    const indexA = items.findIndex((i) => i.id === item.id);
    const indexB = items.findIndex((i) => i.id === neighborId);
    const next = [...items];
    [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
    setItems(next);
    persist({ items: next });
  };

  const addCategory = (name) => {
    if (categories.includes(name)) return;
    const next = [...categories, name];
    setCategories(next);
    persist({ categories: next });
  };

  const renameCategory = (oldName, newName) => {
    if (categories.includes(newName)) return;
    const nextCategories = categories.map((c) => (c === oldName ? newName : c));
    const nextItems = items.map((i) => (i.category === oldName ? { ...i, category: newName } : i));
    setCategories(nextCategories);
    setItems(nextItems);
    persist({ categories: nextCategories, items: nextItems });
  };

  const deleteCategory = (name) => {
    if (name === FALLBACK_CATEGORY) return;
    const nextCategories = categories.filter((c) => c !== name);
    const nextItems = items.map((i) =>
      i.category === name ? { ...i, category: FALLBACK_CATEGORY } : i
    );
    setCategories(nextCategories);
    setItems(nextItems);
    persist({ categories: nextCategories, items: nextItems });
  };

  const moveCategory = (name, direction) => {
    const idx = categories.indexOf(name);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const next = [...categories];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    setCategories(next);
    persist({ categories: next });
  };

  const setCategoryIcon = (name, icon) => {
    const next = { ...categoryIcons, [name]: icon };
    setCategoryIcons(next);
    persist({ categoryIcons: next });
  };

  const addUnit = (name) => {
    if (units.includes(name)) return;
    const next = [...units, name];
    setUnits(next);
    persist({ units: next });
  };

  const renameUnit = (oldName, newName) => {
    if (units.includes(newName)) return;
    const nextUnits = units.map((u) => (u === oldName ? newName : u));
    const nextItems = items.map((i) => (i.unit === oldName ? { ...i, unit: newName } : i));
    const nextTemplates = templates.map((t) => (t.unit === oldName ? { ...t, unit: newName } : t));
    setUnits(nextUnits);
    setItems(nextItems);
    setTemplates(nextTemplates);
    persist({ units: nextUnits, items: nextItems, templates: nextTemplates });
  };

  const deleteUnit = (name) => {
    if (name === FALLBACK_UNIT) return;
    const nextUnits = units.filter((u) => u !== name);
    const nextItems = items.map((i) => (i.unit === name ? { ...i, unit: FALLBACK_UNIT } : i));
    const nextTemplates = templates.map((t) => (t.unit === name ? { ...t, unit: FALLBACK_UNIT } : t));
    setUnits(nextUnits);
    setItems(nextItems);
    setTemplates(nextTemplates);
    persist({ units: nextUnits, items: nextItems, templates: nextTemplates });
  };

  const addSupplier = (name) => {
    if (suppliers.includes(name)) return;
    const next = [...suppliers, name];
    setSuppliers(next);
    persist({ suppliers: next });
  };

  const renameSupplier = (oldName, newName) => {
    if (suppliers.includes(newName)) return;
    const nextSuppliers = suppliers.map((s) => (s === oldName ? newName : s));
    const nextItems = items.map((i) => {
      const list = getItemSuppliers(i);
      if (!list.includes(oldName)) return i;
      return { ...i, suppliers: list.map((s) => (s === oldName ? newName : s)) };
    });
    setSuppliers(nextSuppliers);
    setItems(nextItems);
    persist({ suppliers: nextSuppliers, items: nextItems });
  };

  const deleteSupplier = (name) => {
    if (name === FALLBACK_SUPPLIER) return;
    const nextSuppliers = suppliers.filter((s) => s !== name);
    const nextItems = items.map((i) => {
      const list = getItemSuppliers(i);
      if (!list.includes(name)) return i;
      const remaining = list.filter((s) => s !== name);
      return { ...i, suppliers: remaining.length ? remaining : [FALLBACK_SUPPLIER] };
    });
    setSuppliers(nextSuppliers);
    setItems(nextItems);
    persist({ suppliers: nextSuppliers, items: nextItems });
  };

  const addTemplate = (template) => {
    const next = [...templates, template];
    setTemplates(next);
    persist({ templates: next });
  };

  const editTemplate = (updated) => {
    const next = templates.map((t) => (t.id === updated.id ? updated : t));
    setTemplates(next);
    persist({ templates: next });
  };

  const deleteTemplate = (template) => {
    const next = templates.filter((t) => t.id !== template.id);
    setTemplates(next);
    persist({ templates: next });
  };

  const loadSampleProducts = () => {
    const existingNames = new Set(items.map((i) => i.name.toLowerCase()));
    const toAdd = templates.filter((p) => !existingNames.has(p.name.toLowerCase()));
    if (toAdd.length === 0) return;

    const nextCategories = [...categories];
    for (const p of toAdd) {
      if (!nextCategories.includes(p.category)) nextCategories.push(p.category);
    }
    const nextItems = [...items, ...toAdd.map((p) => ({ ...p, id: uid() }))];
    setCategories(nextCategories);
    setItems(nextItems);
    persist({ items: nextItems, categories: nextCategories });
  };

  const applyMovement = (item, amount, reasonKey) => {
    const reasonObj = REASONS.find((r) => r.key === reasonKey);
    let delta;
    if (reasonObj.sign === 0) {
      delta = amount - item.quantity;
    } else {
      delta = reasonObj.sign * Math.abs(amount);
    }
    const rawQty = item.quantity + delta;
    const newQty = item.isPercentage ? Math.min(100, Math.max(0, rawQty)) : Math.max(0, rawQty);
    const actualDelta = newQty - item.quantity;

    const nextItems = items.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i));
    const entry = {
      id: uid(),
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      unit: item.unit,
      delta: actualDelta,
      reason: reasonObj.label,
      date: new Date().toISOString(),
    };
    const nextHistory = [entry, ...history].slice(0, 500);
    setItems(nextItems);
    setHistory(nextHistory);
    persist({ items: nextItems, history: nextHistory });
  };

  const deleteHistoryEntry = (entry) => {
    const next = history.filter((h) => h.id !== entry.id);
    setHistory(next);
    persist({ history: next });
  };

  const clearHistory = () => {
    setHistory([]);
    persist({ history: [] });
  };

  const quickAdjust = (item, sign, reasonKey) => {
    const step = item.isPercentage ? 10 : 1;
    applyMovement(item, step, sign > 0 ? "livraison" : "vente");
  };

  const alerts = useMemo(() => items.filter((i) => i.quantity <= i.threshold), [items]);

  const itemCounts = useMemo(() => {
    const counts = {};
    for (const i of items) counts[i.category] = (counts[i.category] || 0) + 1;
    return counts;
  }, [items]);

  const unitCounts = useMemo(() => {
    const counts = {};
    for (const i of items) counts[i.unit] = (counts[i.unit] || 0) + 1;
    return counts;
  }, [items]);

  const supplierCounts = useMemo(() => {
    const counts = {};
    for (const i of items) {
      for (const s of getItemSuppliers(i)) {
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return counts;
  }, [items]);

  const grouped = useMemo(() => {
    const map = {};
    for (const c of categories) map[c] = [];
    for (const item of items) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [items, categories]);

  const chartData = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    const byCat = {};
    for (const h of history) {
      if (h.delta < 0 && new Date(h.date).getTime() >= cutoff) {
        byCat[h.category] = (byCat[h.category] || 0) + Math.abs(h.delta);
      }
    }
    return Object.entries(byCat).map(([category, sorties]) => ({ category, sorties }));
  }, [history]);

  if (!loaded) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center"
        style={{ background: THEME.bg }}
      >
        {fontFace()}
        <Loader2 className="animate-spin" size={24} color={THEME.amber} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen font-body" style={{ background: THEME.bg }}>
      {fontFace()}

      {/* Header */}
      <div
        className="px-5 py-6 sm:px-8"
        style={{ background: THEME.surface, borderBottom: `1px solid ${THEME.border}` }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2" style={{ color: THEME.amber }}>
              <Package size={18} />
              <span className="font-mono text-xs tracking-widest uppercase">Cave & Réserve</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl mt-1" style={{ color: THEME.text }}>
              Stock de la brasserie
            </h1>
            <p className="text-sm mt-1" style={{ color: THEME.textDim }}>
              {items.length} produit{items.length !== 1 ? "s" : ""} suivi{items.length !== 1 ? "s" : ""}
              {alerts.length > 0 && (
                <span style={{ color: THEME.red }}> · {alerts.length} en alerte</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setView(view === "dashboard" ? "stock" : "dashboard")}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[15px] tracking-wide"
              style={
                view === "dashboard"
                  ? { background: THEME.amber, color: THEME.onAccent }
                  : { background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }
              }
            >
              <LayoutDashboard size={16} /> Tableau de bord
            </button>
            <button
              onClick={() => setView(view === "order" ? "stock" : "order")}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[15px] tracking-wide"
              style={
                view === "order"
                  ? { background: THEME.amber, color: THEME.onAccent }
                  : { background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }
              }
            >
              <Truck size={16} /> Commande
            </button>
            <button
              onClick={() => {
                setSupplierFilter(null);
                setView(view === "suppliers" ? "stock" : "suppliers");
              }}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[15px] tracking-wide"
              style={
                view === "suppliers"
                  ? { background: THEME.amber, color: THEME.onAccent }
                  : { background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }
              }
            >
              <Package size={16} /> Par fournisseur
            </button>
            <button
              onClick={() => setShowSuppliers(true)}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[15px] tracking-wide"
              style={{ background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }}
            >
              <ListChecks size={16} /> Fournisseurs
            </button>
            <button
              onClick={() => setShowUnits(true)}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[15px] tracking-wide"
              style={{ background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }}
            >
              <Ruler size={16} /> Unités
            </button>
            <button
              onClick={() => setShowCategories(true)}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[15px] tracking-wide"
              style={{ background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }}
            >
              <Tags size={16} /> Catégories
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[15px] tracking-wide"
              style={{ background: THEME.amber, color: THEME.onAccent }}
            >
              <Plus size={16} /> Ajouter un produit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 flex flex-col gap-6">
        {view === "dashboard" ? (
          <Dashboard
            items={items}
            categories={categories}
            alerts={alerts}
            categoryIcons={categoryIcons}
            onSelectCategory={(cat) => {
              setCategoryFilter(cat);
              setView("stock");
            }}
          />
        ) : view === "order" ? (
          <OrderList items={items} categories={categories} categoryIcons={categoryIcons} />
        ) : view === "suppliers" && !supplierFilter ? (
          <SupplierBrowse
            items={items}
            suppliers={suppliers}
            onSelectSupplier={(s) => setSupplierFilter(s)}
          />
        ) : (
          <>
        {/* Active supplier filter banner */}
        {view === "suppliers" && supplierFilter && (
          <div
            className="fade-in flex items-center justify-between rounded-md px-4 py-2.5"
            style={{ background: THEME.surface3, border: `1px solid ${THEME.border}` }}
          >
            <span className="text-sm" style={{ color: THEME.text }}>
              Fournisseur « <strong>{supplierFilter}</strong> »
            </span>
            <button
              onClick={() => setSupplierFilter(null)}
              className="font-mono text-[10px] px-2 py-1 rounded-sm"
              style={{ color: THEME.textDim, border: `1px solid ${THEME.border}` }}
            >
              Autre fournisseur
            </button>
          </div>
        )}

        {/* Active category filter banner */}
        {view !== "suppliers" && categoryFilter && (
          <div
            className="fade-in flex items-center justify-between rounded-md px-4 py-2.5"
            style={{ background: THEME.surface3, border: `1px solid ${THEME.border}` }}
          >
            <span className="text-sm" style={{ color: THEME.text }}>
              Filtré sur « <strong>{categoryFilter}</strong> »
            </span>
            <button
              onClick={() => setCategoryFilter(null)}
              className="font-mono text-[10px] px-2 py-1 rounded-sm"
              style={{ color: THEME.textDim, border: `1px solid ${THEME.border}` }}
            >
              Voir tout
            </button>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div
            className="fade-in rounded-lg py-16 flex flex-col items-center justify-center text-center gap-3"
            style={{ background: THEME.surface, border: `1px dashed ${THEME.border}` }}
          >
            <Wine size={28} color={THEME.textFaint} />
            <p className="font-display text-lg" style={{ color: THEME.text }}>
              La cave est vide pour l'instant
            </p>
            <p className="text-sm max-w-xs" style={{ color: THEME.textDim }}>
              Ajoute un premier fût, une bouteille ou une caisse pour démarrer le suivi.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setShowAdd(true)}
                className="rounded-md px-4 py-2 font-display text-sm"
                style={{ background: THEME.amber, color: THEME.onAccent }}
              >
                Ajouter un produit
              </button>
              <button
                onClick={loadSampleProducts}
                className="flex items-center gap-1.5 rounded-md px-4 py-2 font-display text-sm"
                style={{ background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }}
              >
                <Sparkles size={14} /> Charger des produits type
              </button>
            </div>
          </div>
        )}

        {/* Category groups */}
        {categories
          .filter((c) => grouped[c] && grouped[c].length > 0)
          .filter((c) => !categoryFilter || c === categoryFilter)
          .map((cat) => {
            const catItems = supplierFilter
              ? grouped[cat].filter((i) => getItemSuppliers(i).includes(supplierFilter))
              : grouped[cat];
            if (catItems.length === 0) return null;
            return (
          <div key={cat} className="flex flex-col gap-2">
            <h2
              className="font-mono text-xs tracking-widest uppercase px-1 flex items-center gap-1.5"
              style={{ color: THEME.copper }}
            >
              <CategoryIcon value={categoryIcons[cat]} size={16} /> {cat}
            </h2>
            <div className="flex flex-col gap-2">
              {catItems.map((item, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onAdjust={quickAdjust}
                  onEdit={setEditTarget}
                  onDelete={deleteItem}
                  onMoveUp={(i) => moveItem(i, -1)}
                  onMoveDown={(i) => moveItem(i, 1)}
                  isFirst={idx === 0}
                  isLast={idx === catItems.length - 1}
                />
              ))}
            </div>
          </div>
            );
          })}

        {/* Reports */}
        {history.length > 0 && (
          <div
            className="rounded-lg p-4 sm:p-5"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
          >
            <h2 className="font-display text-lg mb-3" style={{ color: THEME.text }}>
              Sorties par catégorie — 7 derniers jours
            </h2>
            {chartData.length > 0 ? (
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} vertical={false} />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: THEME.textDim, fontSize: 11 }}
                      axisLine={{ stroke: THEME.border }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: THEME.textDim, fontSize: 11 }}
                      axisLine={{ stroke: THEME.border }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: THEME.surface3,
                        border: `1px solid ${THEME.borderLight}`,
                        borderRadius: 6,
                        color: THEME.text,
                        fontSize: 12,
                      }}
                      cursor={{ fill: THEME.surface3 }}
                    />
                    <Bar dataKey="sorties" fill={THEME.amber} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm" style={{ color: THEME.textFaint }}>
                Aucune sortie enregistrée cette semaine.
              </p>
            )}

            <div className="flex items-center justify-between mt-5 mb-2">
              <h3
                className="font-mono text-xs tracking-widest uppercase"
                style={{ color: THEME.copper }}
              >
                Historique des mouvements
              </h3>
              <button
                onClick={() => {
                  if (window.confirm("Vider tout l'historique des mouvements ?")) clearHistory();
                }}
                className="font-mono text-[10px] px-2 py-1 rounded-sm"
                style={{ color: THEME.textFaint, border: `1px solid ${THEME.border}` }}
              >
                Vider l'historique
              </button>
            </div>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
              {history.slice(0, 60).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs font-mono px-2.5 py-1.5 rounded-sm"
                  style={{ background: THEME.surface2 }}
                >
                  <span style={{ color: THEME.textDim }}>
                    {new Date(h.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}{" "}
                    {new Date(h.date).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex-1 px-3 truncate" style={{ color: THEME.text }}>
                    {h.itemName}
                  </span>
                  <span style={{ color: THEME.textFaint }}>{h.reason}</span>
                  <span
                    className="ml-3 w-14 text-right"
                    style={{ color: h.delta < 0 ? THEME.red : THEME.olive }}
                  >
                    {h.delta > 0 ? "+" : ""}
                    {h.delta}
                  </span>
                  <button
                    onClick={() => deleteHistoryEntry(h)}
                    className="ml-2 flex-shrink-0"
                    style={{ color: THEME.textFaint }}
                    aria-label="Supprimer cette ligne"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {showAdd && (
        <ItemFormModal
          categories={categories}
          units={units}
          suppliers={suppliers}
          onClose={() => setShowAdd(false)}
          onSubmit={addItem}
        />
      )}
      {editTarget && (
        <ItemFormModal
          categories={categories}
          units={units}
          suppliers={suppliers}
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={updateItem}
        />
      )}
      {showCategories && (
        <CategoryManagerModal
          categories={categories}
          itemCounts={itemCounts}
          categoryIcons={categoryIcons}
          onClose={() => setShowCategories(false)}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
          onMove={moveCategory}
          onSetIcon={setCategoryIcon}
        />
      )}
      {showUnits && (
        <UnitManagerModal
          units={units}
          unitCounts={unitCounts}
          onClose={() => setShowUnits(false)}
          onAdd={addUnit}
          onRename={renameUnit}
          onDelete={deleteUnit}
        />
      )}
      {showSuppliers && (
        <SupplierManagerModal
          suppliers={suppliers}
          supplierCounts={supplierCounts}
          onClose={() => setShowSuppliers(false)}
          onAdd={addSupplier}
          onRename={renameSupplier}
          onDelete={deleteSupplier}
        />
      )}
    </div>
  );
}
