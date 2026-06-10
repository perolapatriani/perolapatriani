import { useMemo, useState } from "react";
import { Calculator, ExternalLink } from "lucide-react";

interface Props {
  propertyPrice: number;
}

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const fmt2 = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

// Linhas de crédito Caixa (referência pública 2025)
type LineKey = "sbpe" | "mcmv1" | "mcmv2" | "mcmv3" | "mcmv4";

const LINES: Record<LineKey, {
  name: string;
  rate: number;        // % a.a. nominal de referência
  maxLtv: number;      // % máximo financiável
  maxYears: number;
  income: string;
  note: string;
}> = {
  sbpe:  { name: "SBPE (Mercado)",        rate: 11.49, maxLtv: 80, maxYears: 35, income: "Sem limite de renda",                   note: "Taxa a partir de 10,99% a.a. + TR. Cota até 80% (Price) / 70% (SAC)." },
  mcmv1: { name: "MCMV · Faixa 1",         rate: 5.00,  maxLtv: 80, maxYears: 35, income: "Renda até R$ 2.850/mês",                note: "Taxas de 4,00% a 5,00% a.a. + subsídio do governo de até R$ 55 mil." },
  mcmv2: { name: "MCMV · Faixa 2",         rate: 6.50,  maxLtv: 80, maxYears: 35, income: "Renda de R$ 2.850 a R$ 4.700/mês",     note: "Taxas de 4,75% a 7,00% a.a. + subsídio reduzido." },
  mcmv3: { name: "MCMV · Faixa 3",         rate: 8.16,  maxLtv: 80, maxYears: 35, income: "Renda de R$ 4.700 a R$ 8.600/mês",     note: "Taxas de 7,66% a 8,16% a.a., sem subsídio direto." },
  mcmv4: { name: "MCMV · Faixa 4",         rate: 10.50, maxLtv: 80, maxYears: 35, income: "Renda de R$ 8.600 a R$ 12.000/mês",    note: "Nova faixa (2024). Taxa ~10,5% a.a., teto do imóvel R$ 500 mil." },
};

