export default class BalancingMath {
    /**
     * Solves the intersection of 3 circles using gradient descent optimization.
     * Method B: Centers at (Vi, angle_i), Radius V0.
     * @param {number} v0 - Initial amplitude (Radius for all circles)
     * @param {Array} runs - Array of run objects [{ r: number, theta: number }]
     * @returns {Object} { r, theta, x, y, error }
     */
    static solveIntersection(v0, runs) {
        // Runs are expected to be in degrees.
        // Convert runs to Cartesian centers for the circles.
        
        // CORRECCION (User Spec): 
        // Centro del círculo nace en el Radio Inicial (V0) al ángulo del ensayo.
        // El Radio del círculo es la Amplitud del ensayo (Vi).
        
        const centers = runs.map(run => {
            const rad = run.theta * Math.PI / 180;
            return {
                x: v0 * Math.cos(rad), // Center is at V0
                y: v0 * Math.sin(rad),
                r: run.r // Radius is the Run Amplitude
            };
        });

        // Optimization: Find point P(x,y) that is exactly distance R from all centers.
        // We minimize the sum of squared errors: sum((dist(P, Ci) - R)^2)
        
        let x = 0, y = 0;
        const learningRate = 0.01;
        const iterations = 10000;
        let finalError = 0;

        for (let i = 0; i < iterations; i++) {
            let gradX = 0;
            let gradY = 0;
            let currentErrorSum = 0;

            for (const c of centers) {
                const dx = x - c.x;
                const dy = y - c.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Error = actual distance - target radius
                const error = dist - c.r;
                currentErrorSum += Math.abs(error);

                if (dist > 0.0001) {
                    // Gradient of (dist - R)^2
                    // d/dx = 2 * (dist - R) * (x - cx) / dist
                    // We sum the gradients
                    gradX += 2 * error * dx / dist;
                    gradY += 2 * error * dy / dist;
                }
            }
            
            finalError = currentErrorSum;

            // Move in opposite direction of gradient
            x -= learningRate * gradX;
            y -= learningRate * gradY;

            // Stop if gradient is very small
            if (Math.sqrt(gradX * gradX + gradY * gradY) < 0.00001) break;
        }

        const r_sol = Math.sqrt(x * x + y * y);
        let theta_sol_deg = Math.atan2(y, x) * 180 / Math.PI;
        if (theta_sol_deg < 0) theta_sol_deg += 360;

        return {
            x: x,
            y: y,
            r: r_sol,
            theta: theta_sol_deg,
            error: finalError
        };
    }

    /**
     * Calculates vectors for the vector diagram.
     * V = Run Vector
     * Resultant = Sum of all Run Vectors + Initial Vector?? 
     * Actually, usually the vector graph shows the effect of trial weights.
     * But based on the user image:
     * We have V1, V2, V3 vectors.
     * Resultant = V1 + V2 + V3 (Vector Sum).
     * Opposite = -Resultant (180 deg shift).
     * @param {Array} runs 
     */
    static calculateVectors(runs) {
        let sumX = 0;
        let sumY = 0;

        runs.forEach(run => {
            const rad = run.theta * Math.PI / 180;
            sumX += run.r * Math.cos(rad);
            sumY += run.r * Math.sin(rad);
        });

        const r_res = Math.sqrt(sumX * sumX + sumY * sumY);
        let theta_res_deg = Math.atan2(sumY, sumX) * 180 / Math.PI;
        if (theta_res_deg < 0) theta_res_deg += 360;

        // Opposite
        let theta_opp_deg = theta_res_deg + 180;
        if (theta_opp_deg >= 360) theta_opp_deg -= 360;

        return {
            resultant: { r: r_res, theta: theta_res_deg },
            opposite: { r: r_res, theta: theta_opp_deg }
        };
    }
}
