package com.linkedit.routing.optimization;

import com.graphhopper.jsprit.core.algorithm.VehicleRoutingAlgorithm;
import com.graphhopper.jsprit.core.algorithm.box.Jsprit;
import com.graphhopper.jsprit.core.problem.VehicleRoutingProblem;
import com.graphhopper.jsprit.core.problem.solution.VehicleRoutingProblemSolution;
import com.graphhopper.jsprit.core.util.Solutions;
import com.linkedit.routing.exception.OptimizationException;
import java.util.Collection;
import org.springframework.stereotype.Component;

@Component
public class JspritOptimizer {

    static final int DEVELOPMENT_ITERATIONS = 200;

    public VehicleRoutingProblemSolution optimize(VehicleRoutingProblem problem) {
        try {
            VehicleRoutingAlgorithm algorithm = Jsprit.Builder.newInstance(problem).buildAlgorithm();
            algorithm.setMaxIterations(DEVELOPMENT_ITERATIONS);
            Collection<VehicleRoutingProblemSolution> solutions = algorithm.searchSolutions();
            VehicleRoutingProblemSolution best = Solutions.bestOf(solutions);
            if (best == null) throw new OptimizationException("jsprit returned no solution");
            return best;
        } catch (OptimizationException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new OptimizationException("Routing optimization failed", exception);
        }
    }
}
