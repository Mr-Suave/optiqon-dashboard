import streamlit as st
import subprocess
import os
import sys
import json
import matplotlib.pyplot as plt
import networkx as nx
import pandas as pd
import numpy as np

# Page Configuration
st.set_page_config(
    page_title="Optiqon Sector Optimizer",
    page_icon="⚛️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern styling
st.markdown("""
<style>
    .stButton>button {
        width: 100%;
        border-radius: 8px;
        height: 50px;
        background-color: #4CAF50;
        color: white;
        font-size: 18px;
        font-weight: bold;
    }
    .stButton>button:hover {
        background-color: #45a049;
        color: white;
    }
    .dwave-panel {
        background-color: #1E1E1E;
        padding: 20px;
        border-radius: 10px;
        border-left: 5px solid #00E5FF;
        margin-bottom: 20px;
    }
</style>
""", unsafe_allow_html=True)

# Sector Data Mapping
sectors = {
    "Healthcare": {"folder": "01_Healthcare", "problem": "Operating Room Load Balancing (Number Partitioning)", "icon": "🏥"},
    "Logistics": {"folder": "02_Logistics", "problem": "Delivery Zone Partitioning (Max Cut)", "icon": "🚚"},
    "Banking & Finance": {
        "icon": "🏦",
        "subsectors": {
            "Systemic Risk Contagion": {"folder": "03_Banking", "problem": "Systemic Risk Contagion (Minimum Vertex Cover)"},
            "Portfolio Optimization": {"folder": "09_Portfolio", "problem": "Nifty Midcap 150 (Integer Encoding Markowitz)"}
        }
    },
    "Energy": {"folder": "04_Energy", "problem": "Power Grid Unit Commitment (Subset Sum)", "icon": "⚡"},
    "Manufacturing": {"folder": "05_Manufacturing", "problem": "Sensor Placement / Defect Detection (Max Independent Set)", "icon": "🏭"},
    "Retail": {"folder": "06_Retail", "problem": "Promo Selection with Conflicts (Constrained Optimization)", "icon": "🛒"},
    "Telecommunications": {"folder": "07_Telecom", "problem": "Antenna Frequency Assignment (Max Cut)", "icon": "📡"},
    "Aviation": {"folder": "08_Aviation", "problem": "Flight Crew Pairing (Max Weight Matching)", "icon": "✈️"},
    "Automobile": {"folder": "11_Automobile", "problem": "Paint Shop Sequence Optimization (Binary Paint Shop)", "icon": "🚗"}
}

# Sidebar
st.sidebar.title("⚛️ Optiqon Control Panel")
st.sidebar.markdown("Select an industry sector to load the specific optimization problem.")
selected_sector = st.sidebar.selectbox("Choose Sector", list(sectors.keys()))

sector_info = sectors[selected_sector]
icon = sector_info["icon"]

if "subsectors" in sector_info:
    selected_subsector = st.sidebar.selectbox("Choose Sub-Sector", list(sector_info["subsectors"].keys()))
    sub_info = sector_info["subsectors"][selected_subsector]
    folder_name = sub_info["folder"]
    problem_name = sub_info["problem"]
    display_title = f"{icon} {selected_sector} - {selected_subsector}"
else:
    folder_name = sector_info["folder"]
    problem_name = sector_info["problem"]
    selected_subsector = selected_sector
    display_title = f"{icon} {selected_sector} Optimization"

# Main Content Area
st.title(display_title)
st.subheader(f"Problem: {problem_name}")

st.markdown("""
This dashboard compares the solutions from the **D-Wave Advantage QPU** against the **Optiqon Coherent Ising Machine (CIM)** and Classical Baselines.
""")

st.markdown("---")

base_dir = os.path.dirname(os.path.abspath(__file__))

if selected_subsector == "Portfolio Optimization":
    st.markdown("### 📈 Quantum Markowitz Efficient Frontier Analysis")
    
    cim_file = os.path.join(base_dir, "cim_solutions", f"{folder_name}.json")
    dwave_file = os.path.join(base_dir, "dwave_solutions", f"{folder_name}.json")
    class_file = os.path.join(base_dir, folder_name, "classical_solutions.json")
    
    cim_data, dwave_data, class_data = None, None, None
    if os.path.exists(cim_file):
        with open(cim_file, "r") as f: cim_data = json.load(f).get("results", [])
    if os.path.exists(dwave_file):
        with open(dwave_file, "r") as f: dwave_data = json.load(f).get("results", [])
    if os.path.exists(class_file):
        with open(class_file, "r") as f: class_data = json.load(f)
        
    if cim_data or dwave_data or class_data:
        fig, ax = plt.subplots(figsize=(10, 6))
        
        if class_data and "scipy" in class_data:
            c_std = [r['port_std'] for r in class_data['scipy']]
            c_ret = [r['port_ret'] for r in class_data['scipy']]
            ax.plot(c_std, c_ret, 'k--', label='Classical Exact (SciPy)')
            
        if class_data and "simulated_annealing" in class_data:
            sa_std = [r['port_std'] for r in class_data['simulated_annealing']]
            sa_ret = [r['port_ret'] for r in class_data['simulated_annealing']]
            ax.plot(sa_std, sa_ret, 'm.-', alpha=0.5, label='Simulated Annealing')
            
        if cim_data:
            cim_std = [r['port_std'] for r in cim_data]
            cim_ret = [r['port_ret'] for r in cim_data]
            ax.plot(cim_std, cim_ret, 'c^-', label='Optiqon CIM')
            
        if dwave_data:
            dw_std = [r['port_std'] for r in dwave_data]
            dw_ret = [r['port_ret'] for r in dwave_data]
            ax.plot(dw_std, dw_ret, 'rs', markersize=8, label='D-Wave QPU')
            
        if class_data and "greedy" in class_data:
            gr = class_data['greedy']
            ax.plot(gr['port_std'], gr['port_ret'], 'bx', markersize=10, label='Greedy (Top-K Sharpe)')
            
        ax.set_title("Markowitz Efficient Frontier (Risk vs Return)")
        ax.set_xlabel("Portfolio Risk (Standard Deviation)")
        ax.set_ylabel("Expected Return (Annualized)")
        ax.legend()
        ax.grid(True, linestyle='--', alpha=0.7)
        st.pyplot(fig)
        
        # TTS Plot
        st.markdown("### ⏱️ Time-to-Solution (TTS) Comparison")
        times = {}
        if dwave_data: times['D-Wave QPU Access'] = dwave_data[0].get('qpu_access_time_ms', 0)
        if cim_data: times['Optiqon CIM'] = np.mean([r.get('cim_time_ms', 0) for r in cim_data])
        if class_data and "simulated_annealing" in class_data:
            times['Simulated Annealing'] = np.mean([r.get('wall_time_s', 0) * 1000 for r in class_data['simulated_annealing']])
        
        if times:
            fig_bar, ax_bar = plt.subplots(figsize=(8, 4))
            ax_bar.bar(times.keys(), times.values(), color=['#FF5252', '#00E5FF', '#BA68C8'])
            ax_bar.set_ylabel("Execution Time (ms)")
            ax_bar.set_title("Solver Time Comparison (Per Point)")
            st.pyplot(fig_bar)
            
    else:
        st.info("No pre-computed data available. Click the run button below to generate solutions.")
        
else:
    # Standard logic for other sectors
    dwave_file = os.path.join(base_dir, "dwave_solutions", f"{folder_name}.json")
    if os.path.exists(dwave_file):
        with open(dwave_file, "r") as f:
            dwave_data = json.load(f)
            
        st.markdown("### 🌌 D-Wave Quantum Solution")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Response Time (QPU)", f"{dwave_data.get('response_time_s', 'N/A')} s")
        with col2:
            st.metric("Minimum Energy (Cost)", dwave_data.get("minimum_energy", "N/A"))
        with col3:
            st.metric("Variables", dwave_data.get("variables", "N/A"))
            
        st.markdown("**Optimal Binary State:**")
        opt_state = dwave_data.get("optimal_state", {})
        st.code(str(opt_state))

        info = dwave_data.get("info", {})
        st.markdown("#### Solution Visualization")
        
        vis_col1, vis_col2 = st.columns([1, 1])
        
        with vis_col1:
            state_df = pd.DataFrame(list(opt_state.items()), columns=['Variable', 'State'])
            state_df['Variable'] = state_df['Variable'].astype(str)
            state_df = state_df.sort_values(by='Variable')
            
            fig_bar, ax_bar = plt.subplots(figsize=(6, 4))
            colors = ['#00E5FF' if s == 1 else '#444444' for s in state_df['State']]
            ax_bar.bar(state_df['Variable'], state_df['State'], color=colors)
            ax_bar.set_title("Optimal State Vector")
            ax_bar.set_xlabel("Variable Index")
            ax_bar.set_ylabel("Binary State (0 or 1)")
            ax_bar.set_yticks([0, 1])
            st.pyplot(fig_bar)

        with vis_col2:
            edges = None
            if "edges" in info: edges = info["edges"]
            elif "financial_dependencies" in info: edges = info["financial_dependencies"]
            elif "interference_graph" in info: edges = info["interference_graph"]
            elif "conflicts" in info: edges = info["conflicts"]
            
            if edges is not None:
                fig_graph, ax_graph = plt.subplots(figsize=(6, 4))
                G = nx.Graph()
                G.add_edges_from(edges)
                
                node_colors = []
                for node in G.nodes():
                    state = opt_state.get(str(node), 0)
                    node_colors.append('#00E5FF' if state == 1 else '#FF5252')
                    
                pos = nx.spring_layout(G, seed=42)
                nx.draw(G, pos, ax=ax_graph, with_labels=True, node_color=node_colors, 
                        node_size=800, font_color="white", font_weight="bold", edge_color="gray")
                
                ax_graph.set_title("Network Graph (Cyan=1, Red=0)")
                st.pyplot(fig_graph)
                
            elif "compatibility_scores" in info:
                fig_graph, ax_graph = plt.subplots(figsize=(6, 4))
                G = nx.Graph()
                for k, score in info["compatibility_scores"].items():
                    u, v = k.split("_")
                    G.add_edge(int(u), int(v), weight=score)
                    
                node_colors = ['#00E5FF' if opt_state.get(str(node), 0) == 1 else '#FF5252' for node in G.nodes()]
                pos = nx.spring_layout(G, seed=42)
                nx.draw(G, pos, ax=ax_graph, with_labels=True, node_color=node_colors, 
                        node_size=800, font_color="white", font_weight="bold", edge_color="gray")
                
                edge_labels = nx.get_edge_attributes(G, 'weight')
                nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels)
                
                ax_graph.set_title("Crew Compatibility Graph")
                st.pyplot(fig_graph)
                
            elif "P_gen" in info or "surgery_durations" in info:
                vals = info.get("P_gen", info.get("surgery_durations", []))
                fig_val, ax_val = plt.subplots(figsize=(6, 4))
                
                colors = ['#00E5FF' if opt_state.get(str(i), 0) == 1 else '#FF5252' for i in range(len(vals))]
                ax_val.bar(range(len(vals)), vals, color=colors)
                ax_val.set_title("Item Values (Cyan=Selected, Red=Not Selected)")
                ax_val.set_xlabel("Item Index")
                ax_val.set_ylabel("Value / Megawatts / Mins")
                st.pyplot(fig_val)
                
            elif "car_sequence" in info:
                seq = info["car_sequence"]
                fig_val, ax_val = plt.subplots(figsize=(10, 4))
                
                colors = []
                for j, car in enumerate(seq):
                    first_pos = info["occurrences"][str(car - 1)][0]
                    state = opt_state.get(str(car - 1), 0)
                    color_val = state if j == first_pos else (1 - state)
                    colors.append('#00E5FF' if color_val == 1 else '#FF5252')
                
                ax_val.bar(range(len(seq)), [1]*len(seq), color=colors)
                ax_val.set_title("Optimized Paint Shop Sequence (Cyan=Color A, Red=Color B)")
                ax_val.set_xlabel("Assembly Line Position")
                ax_val.set_ylabel("Car Color State")
                ax_val.set_xticks(range(len(seq)))
                ax_val.set_xticklabels(seq, rotation=45)
                st.pyplot(fig_val)
    else:
        st.info("No D-Wave pre-computed results found for this sector.")

