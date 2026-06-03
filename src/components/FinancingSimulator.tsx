import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";

interface Props {
  propertyPrice: number;
}

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function FinancingSimulator({ propertyPrice }: Props) {
  const [downPct, setDownPct] = useState(30);
  const [years, setYears] = useState(30);
  const [rate, setRate] = useState(11); // % a.a.
  const [system, setSystem] = useState<"price" | "sac">("price");

  const result = useMemo(() => {
    const price = Number(propertyPrice) || 0;
    const downValue = (price * downPct) / 100;
    const loan = Math.max(0, price - downValue);
    const n = years * 12;
    const i = rate / 100 / 12;

    if (loan <= 0 || n <= 0 || i <= 0) {
      return { downValue, loan, firstPayment: 0, lastPayment: 0, totalPaid: downValue };
    }

    if (system === "price") {
      const pmt = (loan * i) / (1 - Math.pow(1 + i, -n));
      return {
        downValue,
        loan,
        firstPayment: pmt,
        lastPayment: pmt,
        totalPaid: downValue + pmt * n,
      };
    } else {
      // SAC
      const amort = loan / n;
      const first = amort + loan * i;
      const last = amort + amort * i;
      // soma = n*amort + i * soma(saldos), saldos = loan, loan-amort, ..., amort
      // soma juros = i * amort * n * (n+1) / 2
      const totalInterest = i * amort * (n + 1) * 0.5 * n / n * n; // simplified
      const totalInterestExact = i * (amort * ((n * (n + 1)) / 2));
      return {
        downValue,
        loan,
        firstPayment: first,
        lastPayment: last,
        totalPaid: downValue + loan + totalInterestExact,
      };
    }
  }, [propertyPrice, downPct, years, rate, system]);

  return (
    <div className="rounded-3xl border border-border bg-pearl/60 p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-5 w-5 text-rose-burnt" strokeWidth={1.5} />
        <h3 className="font-display text-2xl text-graphite">Simulador de financiamento</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Estimativa para visualização. Condições reais variam conforme banco, score e perfil de renda.
      </p>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label={`Entrada · ${downPct}%`} sub={fmt((Number(propertyPrice) * downPct) / 100)}>
          <input
            type="range" min={10} max={90} step={1}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="w-full accent-rose-burnt"
          />
        </Field>

        <Field label={`Prazo · ${years} anos`} sub={`${years * 12} parcelas`}>
          <input
            type="range" min={5} max={35} step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-rose-burnt"
          />
        </Field>

        <Field label={`Taxa de juros · ${rate.toFixed(2)}% a.a.`} sub="Referência atual do mercado">
          <input
            type="range" min={6} max={16} step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-rose-burnt"
          />
        </Field>

        <Field label="Sistema de amortização" sub={system === "price" ? "Parcelas fixas" : "Parcelas decrescentes"}>
          <div className="flex gap-2 mt-1">
            {(["price", "sac"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSystem(s)}
                className={`flex-1 rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                  system === s
                    ? "bg-graphite text-pearl"
                    : "border border-border text-graphite hover:bg-champagne"
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
        <Stat label="Valor financiado" value={fmt(result.loan)} />
        <Stat
          label={system === "sac" ? "Primeira parcela" : "Parcela mensal"}
          value={fmt(result.firstPayment)}
          highlight
        />
        {system === "sac" && <Stat label="Última parcela" value={fmt(result.lastPayment)} />}
        <Stat label="Total a pagar (com entrada)" value={fmt(result.totalPaid)} />
      </div>
    </div>
  );
}

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-editorial text-[10px] uppercase tracking-[0.3em] text-graphite">{label}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{label}</p>
      <p className={`font-display ${highlight ? "text-3xl text-rose-burnt" : "text-xl text-graphite"}`}>{value}</p>
    </div>
  );
}
