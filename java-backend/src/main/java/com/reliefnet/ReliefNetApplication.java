package com.reliefnet;

import com.reliefnet.exception.InvalidDistressSignalException;
import com.reliefnet.exception.UnverifiedAreaException;
import com.reliefnet.model.*;
import com.reliefnet.service.*;
import com.reliefnet.threads.*;

/**
 * Main Application Orchestrator:
 * Executes and demonstrates all 4 OOP Pillars + Multithreading + Error Handling.
 */
public class ReliefNetApplication {

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("  ReliefNet -- Java Enterprise Core Architecture  ");
        System.out.println("  1. Encapsulation   2. Inheritance   3. Polymorphism");
        System.out.println("  4. Abstraction     5. Error Handling 6. Multithreading");
        System.out.println("==================================================\n");

        // 1. ENCAPSULATION
        System.out.println("--- 1. ENCAPSULATION ------------------------------");
        SMSReport report = new SMSReport("+880 1712-334455", "Sonagazi Sadar", "4ft floodwater, no food.");
        System.out.println("  Initial:  " + report);
        report.markVerified(58);
        try {
            report.markReliefAssigned();
        } catch (UnverifiedAreaException e) {
            System.err.println("  Error: " + e.getMessage());
        }
        System.out.println("  Updated:  " + report + "\n");

        // 2. INHERITANCE
        System.out.println("--- 2. INHERITANCE --------------------------------");
        School school = new School("Mangalkandi High School", "Feni", "Sonagazi", 1500, "Abdul Karim", 18);
        school.openAsShelter();
        school.convertClassroomsToShelter();

        NGO bdrcs = new NGO("BDRCS Sonagazi Unit", "Feni", "Sonagazi", 500, "BDRCS", 1200);
        bdrcs.openAsShelter();
        bdrcs.startFoodDistribution();
        System.out.println();

        // 3. POLYMORPHISM
        System.out.println("--- 3. POLYMORPHISM -------------------------------");
        Institution[] verificationPoints = {
            new School("Sonagazi Model High School", "Feni", "Sonagazi", 850, "Rahim Uddin", 14),
            new College("Sonagazi Govt College", "Feni", "Sonagazi", 1200, "+880 1819-345678"),
            new NGO("BDRCS Sonagazi Unit", "Feni", "Sonagazi", 500, "BDRCS", 1200),
            new NGO("BRAC Relief Hub", "Feni", "Sonagazi", 400, "BRAC", 800),
        };
        for (Institution inst : verificationPoints) {
            inst.contact(); // Polymorphic dispatch
        }
        System.out.println();

        // 4. ABSTRACTION & ROUTE ERROR HANDLING
        System.out.println("--- 4. ABSTRACTION & ERROR HANDLING ---------------");
        ReliefOperation op1 = new FloodReliefOperation("Sonagazi, Feni", 142, "BDRCS Feni Unit", "CRITICAL", false);
        op1.dispatch();

        ReliefOperation op2 = new FloodReliefOperation("Companiganj, Noakhali", 76, "BRAC Coastal Team", "SEVERE", true);
        op2.dispatch();

        // 5. EXCEPTION HANDLING
        System.out.println("--- 5. ERROR HANDLING (Try-Catch Test) ------------");
        SMSReport unverified = new SMSReport("+880 1819-998877", "Parshuram", "Emergency needed");
        try {
            unverified.markReliefAssigned();
        } catch (UnverifiedAreaException e) {
            System.err.println("  [CAUGHT EXPECTED ERROR] " + e.getMessage());
        }

        try {
            new SMSReport("INVALID_PHONE", "Fulgazi", "Flood warning");
        } catch (InvalidDistressSignalException e) {
            System.err.println("  [CAUGHT EXPECTED ERROR] " + e.getMessage());
        }
        System.out.println();

        // 6. MULTITHREADING
        System.out.println("--- 6. MULTITHREADING (Parallel Ingestion & Convoys) --");
        Thread t1 = new Thread(new SMSProcessorWorker("+880 1711-111111", "Sonagazi", "Water 3ft deep"), "WorkerThread-Feni");
        Thread t2 = new Thread(new SMSProcessorWorker("+880 1822-222222", "Companiganj", "Need boat rescue"), "WorkerThread-Noakhali");
        Thread t3 = new Thread(new SMSProcessorWorker("INVALID_NUMBER", "Sylhet", "Roads cut off"), "WorkerThread-Sylhet");

        t1.start();
        t2.start();
        t3.start();

        ConvoyTrackerThread tracker = new ConvoyTrackerThread("CONVOY-BD-01", "Sonagazi Government College");
        tracker.start();

        try {
            t1.join();
            t2.join();
            t3.join();
            tracker.join();
        } catch (InterruptedException e) {
            System.err.println("Main interrupted: " + e.getMessage());
        }

        System.out.println("\n==================================================");
        System.out.println("  All Enterprise Java Modules Executed cleanly!   ");
        System.out.println("==================================================");
    }
}