export default function FinancingSimulator({ propertyPrice }: Props) {
  const [line, setLine] = useState<LineKey>("sbpe");
  const [downPct, setDownPct] = useState(30);
  const [years, setYears] = useState(30);
  const [system, setSystem] = useState<"price" | "sac">("sac");

  const cfg = LINES[line];
  const rate = cfg.rate;

  const result = useMemo(() => {
    const price = Number(propertyPrice) || 0;
    const downValue = (price * downPct) / 100;
    const loan = Math.max(0, price - downValue);
    const n = Math.min(years, cfg.maxYears) * 12;
    const i = rate / 100 / 12;

    // Caixa cobra seguros mensais sobre o saldo devedor + tx. admin fixa.
    // Aproximação publicada: MIP ≈ 0,025%/mês saldo, DFI ≈ 0,0035%/mês valor do imóvel, Tx. Admin R$ 25.
    const mipRate = 0.00025;
    const dfiRate = 0.000035;
    const admin = 25;

    if (loan <= 0 || n <= 0 || i <= 0) {
      return { downValue, loan, firstPayment: 0, lastPayment: 0, totalPaid: downValue, totalInterest: 0 };
    }

    let firstPayment = 0;
    let lastPayment = 0;
    let totalPaid = 0;
    let totalInterest = 0;

    if (system === "price") {
      const pmt = (loan * i) / (1 - Math.pow(1 + i, -n));
      // Seguros: saldo médio aproximado
      let balance = loan;
      let sum = 0;
      let firstWithIns = 0;
      let lastWithIns = 0;
      for (let k = 1; k <= n; k++) {
        const interest = balance * i;
        const amort = pmt - interest;
        const mip = balance * mipRate;
        const dfi = price * dfiRate;
        const total = pmt + mip + dfi + admin;
        if (k === 1) firstWithIns = total;
        if (k === n) lastWithIns = total;
        sum += total;
        totalInterest += interest;
        balance -= amort;
      }
      firstPayment = firstWithIns;
      lastPayment = lastWithIns;
      totalPaid = downValue + sum;
    } else {
      // SAC
      const amort = loan / n;
      let balance = loan;
      let sum = 0;
      let firstWithIns = 0;
      let lastWithIns = 0;
      for (let k = 1; k <= n; k++) {
        const interest = balance * i;
        const mip = balance * mipRate;
        const dfi = price * dfiRate;
        const total = amort + interest + mip + dfi + admin;
        if (k === 1) firstWithIns = total;
        if (k === n) lastWithIns = total;
        sum += total;
        totalInterest += interest;
        balance -= amort;
      }
      firstPayment = firstWithIns;
      lastPayment = lastWithIns;
      totalPaid = downValue + sum;
    }

    return { downValue, loan, firstPayment, lastPayment, totalPaid, totalInterest };
  }, [propertyPrice, downPct, years, system, rate, cfg.maxYears]);

  const caixaUrl = "https://www8.caixa.gov.br/siopiinternet-web/simulaOperacaoInternet.do?method=inicializarCasoUso";

  return (
    <div className="rounded-3xl border border-border bg-pearl/60 p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-5 w-5 text-rose-burnt" strokeWidth={1.5} />
        <h3 className="font-display text-2xl text-graphite">Simulador de financiamento Caixa</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Cálculo fiel à metodologia da Caixa Econômica Federal (SAC/Price + seguros MIP/DFI + tx. administração).
        Os valores são uma estimativa próxima — para a simulação oficial e formalização do crédito, utilize o portal da Caixa.
      </p>

      {/* Linha de crédito */}
      <div>
        <div className="font-editorial text-[10px] uppercase tracking-[0.3em] text-graphite mb-2">Linha de crédito</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {(Object.keys(LINES) as LineKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setLine(k)}
              className={`rounded-xl px-3 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors ${
                line === k
                  ? "bg-graphite text-pearl"
                  : "border border-border text-graphite hover:bg-champagne"
              }`}
            >
              {LINES[k].name}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          <strong className="text-graphite">{cfg.income}.</strong> {cfg.note}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label={`Entrada · ${downPct}%`} sub={fmt((Number(propertyPrice) * downPct) / 100)}>
          <input
            type="range" min={100 - cfg.maxLtv} max={90} step={1}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="w-full accent-rose-burnt"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Mínimo {100 - cfg.maxLtv}% (cota máx. {cfg.maxLtv}%)</p>
        </Field>

        <Field label={`Prazo · ${years} anos`} sub={`${years * 12} parcelas`}>
          <input
            type="range" min={5} max={cfg.maxYears} step={1}
            value={years}
            onChange={(e) => setYears(Math.min(Number(e.target.value), cfg.maxYears))}
            className="w-full accent-rose-burnt"
          />
        </Field>

        <Field label={`Taxa de juros · ${rate.toFixed(2)}% a.a.`} sub="Definida pela linha selecionada">
          <div className="h-2 rounded-full bg-champagne overflow-hidden">
            <div className="h-full bg-rose-burnt" style={{ width: `${(rate / 16) * 100}%` }} />
          </div>
        </Field>

        <Field label="Sistema de amortização" sub={system === "price" ? "Parcelas fixas" : "Parcelas decrescentes (padrão Caixa)"}>
          <div className="flex gap-2 mt-1">
            {(["sac", "price"] as const).map((s) => (
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
          label={system === "sac" ? "1ª parcela (com seguros)" : "Parcela mensal (com seguros)"}
          value={fmt2(result.firstPayment)}
          highlight
        />
        {system === "sac" && <Stat label="Última parcela (com seguros)" value={fmt2(result.lastPayment)} />}
        <Stat label="Juros totais" value={fmt(result.totalInterest)} />
        <Stat label="Total a pagar (com entrada)" value={fmt(result.totalPaid)} />
      </div>

      <a
        href={caixaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-rose-burnt px-6 py-3 text-xs uppercase tracking-[0.2em] text-pearl transition hover:opacity-90"
      >
        Simular no site oficial da Caixa
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
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
