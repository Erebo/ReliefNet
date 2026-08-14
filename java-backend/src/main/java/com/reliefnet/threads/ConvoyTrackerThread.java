package com.reliefnet.threads;

/**
 * Multithreading: Extends Thread to track convoy progression asynchronously.
 */
public class ConvoyTrackerThread extends Thread {
    private final String convoyId;
    private final String destination;

    public ConvoyTrackerThread(String convoyId, String destination) {
        super("TrackerThread-" + convoyId);
        this.convoyId    = convoyId;
        this.destination = destination;
    }

    @Override
    public void run() {
        String[] stages = {
            "1. DISPATCHED from Central Warehouse",
            "2. IN TRANSIT via Regional Highway",
            "3. ARRIVED at " + destination,
            "4. DELIVERED & Verified with Local Authority"
        };

        for (String stage : stages) {
            try {
                Thread.sleep(300);
                System.out.println("  [" + getName() + "] " + convoyId + " Status -> " + stage);
            } catch (InterruptedException e) {
                System.err.println("  [" + getName() + "] Tracker thread interrupted.");
                break;
            }
        }
        System.out.println("  [" + getName() + "] " + convoyId + " Mission Completed Successfully!");
    }
}
