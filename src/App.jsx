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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

const DEFAULT_CATEGORIES = [
  "Bières pression",
  "Bières bouteilles",
  "Softs",
  "Eaux",
  "Vins",
  "Spiritueux",
  "Autres",
];

const FALLBACK_CATEGORY = "Autres";

const UNITS = ["fût(s)", "bouteille(s)", "canette(s)", "litre(s)", "carton(s)", "caisse(s)", "unité(s)"];

const REASONS = [
  { key: "livraison", label: "Livraison", sign: 1, icon: Truck },
  { key: "vente", label: "Vente", sign: -1, icon: Wine },
  { key: "perte", label: "Casse / perte", sign: -1, icon: TrendingDown },
  { key: "inventaire", label: "Correction inventaire", sign: 0, icon: ClipboardList },
];

const SAMPLE_PRODUCTS = [
  { name: "Blonde pression 30L", category: "Bières pression", unit: "fût(s)", quantity: 4, threshold: 2 },
  { name: "IPA pression 20L", category: "Bières pression", unit: "fût(s)", quantity: 2, threshold: 1 },
  { name: "Ambrée pression 30L", category: "Bières pression", unit: "fût(s)", quantity: 3, threshold: 1 },
  { name: "Blonde bouteille 33cl", category: "Bières bouteilles", unit: "bouteille(s)", quantity: 48, threshold: 24 },
  { name: "Triple bouteille 33cl", category: "Bières bouteilles", unit: "bouteille(s)", quantity: 36, threshold: 12 },
  { name: "Sans alcool 33cl", category: "Bières bouteilles", unit: "bouteille(s)", quantity: 24, threshold: 12 },
  { name: "Coca-Cola 33cl", category: "Softs", unit: "canette(s)", quantity: 60, threshold: 24 },
  { name: "Eau plate 50cl", category: "Eaux", unit: "bouteille(s)", quantity: 48, threshold: 24 },
  { name: "Eau gazeuse 50cl", category: "Eaux", unit: "bouteille(s)", quantity: 36, threshold: 18 },
  { name: "Jus d'orange 25cl", category: "Softs", unit: "bouteille(s)", quantity: 24, threshold: 12 },
  { name: "Vin rouge maison 75cl", category: "Vins", unit: "bouteille(s)", quantity: 18, threshold: 6 },
  { name: "Vin blanc maison 75cl", category: "Vins", unit: "bouteille(s)", quantity: 18, threshold: 6 },
  { name: "Rosé 75cl", category: "Vins", unit: "bouteille(s)", quantity: 12, threshold: 6 },
  { name: "Vodka 70cl", category: "Spiritueux", unit: "bouteille(s)", quantity: 4, threshold: 2 },
  { name: "Rhum ambré 70cl", category: "Spiritueux", unit: "bouteille(s)", quantity: 4, threshold: 2 },
  { name: "Whisky 70cl", category: "Spiritueux", unit: "bouteille(s)", quantity: 3, threshold: 1 },
  { name: "Pastis 1L", category: "Spiritueux", unit: "bouteille(s)", quantity: 3, threshold: 1 },
  { name: "Sirop grenadine 1L", category: "Autres", unit: "bouteille(s)", quantity: 4, threshold: 2 },
  { name: "Glaçons (sac)", category: "Autres", unit: "unité(s)", quantity: 10, threshold: 4 },
];