st.markdown("---")

# Run Button for CIM
st.markdown("### 💿 Optiqon Coherent Ising Machine (CIM) & Baselines")

cim_solutions_dir = os.path.join(base_dir, "cim_solutions")
os.makedirs(cim_solutions_dir, exist_ok=True)
cim_solutions_file = os.path.join(cim_solutions_dir, f"{folder_name}.txt")

if os.path.exists(cim_solutions_file):
    st.markdown("#### 📝 Last Execution Logs")
    with open(cim_solutions_file, "r") as f:
        st.code(f.read(), language="text")
else:
    st.info("No previous execution logs found. Click the button below to run.")

if st.button(f"🚀 Execute {selected_subsector} Workflow"):
    script_path = os.path.join(base_dir, folder_name, "run_and_verify.py")
    
    with st.spinner("Executing Quantum and Classical scripts. This may take a moment..."):
        try:
            # Inject current environment variables (such as CIM_URL) into the child process
            sub_env = os.environ.copy()
            sub_env["CIM_URL"] = os.environ.get("CIM_URL", "http://192.168.1.230:5050/run_ising")
            
            result = subprocess.run(
                [sys.executable, script_path], 
                capture_output=True, 
                text=True, 
                cwd=os.path.join(base_dir, folder_name),
                env=sub_env
            )
            
            output_content = ""
            if result.stdout:
                output_content += result.stdout
            if result.stderr:
                output_content += "\n--- Warnings / Errors ---\n" + result.stderr
            
            with open(cim_solutions_file, "w") as f:
                f.write(output_content)
                
            st.success("Execution Complete!")
            
            try:
                st.rerun()
            except AttributeError:
                st.experimental_rerun()
                
        except Exception as e:
            st.error(f"Failed to execute the script: {str(e)}")

st.markdown("---")
st.caption("Quantum Benchmarking Interface: D-Wave QPU vs Optiqon CIM vs Classical Baselines")