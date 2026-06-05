import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { toast } from "sonner";
import type { PropertyCardData } from "@/components/PropertyCard";

const STORAGE_KEY = "perola_compare_v1";
const MAX_ITEMS = 3;

interface CompareContextValue {
  items: PropertyCardData[];
  add: (p: PropertyCardData) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PropertyCardData[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add = useCallback((p: PropertyCardData) => {
    setItems((prev) => {
      if (prev.find((x) => x.id === p.id)) return prev;
      if (prev.length >= MAX_ITEMS) {
        toast.error(`Máximo de ${MAX_ITEMS} imóveis no comparador`);
        return prev;
      }
      toast.success("Adicionado ao comparador");
      return [...prev, p];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((id: string) => items.some((x) => x.id === id), [items]);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, has, isFull: items.length >= MAX_ITEMS }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
