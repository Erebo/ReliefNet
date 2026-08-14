package com.reliefnet.model;

/**
 * Pillar 2 & 3: Child class of Institution.
 * Overrides contact() to verify college campus shelter status with Principal.
 */
public class College extends Institution {
    private String principalPhone;

    public College(String name, String district, String upazila, int capacity, String principalPhone) {
        super(name, district, upazila, capacity);
        this.principalPhone = principalPhone;
    }

    public void callPrincipal() {
        System.out.println("  [College] Calling principal at " + principalPhone + " - " + name);
    }

    @Override
    public void contact() {
        System.out.println("  [College Contact] Calling principal " + principalPhone + " at " + name);
    }
}
