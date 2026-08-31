# Optiqon

Optiqon is a dashboard for comparing how different types of computers solve the same optimization problem.

It takes real-world scheduling and planning problems from a handful of industries (healthcare, logistics, banking, energy, and more) and shows how three different solvers tackle each one:

- **Optiqon CIM** — a coherent Ising machine solver
- **D-Wave Advantage** — a quantum annealing solver (real QPU hardware)
- **Classical CPU** — a traditional computer running the same problem for comparison

## What it does

1. **Pick a sector** — Healthcare, Logistics, Banking, Energy, Manufacturing, Retail, Telecom, or Aviation. Each sector comes with its own real optimization problem (for example, Healthcare is about scheduling surgeries efficiently).
2. **View the results** — for each solver, the dashboard shows:
   - The **minimum energy** found (lower is generally better — it represents how good the solution is)
   - The **status** of the run (success, error, etc.)
   - The **qubit/variable state** — which variables the solver turned "on" (1) or "off" (0) to reach its answer
3. **Compare side-by-side** — since different solvers can arrive at different but equally valid solutions, you can visually compare how each one "chose" to solve the same problem.
4. **Tune the problem** — there's a "Risk Penalty (Gamma)" slider that lets you adjust how the problem itself is formulated before re-running it.

## How data loads

The app tries to fetch live results from a local backend server (`http://localhost:8000`). If no backend is running, it automatically falls back to pre-computed result files bundled with the app, so the dashboard still works and shows real results without needing a server running.

## Running it

```bash
npm install
npm run dev
```

This starts the Vite dev server. Open the printed local URL in your browser to view the dashboard.

## Project structure (high level)

- `src/App.tsx` — main dashboard UI: sector selection, hyperparameter panel, results display
- `src/sectors.json` — display text (titles/descriptions) shown per sector
- `src/data/` — pre-computed solution files per solver (`cim_solutions/`, `dwave_solutions/`, `classical_solutions/`), used as the offline fallback

---

Built with React, TypeScript, and Vite.