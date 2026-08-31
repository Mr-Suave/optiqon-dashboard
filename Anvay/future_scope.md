# Future Scope: Next Phases for Optiqon Optimization Project

Okay so we have the three solvers working (Classical baselines, D-Wave Quantum Annealers, and Coherent Ising Machines), and we've got a functional dashboard to visualize the results across our sector problems. According to me, from here on out, the developments possible boil down to three main things. Here is a breakdown of how we can make things better in these aspects.

## 1. Enhancing the Dashboard for Live Execution
Right now, our Streamlit dashboard does a good job of reading JSON files and just displaying the stats and solutions we've already generated. But to make this a true product, it needs to be dynamic. 

We need to let it run a live problem. Instead of just looking at past benchmarks, the user should be able to tweak the problem parameters (like the size of a financial portfolio or the number of nodes in a logistics network) and hit "Run". The dashboard should then spin up the problem, dispatch it to the selected solver (or all three concurrently), and stream the results back in real-time. This means we'll need to integrate the solver scripts directly into the backend of the app so it's not just a static viewer anymore.

## 2. Fine-Tuning the Solvers for State-of-the-Art Accuracy
Before we scale up too much, we need to first fine-tune the solvers to make sure they are giving us extremely accurate, state-of-the-art results. It's one thing to just get an energy reading, but we need to ensure the QUBO formulations and embedding parameters are heavily optimized. 

For the D-Wave machines, we should look into tweaking the chain strength, annealing time, and number of reads. For the classical baselines (like Simulated Annealing and Tensor Networks) and our CIM approach, we need to ensure the hyperparameters are dialed in perfectly for each specific sector problem. The goal here is to confidently say our results represent the absolute best that each hardware or algorithmic approach can achieve right now.

## 3. Developing an ML Model for Automated Solver Selection
This is prolly the most exciting part. Once we have a massive dataset of how these three solvers perform across different types of problems, sizes, and complexities, we could make a model (prolly ML) that learns from this data. 

The idea is that when a totally new optimization problem comes in, this ML model analyzes the problem's characteristics (size, matrix density, constraints) and automatically applies the best solver according to our historical data. It would act as a smart orchestrator—routing heavy, highly constrained problems to the Quantum or CIM solvers where they shine, while keeping simpler tasks on classical hardware to save costs and time. This essentially turns our project from just a benchmarking script into an intelligent, hardware-agnostic optimization engine.
