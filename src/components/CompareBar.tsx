import { Link } from "react-router-dom";
import { X, GitCompareArrows } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";

export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[95vw]">
      <div className="glass-strong rounded-2xl shadow-xl border border-border px-4 py-3 flex items-center gap-3">
        <GitCompareArrows className="h-4 w-4 text-rose-burnt shrink-0" strokeWidth={1.5} />
        <div className="flex items-center gap-2">
          {items.map((p) => (
            <div key={p.id} className="relative">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-champagne border border-border">
                {p.cover_url && <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" />}
              </div>
              <button
                onClick={() => remove(p.id)}
                aria-label="Remover"
                className="absolute -top-1.5 -right-1.5 bg-graphite text-pearl rounded-full p-0.5 hover:bg-rose-burnt"
              >
                <X className="h-2.5 w-2.5" strokeWidth={2} />
              </button>
            </div>
          ))}
          {Array.from({ length: 3 - items.length }).map((_, i) => (
            <div key={i} className="h-12 w-12 rounded-lg border border-dashed border-border/70 bg-pearl/40" />
          ))}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={clear}
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-graphite px-2"
          >
            Limpar
          </button>
          <Link
            to="/comparar"
            className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.22em] transition-colors ${
              items.length >= 2
                ? "bg-graphite text-pearl hover:bg-rose-burnt"
                : "bg-muted text-muted-foreground pointer-events-none"
            }`}
          >
            Comparar ({items.length})
          </Link>
        </div>
      </div>
    </div>
  );
}
