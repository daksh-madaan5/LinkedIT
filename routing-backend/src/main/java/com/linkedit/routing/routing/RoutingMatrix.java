package com.linkedit.routing.routing;

import com.linkedit.routing.exception.RoutingProviderException;
import java.util.Arrays;
import java.util.Map;

/** Immutable matrix with distances in metres and durations in seconds. */
public final class RoutingMatrix {

    private final Map<String, Integer> indexByLocationId;
    private final double[][] distancesMetres;
    private final double[][] durationsSeconds;

    public RoutingMatrix(
        Map<String, Integer> indexByLocationId,
        double[][] distancesMetres,
        double[][] durationsSeconds
    ) {
        this.indexByLocationId = Map.copyOf(indexByLocationId);
        this.distancesMetres = validateAndCopy("distance", distancesMetres);
        this.durationsSeconds = validateAndCopy("duration", durationsSeconds);
        if (this.distancesMetres.length != this.durationsSeconds.length) {
            throw new RoutingProviderException("OSRM distance and duration matrix dimensions differ");
        }
        int size = this.distancesMetres.length;
        for (Map.Entry<String, Integer> entry : this.indexByLocationId.entrySet()) {
            if (entry.getValue() == null || entry.getValue() < 0 || entry.getValue() >= size) {
                throw new RoutingProviderException("Invalid matrix index for location '" + entry.getKey() + "'");
            }
        }
    }

    public double distanceMetres(String fromId, String toId) {
        return distancesMetres[indexOf(fromId)][indexOf(toId)];
    }

    public double durationSeconds(String fromId, String toId) {
        return durationsSeconds[indexOf(fromId)][indexOf(toId)];
    }

    public Map<String, Integer> indexByLocationId() {
        return indexByLocationId;
    }

    private int indexOf(String locationId) {
        Integer index = indexByLocationId.get(locationId);
        if (index == null) throw new RoutingProviderException("Location '" + locationId + "' is absent from the routing matrix");
        return index;
    }

    private static double[][] validateAndCopy(String name, double[][] matrix) {
        if (matrix == null) throw new RoutingProviderException("OSRM response is missing the " + name + " matrix");
        int size = matrix.length;
        double[][] copy = new double[size][];
        for (int row = 0; row < size; row++) {
            if (matrix[row] == null || matrix[row].length != size) {
                throw new RoutingProviderException("OSRM " + name + " matrix has invalid dimensions");
            }
            copy[row] = Arrays.copyOf(matrix[row], size);
            for (int column = 0; column < size; column++) {
                if (!Double.isFinite(copy[row][column]) || copy[row][column] < 0) {
                    throw new RoutingProviderException(
                        "OSRM returned an invalid or unroutable " + name + " at matrix[" + row + "][" + column + "]"
                    );
                }
            }
        }
        return copy;
    }
}