const uid = () => Math.random().toString(36).slice(2, 10);

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
          {item.quantity} {item.unit} · seuil {item.threshold}
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
        className="fade-in w-full max-w-md rounded-lg p-5"
        style={{ background: THEME.surface, border: `1px solid ${THEME.borderLight}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg" style={{ color: THEME.text }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ color: THEME.textFaint }} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        {children}
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

function ItemFormModal({ categories, initial, onClose, onSubmit }) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || categories[0]);
  const [unit, setUnit] = useState(initial?.unit || UNITS[0]);
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [threshold, setThreshold] = useState(initial ? String(initial.threshold) : "");

  const canSubmit = name.trim() && quantity !== "" && threshold !== "";

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
              className="w-full rounded-sm px-2.5 py-2"
              style={fieldStyle()}
            >
              {UNITS.map((u) => (
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
              {isEdit ? "Quantité" : "Quantité de départ"}
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-sm px-2.5 py-2 font-mono"
              style={fieldStyle()}
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1" style={{ color: THEME.textDim }}>
              Seuil d'alerte
            </label>
            <input
              type="number"
              min="0"
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
          {isEdit ? "Enregistrer les modifications" : "Ajouter au stock"}
        </button>
      </div>
    </Modal>
  );
}

function AdjustModal({ item, onClose, onConfirm }) {
  const [reason, setReason] = useState(item.__prefillReason || "livraison");
  const [amount, setAmount] = useState(1);
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
            {reasonObj.sign === 0 ? "Nouvelle quantité totale" : "Quantité"}
          </label>
          <input
            type="number"
            min="0"
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

function CategoryManagerModal({ categories, itemCounts, onClose, onAdd, onRename, onDelete }) {
  const [newCat, setNewCat] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

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

  return (
    <Modal title="Gérer les catégories" onClose={onClose}>
      <div className="flex flex-col gap-2 font-body text-sm">
        {categories.map((cat) => (
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
export default function StockBrasserie() {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);

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
          const mergedCategories = savedCategories.includes("Eaux")
            ? savedCategories
            : [...savedCategories, "Eaux"];
          setCategories(mergedCategories);
        } else {
          await supabase
            .from("stock_brasserie")
            .upsert({ id: STORAGE_ROW_ID, data: { items: [], history: [], categories: DEFAULT_CATEGORIES } });
        }
      } catch (e) {
        console.error("Erreur de chargement depuis Supabase:", e);
      } finally {
        setLoaded(true);
      }
    })();

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const persist = useCallback(async (nextItems, nextHistory, nextCategories) => {
    const payload = { items: nextItems, history: nextHistory, categories: nextCategories };
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
    persist(next, history, categories);
  };

  const updateItem = (updated) => {
    const next = items.map((i) => (i.id === updated.id ? updated : i));
    setItems(next);
    persist(next, history, categories);
  };

  const deleteItem = (item) => {
    const next = items.filter((i) => i.id !== item.id);
    setItems(next);
    persist(next, history, categories);
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
    persist(next, history, categories);
  };

  const addCategory = (name) => {
    if (categories.includes(name)) return;
    const next = [...categories, name];
    setCategories(next);
    persist(items, history, next);
  };

  const renameCategory = (oldName, newName) => {
    if (categories.includes(newName)) return;
    const nextCategories = categories.map((c) => (c === oldName ? newName : c));
    const nextItems = items.map((i) => (i.category === oldName ? { ...i, category: newName } : i));
    setCategories(nextCategories);
    setItems(nextItems);
    persist(nextItems, history, nextCategories);
  };

  const deleteCategory = (name) => {
    if (name === FALLBACK_CATEGORY) return;
    const nextCategories = categories.filter((c) => c !== name);
    const nextItems = items.map((i) =>
      i.category === name ? { ...i, category: FALLBACK_CATEGORY } : i
    );
    setCategories(nextCategories);
    setItems(nextItems);
    persist(nextItems, history, nextCategories);
  };

  const loadSampleProducts = () => {
    const existingNames = new Set(items.map((i) => i.name.toLowerCase()));
    const toAdd = SAMPLE_PRODUCTS.filter((p) => !existingNames.has(p.name.toLowerCase()));
    if (toAdd.length === 0) return;

    const nextCategories = [...categories];
    for (const p of toAdd) {
      if (!nextCategories.includes(p.category)) nextCategories.push(p.category);
    }
    const nextItems = [...items, ...toAdd.map((p) => ({ ...p, id: uid() }))];
    setCategories(nextCategories);
    setItems(nextItems);
    persist(nextItems, history, nextCategories);
  };

  const applyMovement = (item, amount, reasonKey) => {
    const reasonObj = REASONS.find((r) => r.key === reasonKey);
    let delta;
    if (reasonObj.sign === 0) {
      delta = amount - item.quantity;
    } else {
      delta = reasonObj.sign * Math.abs(amount);
    }
    const newQty = Math.max(0, item.quantity + delta);
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
    persist(nextItems, nextHistory, categories);
  };

  const quickAdjust = (item, sign, reasonKey) => {
    setAdjustTarget({ ...item, __prefillReason: reasonKey });
  };

  const alerts = useMemo(() => items.filter((i) => i.quantity <= i.threshold), [items]);

  const itemCounts = useMemo(() => {
    const counts = {};
    for (const i of items) counts[i.category] = (counts[i.category] || 0) + 1;
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
              onClick={loadSampleProducts}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[15px] tracking-wide"
              style={{ background: THEME.surface3, color: THEME.text, border: `1px solid ${THEME.border}` }}
            >
              <Sparkles size={16} /> Produits type
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
        {alerts.length > 0 && (
          <div
            className="fade-in rounded-md px-4 py-3 flex items-start gap-3"
            style={{ background: THEME.redDim, border: `1px solid ${THEME.red}` }}
          >
            <AlertTriangle size={18} color="#A33327" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-display text-sm" style={{ color: "#A33327" }}>
                Seuil atteint pour {alerts.length} produit{alerts.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: "#BC5246" }}>
                {alerts.map((a) => a.name).join(" · ")}
              </p>
            </div>
          </div>
        )}

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

        {categories.filter((c) => grouped[c] && grouped[c].length > 0).map((cat) => (
          <div key={cat} className="flex flex-col gap-2">
            <h2
              className="font-mono text-xs tracking-widest uppercase px-1"
              style={{ color: THEME.copper }}
            >
              {cat}
            </h2>
            <div className="flex flex-col gap-2">
              {grouped[cat].map((item, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onAdjust={quickAdjust}
                  onEdit={setEditTarget}
                  onDelete={deleteItem}
                  onMoveUp={(i) => moveItem(i, -1)}
                  onMoveDown={(i) => moveItem(i, 1)}
                  isFirst={idx === 0}
                  isLast={idx === grouped[cat].length - 1}
                />
              ))}
            </div>
          </div>
        ))}

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

            <h3
              className="font-mono text-xs tracking-widest uppercase mt-5 mb-2"
              style={{ color: THEME.copper }}
            >
              Historique des mouvements
            </h3>
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <ItemFormModal categories={categories} onClose={() => setShowAdd(false)} onSubmit={addItem} />
      )}
      {editTarget && (
        <ItemFormModal
          categories={categories}
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={updateItem}
        />
      )}
      {showCategories && (
        <CategoryManagerModal
          categories={categories}
          itemCounts={itemCounts}
          onClose={() => setShowCategories(false)}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
        />
      )}
      {adjustTarget && (
        <AdjustModal
          item={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onConfirm={applyMovement}
        />
      )}
    </div>
  );
}
