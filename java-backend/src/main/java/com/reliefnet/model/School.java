package com.reliefnet.model;

/**
 * Pillar 2 & 3: Child class of Institution.
 * Overrides contact() to check classrooms and schoolyard flooding with Headmaster.
 */
public class School extends Institution {
    private String headmasterName;
    private int    numberOfClassrooms;

    public School(String name, String district, String upazila,
                  int capacity, String headmasterName, int classrooms) {
        super(name, district, upazila, capacity);
        this.headmasterName     = headmasterName;
        this.numberOfClassrooms = classrooms;
    }

    public void convertClassroomsToShelter() {
        System.out.println("  [School] " + numberOfClassrooms + " classrooms at " + name
            + " converted to emergency beds. Contact HM: " + headmasterName);
    }

    @Override
    public void contact() {
        System.out.println("  [School Contact] Calling headmaster " + headmasterName + " at " + name);
    }
}
