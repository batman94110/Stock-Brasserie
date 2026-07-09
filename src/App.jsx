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

function isImageUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function CategoryIcon({ value, size = 20 }) {
  if (isImageUrl(value)) {
    return (
      <img
        src={value}
        alt=""
        style={{ width: size,
