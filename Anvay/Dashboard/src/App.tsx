import React, { useState, useEffect } from 'react';
import './App.css';
import sectorData from './sectors.json';

function App() {
  const [selectedSector, setSelectedSector] = useState<string | null>("Healthcare");
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Layout UI State
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // Hyperparameters State
  // const [classicalReads, setClassicalReads] = useState(300);
  // const [classicalSweeps, setClassicalSweeps] = useState(1000);
  // const [dwaveReads, setDwaveReads] = useState(100);
  // const [dwaveAnnealTime, setDwaveAnnealTime] = useState(20);
  // const [cimRuns, setCimRuns] = useState(10);
  const [problemGamma, setProblemGamma] = useState(2.0);

  // Map display names to backend keys matching the generated JSON filenames
  const sectorMap: { [key: string]: string } = {
    "Healthcare": "healthcare",
    "Logistics": "logistics",
    "Banking": "banking",
    "Portfolio": "portfolio",
    "Energy": "energy",
    "Manufacturing": "manufacturing",
    "Retail": "retail",
    "Telecom": "telecom",
    "Aviation": "aviation",
    "Automobile": "automobile"
  };

  // 1. Statically glob all solution JSON files from src/data at build time
const cimModules = import.meta.glob('./data/cim_solutions/*.json', { eager: true });
const dwaveModules = import.meta.glob('./data/dwave_solutions/*.json', { eager: true });
const classicalModules = import.meta.glob('./data/classical_solutions/*.json', { eager: true });

// 2. Map sector display names to exact file prefixes in src/data
const staticFileMap: { [key: string]: string } = {
  "Healthcare": "01_Healthcare",
  "Logistics": "02_Logistics",
  "Banking": "03_Banking",
  "Energy": "04_Energy",
  "Manufacturing": "05_Manufacturing",
  "Retail": "06_Retail",
  "Telecom": "07_Telecom",
  "Aviation": "08_Aviation"
};

const fetchResults = async (sectorName: string | null) => {
  if (!sectorName) return;
  setLoading(true);

  const key = sectorMap[sectorName] || sectorName.toLowerCase();

  try {
    // 1. Try fetching from active backend API
    const res = await fetch(`http://localhost:8000/api/results/${key}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data);
      return;
    }
    throw new Error("Backend server offline");
  } catch (err) {
    // 2. Local Fallback: Look up pre-loaded modules from import.meta.glob
    try {
      const fileName = staticFileMap[sectorName];
      if (!fileName) throw new Error("File mapping not found");

      const cimPath = `./data/cim_solutions/${fileName}.json`;
      const dwavePath = `./data/dwave_solutions/${fileName}.json`;
      const classicalPath = `./data/classical_solutions/${fileName}.json`;

      // Extract module contents or default export
      const cimData = (cimModules[cimPath] as any)?.default || cimModules[cimPath] || null;
      const dwaveData = (dwaveModules[dwavePath] as any)?.default || dwaveModules[dwavePath] || null;
      const classicalData = (classicalModules[classicalPath] as any)?.default || classicalModules[classicalPath] || null;

      setResults({
        cim: cimData,
        dwave: dwaveData,
        classical: classicalData
      });
    } catch (fallbackErr) {
      console.error("Failed to load local static solution files:", fallbackErr);
      setResults(null);
    }
  } finally {
    setLoading(false);
  }
};

  const handleSectorClick = (sector: string) => {
    if (selectedSector === sector) {
      setSelectedSector(null);
      setResults(null); // Clear active results on reset
    } else {
      setSelectedSector(sector);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      if(selectedSector){
      const key = sectorMap[selectedSector] || selectedSector.toLowerCase();
      
      const payload = {
        gamma: problemGamma
      };

      const res = await fetch(`http://localhost:8000/api/execute/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === "Success") {
        alert("Diagnostics run successfully with custom parameters!");
        fetchResults(selectedSector);
      } else {
        alert(`Diagnostics failed: ${data.stderr || 'Unknown error'}`);
      }
    } 
   } catch (err) {
      alert("Results are only for demonstration. To tune hyperparameters, please run backend server locally.");
      console.error(err);
    } finally {
     setExecuting(false);
    }
  };

  const getEnergyDisplay = (solverData: any) => {
    if (loading) return "Loading...";
    if (!solverData) return "--";
    if (solverData.status === "Failed") return "Error";
    const energy = solverData.minimum_energy !== undefined ? solverData.minimum_energy : solverData.energy;
    return energy !== undefined ? energy.toFixed(2) : "--";
  };

  const getStatusDisplay = (solverData: any) => {
    if (loading) return "Refreshing data...";
    if (!solverData) return "Awaiting execution";
    return solverData.status || "Completed";
  };

  useEffect(() => {
    if (selectedSector) {
      fetchResults(selectedSector);
    }
  }, [selectedSector]);

  const currentHeroContent = selectedSector && sectorData[selectedSector as keyof typeof sectorData]
    ? sectorData[selectedSector as keyof typeof sectorData]
    : sectorData.default;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden'  }}>
      {/* Responsive Styles Injected */}
      <style>{`
        @media (max-width: 992px) {
          .split-panel {
            flex-direction: column !important;
            gap: 24px !important;
          }
          .config-panel {
            width: 100% !important;
            height: ${isConfigOpen ? 'auto' : '0px'} !important;
            padding-top: ${isConfigOpen ? '32px' : '0px'} !important;
            padding-bottom: ${isConfigOpen ? '32px' : '0px'} !important;
            border-right: none !important;
            border-bottom: ${isConfigOpen ? 'var(--panel-border)' : 'none'} !important;
          }
          .toggle-btn-close {
            transform: rotate(90deg);
          }
          .toggle-btn-open {
            transform: rotate(90deg);
            top: -16px !important;
            left: 50% !important;
            margin-left: -16px !important;
          }
        }

        @media (max-width: 768px) {
          .app-header {
            padding: 16px 20px !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .app-nav {
            gap: 16px !important;
            justify-content: center !important;
            width: 100% !important;
            flex-wrap: wrap !important;
          }
          .app-main {
            padding: 32px 20px !important;
          }
          .hero-title {
            font-size: 40px !important;
            margin-bottom: 16px !important;
          }
          .hero-desc {
            font-size: 16px !important;
          }
          .workspace-panel {
            padding: 24px !important;
            gap: 32px !important;
          }
          .controls-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 20px !important;
            padding-bottom: 24px !important;
          }
          .execute-btn {
            width: 100% !important;
          }
          .metrics-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .metric-card {
            padding: 24px !important;
          }
          .metric-value {
            font-size: 36px !important;
          }
          .qubit-grid-container {
            flex-direction: column !important;
            gap: 24px !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <header className="app-header" style={{ padding: '24px 48px', borderBottom: 'var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', position: 'relative', zIndex: 10 }}>
        <div className="text-glow" style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '2px' }}>
          OPTIQON
        </div>
        <nav className="app-nav" style={{ display: 'flex', gap: '40px' }}>
          <a href="#" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '16px', fontWeight: 500, letterSpacing: '0.5px' }}>Platform</a>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '16px', fontWeight: 500, letterSpacing: '0.5px', transition: 'color 0.2s' }}>Benchmarks</a>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '16px', fontWeight: 500, letterSpacing: '0.5px', transition: 'color 0.2s' }}>Documentation</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="app-main" style={{ flex: 1, padding: '80px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        
        {/* Ambient background glow (Soft faint green oval behind title) */}
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '900px', maxWidth: '100vw', height: '300px', background: 'var(--accent-neon)', filter: 'blur(150px)', opacity: '0.15', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }}></div>

        {/* Hero Section */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '900px', marginBottom: '72px' }}>
          <h1 className="hero-title" style={{ fontSize: '76px', fontWeight: 300, lineHeight: '1.15', marginBottom: '24px', letterSpacing: '0.04em' }}>
            {currentHeroContent.title} <br />
            <span style={{ fontWeight: 600, letterSpacing: '0.06em' }}>{currentHeroContent.highlight}</span>
          </h1>
          <p className="hero-desc" style={{ fontSize: '20px', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: 300, maxWidth: '700px', margin: '0 auto' }}>
            {currentHeroContent.description}
          </p>
        </div>

        {/* Split Panel Layout */}
        <div className="split-panel" style={{ 
          display: 'flex', 
          // gridTemplateColumns: isConfigOpen ? '350px 1fr' : '0px 1fr', 
          gap: isConfigOpen ? '32px' : '0px', 
          width: '100%', 
          maxWidth: '1400px', 
          position: 'relative', 
          zIndex: 1, 
          // transition: 'all 0.3s ease' 
        }}>
          
          {/* Left Panel: Hyperparameter Configuration */}
          <div className="glass-panel config-panel" style={{ 
            padding: isConfigOpen ? '32px' : '0px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isConfigOpen ? '24px' : '0px', 
            height: 'fit-content', 
            position: 'relative',
            width: isConfigOpen ? '350px' : '0px',
            opacity: isConfigOpen ? 1 : 0,
            overflow: 'hidden',
            border: isConfigOpen ? 'var(--panel-border)' : 'none',
            transition: 'all 0.3s ease',
            pointerEvents: isConfigOpen ? 'auto' : 'none'
          }}>
            
            {/* Collapse Button inside panel */}
            <button 
              className="toggle-btn-close"
              onClick={() => setIsConfigOpen(false)}
              style={{
                position: 'absolute',
                top: '32px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--accent-neon)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 5,
                fontSize: '12px',
                transition: 'transform 0.3s'
              }}
            >
              &lt;
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', letterSpacing: '0.5px' }}>
              Hyperparameters
            </h3>

            {/* Classical Section
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'var(--accent-neon)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Classical CPU</p>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  <span>Num Reads</span>
                  <span style={{ color: 'var(--text-primary)' }}>{classicalReads}</span>
                </label>
                <input type="range" min="100" max="5000" step="100" value={classicalReads} onChange={(e) => setClassicalReads(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-neon)' }} />
              </div>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  <span>Sweeps</span>
                  <span style={{ color: 'var(--text-primary)' }}>{classicalSweeps}</span>
                </label>
                <input type="range" min="500" max="10000" step="500" value={classicalSweeps} onChange={(e) => setClassicalSweeps(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-neon)' }} />
              </div>
            </div>

            {/* D-Wave Section */}
            {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <p style={{ color: '#00E5FF', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>D-Wave Advantage</p>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  <span>Num Reads</span>
                  <span style={{ color: 'var(--text-primary)' }}>{dwaveReads}</span>
                </label>
                <input type="range" min="50" max="1000" step="50" value={dwaveReads} onChange={(e) => setDwaveReads(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-neon)' }} />
              </div>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  <span>Annealing Time (μs)</span>
                  <span style={{ color: 'var(--text-primary)' }}>{dwaveAnnealTime}</span>
                </label>
                <input type="range" min="1" max="200" step="1" value={dwaveAnnealTime} onChange={(e) => setDwaveAnnealTime(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-neon)' }} />
              </div>
            </div> */}

            {/* CIM Section */}
            {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <p style={{ color: 'var(--accent-neon)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Optiqon CIM</p>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  <span>Runs / Iterations</span>
                  <span style={{ color: 'var(--text-primary)' }}>{cimRuns}</span>
                </label>
                <input type="range" min="1" max="100" step="5" value={cimRuns} onChange={(e) => setCimRuns(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-neon)' }} />
              </div>
            </div>  */}

            {/* Problem Tuning Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Problem Formulation</p>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  <span>Risk Penalty (Gamma)</span>
                  <span style={{ color: 'var(--text-primary)' }}>{problemGamma.toFixed(1)}</span>
                </label>
                <input type="range" min="0.1" max="15.0" step="0.1" value={problemGamma} onChange={(e) => setProblemGamma(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-neon)' }} />
              </div>
            </div>
          </div>

          {/* Right Panel: Workspace Center */}
          <div className="glass-panel workspace-panel" style={{ 
              padding: '48px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '48px', 
              position: 'relative',
              flex: 1,
              minWidth: 0
            }}>
            
            {/* Open Button when collapsed */}
            {!isConfigOpen && (
              <button 
                className="toggle-btn-open"
                onClick={() => setIsConfigOpen(true)}
                style={{
                  position: 'absolute',
                  top: '52px',
                  left: '-16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--accent-neon)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  zIndex: 5,
                  fontSize: '12px',
                  transition: 'transform 0.3s'
                }}
              >
                &gt;
              </button>
            )}

            {/* Controls */}
            <div className="controls-container" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid rgba(255,255,255,0.05)', 
              paddingBottom: '32px', 
              gap: '16px' 
            }}>
              <div className="sectors-list" style={{ 
                display: 'flex', 
                gap: '10px', 
                alignItems: 'center', 
                flexWrap: 'nowrap', 
                overflowX: 'auto', 
                paddingBottom: '8px',
                flex: 1,
                minWidth: 0,
                scrollbarWidth: 'thin',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
                {[
                  "Healthcare", 
                  "Logistics", 
                  "Banking", 
                  "Energy", 
                  "Manufacturing", 
                  "Retail", 
                  "Telecom", 
                  "Aviation"
                ].map(sector => (
                  <button 
                    key={sector}
                    onClick={() => handleSectorClick(sector)}
                    disabled={executing}
                    style={{
                      background: selectedSector === sector ? 'rgba(191, 245, 73, 0.1)' : 'transparent',
                      color: selectedSector === sector ? 'var(--accent-neon)' : 'var(--text-secondary)',
                      border: selectedSector === sector ? '1px solid rgba(191, 245, 73, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      cursor: executing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '13px',
                      fontWeight: selectedSector === sector ? 500 : 400,
                      letterSpacing: '0.5px',
                      opacity: executing ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {sector}
                  </button>
                ))}
              </div>

              <button 
                className="btn-primary execute-btn" 
                onClick={handleExecute}
                disabled={executing || !selectedSector}
                style={{ 
                  cursor: (executing || !selectedSector) ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                {executing ? "Executing..." : "Execute Diagnostics"}
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
              <div className="metric-card" style={{ padding: '32px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Optiqon CIM</p>
                <h3 className="metric-value text-glow" style={{ fontSize: '48px', fontWeight: 300 }}>
                  {getEnergyDisplay(results?.cim)}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '16px' }}>
                  {getStatusDisplay(results?.cim)}
                </p>
              </div>
              
              <div className="metric-card" style={{ padding: '32px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>D-Wave Advantage</p>
                <h3 className="metric-value" style={{ fontSize: '48px', fontWeight: 300, color: '#FFFFFF' }}>
                  {getEnergyDisplay(results?.dwave)}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '16px' }}>
                  {getStatusDisplay(results?.dwave)}
                </p>
              </div>
              
              <div className="metric-card" style={{ padding: '32px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Classical CPU</p>
                <h3 className="metric-value" style={{ fontSize: '48px', fontWeight: 300, color: '#FFFFFF' }}>
                  {getEnergyDisplay(results?.classical)}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '16px' }}>
                  {getStatusDisplay(results?.classical)}
                </p>
              </div>
            </div>

            {/* Visualization Area */}
            <div style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.02)', padding: '40px' }}>
              {executing ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--accent-neon)', fontSize: '18px', marginBottom: '8px', fontWeight: 500 }}>Executing Solver Kernels...</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Dispatching tasks to active compute nodes. Please wait.</p>
                </div>
              ) : results ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ color: 'var(--accent-neon)', fontSize: '20px', marginBottom: '8px', fontWeight: 500 }}>Diagnostics Complete</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                      Compare the qubits configurations (active variables) for each solver below. Different solver paths can converge to different, equally valid ground states.
                    </p>
                  </div>
                  
                  {/* Three-Column Qubit Grid comparison */}
                  <div className="qubit-grid-container" style={{ display: 'flex', gap: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', width: '100%', justifyContent: 'space-between' }}>
                    {renderQubitGrid("Optiqon CIM State", results.cim?.optimal_state, "191, 245, 73")}
                    {renderQubitGrid("D-Wave Advantage State", results.dwave?.optimal_state, "0, 229, 255")}
                    {renderQubitGrid("Classical CPU State", results.classical?.optimal_state, "255, 82, 82")}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '15px', letterSpacing: '0.5px' }}>
                  System idle. Select a sector and execute diagnostics to visualize energy landscapes.
                </p>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );  
}

const renderQubitGrid = (title: string, optimalState: any, accentColor: string) => {
  if (!optimalState) {
    return (
      <div style={{ flex: 1, padding: '24px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>No active state data</p>
      </div>
    );
  }
  
  const stateEntries = Object.entries(optimalState).sort((a, b) => Number(a[0]) - Number(b[0]));
  
  return (
    <div style={{ flex: 1, minWidth: '0', width: '100%' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', textAlign: 'left', fontWeight: 600 }}>
        {title}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
        {stateEntries.map(([key, val]) => {
          const isActive = Number(val) === 1;
          return (
            <div 
              key={key} 
              style={{
                padding: '6px 2px',
                borderRadius: '6px',
                background: isActive ? `rgba(${accentColor}, 0.1)` : 'rgba(255,255,255,0.02)',
                border: isActive ? `1px solid rgb(${accentColor})` : '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
                fontSize: '11px',
                color: isActive ? `rgb(${accentColor})` : 'var(--text-secondary)',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '7px', display: 'block', color: 'rgba(255,255,255,0.3)', marginBottom: '1px' }}>q{key}</span>
              {Number(val)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;