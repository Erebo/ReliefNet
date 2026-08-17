package com.reliefnet.service;

import com.reliefnet.exception.RoadSubmergedException;

/**
 * Concrete implementation of abstract ReliefOperation.
 */
public class FloodReliefOperation extends ReliefOperation {
    private String  severity;
    private boolean isRoadCutOff;

    public FloodReliefOperation(String destinationArea, int targetHouseholds,
                                String assignedProvider, String severity, boolean isRoadCutOff) {
        super(destinationArea, targetHouseholds, assignedProvider);
        this.severity     = severity;
        this.isRoadCutOff = isRoadCutOff;
    }

    @Override
    protected void validateRoute() throws RoadSubmergedException {
        System.out.println("  [Validate] Checking transit route for " + destinationArea + " (Severity: " + severity + ")");
        if (isRoadCutOff) {
            throw new RoadSubmergedException("Main highway to " + destinationArea + " is submerged under 4.5ft floodwaters!");
        }
        System.out.println("  [Validate] Road route accessible for relief trucks.");
    }

    @Override
    protected int[] calculateCargo() {
        int multiplier = severity.equals("CRITICAL") ? 3 : severity.equals("SEVERE") ? 2 : 1;
        int food       = targetHouseholds * multiplier * 2;
        int water      = targetHouseholds * multiplier * 10;
        int medicine   = targetHouseholds * multiplier;
        System.out.println("  [Cargo] food=" + food + " water=" + water + "L medicine=" + medicine);
        return new int[]{food, water, medicine};
    }

    @Override
    protected void generateDispatchOrder(int[] cargo) {
        System.out.println("  [Order] -> " + destinationArea
            + "  food:" + cargo[0]
            + "  water:" + cargo[1] + "L"
            + "  med:" + cargo[2]
            + "  provider:" + assignedProvider);
    }
}
