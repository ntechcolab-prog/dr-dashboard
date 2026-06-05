# Digital Reports — Dashboard (code recreation)

Recriação funcional da tela **Dashboard / Batches** do Digital Reports (NOTI), a partir do
Figma de produção `tx5EIqycBjXKI1aF7hExGA`, node `209:4607`.

## Stack

- React 18 + Vite 6
- Tailwind CSS v4 (`@tailwindcss/vite`), tokens do DS no `@theme` de `src/index.css`
- Charts e calendário 100% custom (CSS/SVG), sem libs de gráfico
- Fonte Roboto (chrome do produto)

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de produção em dist/
```

## O que é funcional

- **Filtros reais**: máquina e receita filtram o dataset; KPIs, calendário e rankings recalculam.
- **Monthly / Weekly**: alterna calendário mensal ↔ strip semanal com navegação de semana.
- **Dropdown de mês** (Feb/Mar/Abr 2026) — deltas dos KPIs são período-sobre-período reais.
- **Clear Filters**, tabs Batches/Machine.
- **Details** (KPI e dia do calendário) abre drawer lateral com a lista de batches.

## Dados

Sintéticos e determinísticos (PRNG seedado) em `src/data/mockData.js` — 3 meses de batches
por máquina/receita/status. `src/lib/compute.js` concentra as agregações.

## Pendências / próximos passos

- View "Machine" é placeholder (a tela do Figma detalha só Batches).
- Cores dos bar charts seguem paleta por ranking — confirmar mapeamento exato vs Figma.
- Trocar mock por API quando houver endpoint.
