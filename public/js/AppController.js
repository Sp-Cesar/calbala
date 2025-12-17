import BalancingMath from './BalancingMath.js';

export default class AppController {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        const btnDraw = document.getElementById('btn-draw');
        if (btnDraw) {
            btnDraw.addEventListener('click', () => this.calculateAndDraw());
        }
    }

    getInputs() {
        // Helper to get float value
        const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;

        return {
            v0: getVal('init-amp'),
            testMass: getVal('test-mass'),
            runs: [
                { r: getVal('t1-amp'), theta: getVal('t1-phase'), color: '#22c55e' }, // Green
                { r: getVal('t2-amp'), theta: getVal('t2-phase'), color: '#a855f7' }, // Purple
                { r: getVal('t3-amp'), theta: getVal('t3-phase'), color: '#eab308' }  // Yellow
            ]
        };
    }

    calculateAndDraw() {
        const inputs = this.getInputs();

        // 1. Calculate Solution (Trilateration)
        const solution = BalancingMath.solveIntersection(inputs.v0, inputs.runs);
        
        // 2. Calculate Vectors (Vector Sum)
        const vectors = BalancingMath.calculateVectors(inputs.runs);

        // 3. Update Results UI
        this.updateResultsUI(solution, vectors);

        // 4. Draw Graphs
        if (window.trilaterationGraph) {
            window.trilaterationGraph.drawTrilateration(inputs.v0, inputs.runs, solution);
        }
        if (window.vectorsGraph) {
            window.vectorsGraph.drawVectors(inputs.runs, vectors.resultant, vectors.opposite);
        }
    }

    updateResultsUI(solution, vectors) {
        document.getElementById('res-mag').textContent = solution.r.toFixed(3);
        document.getElementById('res-phase').textContent = solution.theta.toFixed(1) + '°';
        document.getElementById('res-error').textContent = solution.error.toExponential(2);
    }
}

// Initialize
new AppController();
