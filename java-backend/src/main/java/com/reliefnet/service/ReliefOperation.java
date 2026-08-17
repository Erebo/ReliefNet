package com.reliefnet.service;

import com.reliefnet.exception.RoadSubmergedException;

/**
 * Pillar 4: ABSTRACTION (Template Method Pattern)
 * Defines the public dispatch contract while hiding validation & cargo calculation.
 */
public abstract class ReliefOperation {
    protected String destinationArea;
    protected int    targetHouseholds;
    protected String assignedProvider;

    public ReliefOperation(String destinationArea, int targetHouseholds, String assignedProvider) {
        this.destinationArea  = destinationArea;
        this.targetHouseholds = targetHouseholds;
        this.assignedProvider = assignedProvider;
    }

    // Public contract exposed to caller
    public final void dispatch() {
        try {
            validateRoute();
            int[] cargo = calculateCargo();
            generateDispatchOrder(cargo);
            System.out.println("  [OK] Dispatched to " + destinationArea + " via " + assignedProvider + "\n");
        } catch (RoadSubmergedException e) {
            // Error Handling: Fallback strategy
            System.err.println("  [WARNING] Route Error: " + e.getMessage());
            System.out.println("  [FALLBACK] Rerouting relief convoy via Army Rescue Boats.");
            System.out.println("  [OK] Boat Convoy Dispatched to " + destinationArea + "\n");
        } finally {
            System.out.println("  [Audit Log] Operation record logged to central database.");
        }
    }

    // Abstract methods hidden from caller
    protected abstract void validateRoute() throws RoadSubmergedException;
    protected abstract int[] calculateCargo();
    protected abstract void generateDispatchOrder(int[] cargo);
}
