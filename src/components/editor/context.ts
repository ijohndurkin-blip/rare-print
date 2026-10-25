"use client";

import { createContext, useContext } from "react";
import type { Canvas, FabricObject } from "fabric";
import type { Product } from "@/lib/products";
import type { Layout } from "@/lib/layout";
import type { BusinessDetails } from "@/lib/templates";
import type { Dims } from "./engine";

export type PanelId = "ai" | "templates" | "text" | "uploads" | "shapes" | "background";

export interface LibraryImage {
  id: string;
  src: string;
  label: string;
  kind: "ai" | "upload";
  transparent?: boolean;
}

export interface EditorApi {
  canvas: Canvas | null;
  dims: Dims;
  product: Product;
  side: string;
  selection: FabricObject | null;
  /** Increments whenever the canvas changes, so panels re-render. */
  tick: number;
  refresh: () => void;
  commit: () => void;
  details: Partial<BusinessDetails>;
  setDetails: (d: Partial<BusinessDetails>) => void;
  toast: (message: string, kind?: "info" | "success" | "error") => void;
  addObject: (obj: FabricObject, opts?: { center?: boolean; select?: boolean }) => void;
  applyLayout: (layout: Layout) => Promise<void>;
  library: LibraryImage[];
  addToLibrary: (img: Omit<LibraryImage, "id">) => LibraryImage;
  addImage: (src: string, opts?: { asBackground?: boolean; transparent?: boolean }) => Promise<void>;
  aiEnabled: boolean;
  aiBusy: number;
  setAiBusy: (fn: (n: number) => number) => void;
  openPanel: (id: PanelId) => void;
  palette: string[];
}

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside the Studio");
  return ctx;
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Something went wrong. Please try again.");
  return data as T;
}

export const SWATCHES = [
  "#000000", "#ffffff", "#0f172a", "#475569", "#94a3b8", "#e2e8f0",
  "#dc2626", "#ea580c", "#f59e0b", "#facc15", "#16a34a", "#0d9488",
  "#0ea5e9", "#2563eb", "#7c3aed", "#db2777", "#e11d74", "#d4af37",
  "#7c2d12", "#14213d", "#fef3c7", "#fdf2f8", "#ecfeff", "#f5f5f4",
];
