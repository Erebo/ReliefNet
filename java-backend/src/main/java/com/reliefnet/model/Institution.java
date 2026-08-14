package com.reliefnet.model;

/**
 * Pillar 2: INHERITANCE (Base Class)
 * Represents an infrastructure point in the flood zone.
 */
public class Institution {
    protected String name;
    protected String district;
    protected String upazila;
    protected int    capacityPersons;

    public Institution(String name, String district, String upazila, int capacityPersons) {
        this.name            = name;
        this.district        = district;
        this.upazila         = upazila;
        this.capacityPersons = capacityPersons;
    }

    public void openAsShelter() {
        System.out.println("  [Shelter Open] " + name + " (" + upazila + ") - capacity: " + capacityPersons + " persons.");
    }

    // Pillar 3: Polymorphic base method
    public void contact() {
        System.out.println("  [Contact] Contacting " + name);
    }

    public String getName()     { return name; }
    public String getDistrict() { return district; }
    public String getUpazila()  { return upazila; }
    public int    getCapacity() { return capacityPersons; }
}
