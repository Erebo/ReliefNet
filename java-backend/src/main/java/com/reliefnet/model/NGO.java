package com.reliefnet.model;

/**
 * Pillar 2 & 3: Child class of Institution.
 * Overrides contact() to coordinate meal distribution and volunteer mobilization.
 */
public class NGO extends Institution {
    private String organizationType;
    private int    dailyMealCapacity;

    public NGO(String name, String district, String upazila,
               int capacity, String organizationType, int dailyMealCapacity) {
        super(name, district, upazila, capacity);
        this.organizationType  = organizationType;
        this.dailyMealCapacity = dailyMealCapacity;
    }

    public void startFoodDistribution() {
        System.out.println("  [NGO: " + organizationType + "] Distribution at " + name
            + " - serving " + dailyMealCapacity + " meals/day.");
    }

    @Override
    public void contact() {
        System.out.println("  [NGO Contact] Coordinating with " + organizationType
            + " dispatch team at " + name);
    }

    public String getOrganizationType() { return organizationType; }
}
