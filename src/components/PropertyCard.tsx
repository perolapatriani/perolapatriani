import { Link } from "react-router-dom";
import { BedDouble, Maximize2, Car, MapPin, GitCompareArrows, Check } from "lucide-react";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";

export interface PropertyCardData {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  price: number | null;
  bedrooms: number | null;
  area_m2: number | null;
  parking: number | null;
  neighborhood_name: string | null;
  is_new: boolean | null;
  is_featured: boolean | null;
}

export default function PropertyCard({ p, className }: { p: PropertyCardData; className?: string }) {
  const { add, remove, has } = useCompare();
  const inCompare = has(p.id);
  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) remove(p.id); else add(p);
  };
  return (
    <Link
      to={`/imoveis/${p.slug}`}
      className={cn(
        "group block luxe-card overflow-hidden transition-all duration-700",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-champagne">
        {p.cover_url && (
          <img
            src={p.cover_url}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform [transition-duration:1400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute top-4 left-4 flex gap-2">
          {p.is_new && (
            <span className="glass-strong px-3 py-1 rounded-full text-[10px] font-editorial uppercase tracking-[0.2em] text-graphite">
              Novo
            </span>
          )}
          {p.is_featured && (
            <span className="bg-graphite text-pearl px-3 py-1 rounded-full text-[10px] font-editorial uppercase tracking-[0.2em]">
              Destaque
            </span>
          )}
        </div>
      </div>
      <div className="p-6 space-y-4">
        {p.neighborhood_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" strokeWidth={1.5} />
            <span className="font-editorial uppercase tracking-[0.2em]">{p.neighborhood_name}</span>
          </div>
        )}
        <h3 className="font-display text-2xl text-graphite leading-tight">{p.title}</h3>
        <div className="font-display text-2xl text-rose-burnt">{formatPrice(p.price)}</div>
        <div className="flex items-center gap-5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
          {p.bedrooms != null && (
            <span className="flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5" strokeWidth={1.5} />{p.bedrooms} dorm.</span>
          )}
          {p.area_m2 != null && (
            <span className="flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />{Number(p.area_m2)} m²</span>
          )}
          {p.parking != null && p.parking > 0 && (
            <span className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5" strokeWidth={1.5} />{p.parking} vagas</span>
          )}
        </div>
      </div>
    </Link>
  );
}
