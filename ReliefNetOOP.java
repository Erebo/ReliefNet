// ===========================================================
//  ReliefNetOOP.java
//  Demonstrating:
//   1. ENCAPSULATION
//   2. INHERITANCE
//   3. POLYMORPHISM
//   4. ABSTRACTION
//   5. EXCEPTION HANDLING (Custom Exceptions, try-catch-finally)
//   6. MULTITHREADING (Concurrent SMS Processing & Convoy Tracking)
//
//  Compile:  javac ReliefNetOOP.java
//  Run:      java ReliefNetOOP
// ===========================================================

import java.util.ArrayList;
import java.util.List;

public class ReliefNetOOP {

    // =========================================================
    //  CUSTOM EXCEPTIONS (Error Handling)
    // =========================================================

    // Checked Exception: Thrown when relief dispatch is attempted on an unverified report
    static class UnverifiedAreaException extends Exception {
        public UnverifiedAreaException(String message) {
            super(message);
        }
    }

    // Checked Exception: Thrown when road access is blocked by floodwaters
    static class RoadSubmergedException extends Exception {
        public RoadSubmergedException(String message) {
            super(message);
        }
    }

    // Unchecked Exception: Thrown when invalid data is supplied
    static class InvalidDistressSignalException extends RuntimeException {
        public InvalidDistressSignalException(String message) {
            super(message);
        }
    }


    // =========================================================
    //  PILLAR 1 - ENCAPSULATION
    //  SMSReport: private data, controlled access & validation
    // =========================================================
    static class SMSReport {

        private final String senderPhone;
        private final String areaName;
        private final String messageText;
        private String status;
        private int verifiedHouseholds;

        public SMSReport(String senderPhone, String areaName, String messageText) {
            // Error Handling: Validation rule inside constructor
            if (senderPhone == null || senderPhone.trim().isEmpty() || !senderPhone.startsWith("+880")) {
                throw new InvalidDistressSignalException("Invalid Bangladesh phone number format: " + senderPhone);
            }
            if (messageText == null || messageText.trim().isEmpty()) {
                throw new InvalidDistressSignalException("Distress message content cannot be empty.");
            }

            this.senderPhone        = senderPhone;
            this.areaName           = areaName;
            this.messageText        = messageText;
            this.status             = "PENDING";
            this.verifiedHouseholds = 0;
        }

        public String getSenderPhone()        { return senderPhone; }
        public String getAreaName()           { return areaName; }
        public String getMessageText()        { return messageText; }
        public String getStatus()             { return status; }
        public int    getVerifiedHouseholds() { return verifiedHouseholds; }

        public void markVerified(int households) {
            if (households <= 0) {
                throw new IllegalArgumentException("Verified households must be greater than 0.");
            }
            this.verifiedHouseholds = households;
            this.status = "VERIFIED";
            System.out.println("  [Verified] " + areaName + " - " + households + " households confirmed.");
        }

        // Error Handling: Throws checked UnverifiedAreaException if business rule is violated
        public void markReliefAssigned() throws UnverifiedAreaException {
            if (!"VERIFIED".equals(this.status)) {
                throw new UnverifiedAreaException(
                    "CANNOT DISPATCH RELIEF: Area '" + areaName + "' is still in " + status + " status. Ground verification required first!"
                );
            }
            this.status = "RELIEF_ASSIGNED";
            System.out.println("  [Relief Assigned] Convoy dispatched to " + areaName);
        }

        @Override
        public String toString() {
            return "SMSReport[" + senderPhone + " | " + areaName + " | " + status
                + (verifiedHouseholds > 0 ? " | " + verifiedHouseholds + " HH" : "") + "]";
        }
    }


    // =========================================================
    //  PILLAR 2 - INHERITANCE
    //  Institution (parent) -> School, College, NGO (children)
    // =========================================================
    static class Institution {
        protected String name;
        protected String district;
        protected String upazila;
        protected int    capacityPersons;

        public Institution(String name, String district, String upazila, int capacity) {
            this.name             = name;
            this.district         = district;
            this.upazila          = upazila;
            this.capacityPersons  = capacity;
        }

        public void openAsShelter() {
            System.out.println("  [Shelter Open] " + name + " (" + upazila + ") - capacity: " + capacityPersons + " persons.");
        }

        public void contact() {
            System.out.println("  [Contact] Contacting " + name);
        }

        public String getName() { return name; }
    }

    static class School extends Institution {
        private String headmasterName;
        private int    numberOfClassrooms;

        public School(String name, String district, String upazila,
                      int capacity, String headmaster, int classrooms) {
            super(name, district, upazila, capacity);
            this.headmasterName     = headmaster;
            this.numberOfClassrooms = classrooms;
        }

        public void convertClassroomsToShelter() {
            System.out.println("  [School] " + numberOfClassrooms + " classrooms at " + name
                + " converted to emergency beds. Contact HM: " + headmasterName);
        }

        @Override   // PILLAR 3: POLYMORPHISM
        public void contact() {
            System.out.println("  [School Contact] Calling headmaster " + headmasterName + " at " + name);
        }
    }

    static class College extends Institution {
        private String principalPhone;

        public College(String name, String district, String upazila, int capacity, String phone) {
            super(name, district, upazila, capacity);
            this.principalPhone = phone;
        }

        @Override   // PILLAR 3: POLYMORPHISM
        public void contact() {
            System.out.println("  [College Contact] Calling principal " + principalPhone + " at " + name);
        }
    }

    static class NGO extends Institution {
        private String organizationType;
        private int    dailyMealCapacity;

        public NGO(String name, String district, String upazila,
                   int capacity, String orgType, int dailyMeals) {
            super(name, district, upazila, capacity);
            this.organizationType  = orgType;
            this.dailyMealCapacity = dailyMeals;
        }

        public void startFoodDistribution() {
            System.out.println("  [NGO: " + organizationType + "] Distribution at " + name
                + " - serving " + dailyMealCapacity + " meals/day.");
        }

        @Override   // PILLAR 3: POLYMORPHISM
        public void contact() {
            System.out.println("  [NGO Contact] Coordinating with " + organizationType
                + " dispatch team at " + name);
        }
    }


    // =========================================================
    //  PILLAR 4 - ABSTRACTION
    //  ReliefOperation hides complex logic; operator calls dispatch()
    // =========================================================
    static abstract class ReliefOperation {
        protected String destinationArea;
        protected int    targetHouseholds;
        protected String assignedProvider;

        public ReliefOperation(String area, int households, String provider) {
            this.destinationArea  = area;
            this.targetHouseholds = households;
            this.assignedProvider = provider;
        }

        // Template Method Pattern
        public final void dispatch() {
            try {
                validateRoute();
                int[] cargo = calculateCargo();
                generateDispatchOrder(cargo);
                System.out.println("  [OK] Dispatched to " + destinationArea + " via " + assignedProvider + "\n");
            } catch (RoadSubmergedException e) {
                // Error Handling: Catch route failure and apply emergency fallback
                System.err.println("  [WARNING] Route Error: " + e.getMessage());
                System.out.println("  [FALLBACK] Rerouting relief convoy via Army Rescue Boats.");
                System.out.println("  [OK] Boat Convoy Dispatched to " + destinationArea + "\n");
            } finally {
                // Finally block runs always
                System.out.println("  [Audit Log] Operation record logged to central database.");
            }
        }

        protected abstract void validateRoute() throws RoadSubmergedException;
        protected abstract int[] calculateCargo();
        protected abstract void generateDispatchOrder(int[] cargo);
    }

    static class FloodReliefOperation extends ReliefOperation {
        private String  severity;
        private boolean isRoadCutOff;

        public FloodReliefOperation(String area, int households,
                                    String provider, String severity, boolean roadCutOff) {
            super(area, households, provider);
            this.severity     = severity;
            this.isRoadCutOff = roadCutOff;
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


    // =========================================================
    //  FEATURE 5 - MULTITHREADING
    //  Parallel SMS Ingestion Worker (implements Runnable)
    // =========================================================
    static class SMSProcessorWorker implements Runnable {
        private final String rawPhone;
        private final String area;
        private final String text;

        public SMSProcessorWorker(String rawPhone, String area, String text) {
            this.rawPhone = rawPhone;
            this.area     = area;
            this.text     = text;
        }

        @Override
        public void run() {
            String threadName = Thread.currentThread().getName();
            System.out.println("  [" + threadName + "] Received SMS from " + area + " (" + rawPhone + ")...");
            try {
                // Simulate network latency / parsing time
                Thread.sleep(400);

                // Process SMS inside thread with Error Handling
                SMSReport report = new SMSReport(rawPhone, area, text);
                System.out.println("  [" + threadName + "] Successfully ingested: " + report);

            } catch (InvalidDistressSignalException ex) {
                System.err.println("  [" + threadName + "] ERROR Ingesting SMS: " + ex.getMessage());
            } catch (InterruptedException ex) {
                System.err.println("  [" + threadName + "] Thread was interrupted.");
            }
        }
    }

    // Parallel Convoy Live Tracker Thread (extends Thread)
    static class ConvoyTrackerThread extends Thread {
        private final String convoyId;
        private final String destination;

        public ConvoyTrackerThread(String convoyId, String destination) {
            super("TrackerThread-" + convoyId);
            this.convoyId    = convoyId;
            this.destination = destination;
        }

        @Override
        public void run() {
            String[] stages = {"1. DISPATCHED from Base", "2. IN TRANSIT on Highway", "3. ARRIVED at " + destination, "4. RELIEF DISTRIBUTED"};
            for (String stage : stages) {
                try {
                    Thread.sleep(300); // Simulate movement over time
                    System.out.println("  [" + getName() + "] " + convoyId + " Status Update -> " + stage);
                } catch (InterruptedException e) {
                    System.err.println("  [" + getName() + "] Tracker interrupted.");
                    break;
                }
            }
            System.out.println("  [" + getName() + "] " + convoyId + " Mission Completed Successfully!");
        }
    }


    // =========================================================
    //  MAIN - Executes all concepts in organized sequence
    // =========================================================
    public static void main(String[] args) {

        System.out.println("==================================================");
        System.out.println("  ReliefNet -- Java OOP & Core Features Demo");
        System.out.println("  1. Encapsulation   2. Inheritance   3. Polymorphism");
        System.out.println("  4. Abstraction     5. Error Handling 6. Multithreading");
        System.out.println("==================================================\n");

        // ----------------------------------------------------
        //  1. ENCAPSULATION
        // ----------------------------------------------------
        System.out.println("--- 1. ENCAPSULATION (SMSReport) ------------------");
        SMSReport sms = new SMSReport("+880 1712-334455", "Sonagazi Sadar",
                                      "Water level 4 feet. Need urgent food and drinking water.");
        System.out.println("  Initial:  " + sms);
        sms.markVerified(58);
        try {
            sms.markReliefAssigned();
        } catch (UnverifiedAreaException e) {
            System.err.println("  Error: " + e.getMessage());
        }
        System.out.println("  Updated:  " + sms + "\n");


        // ----------------------------------------------------
        //  2. INHERITANCE
        // ----------------------------------------------------
        System.out.println("--- 2. INHERITANCE (Institution Hierarchy) --------");
        School school = new School("Mangalkandi High School", "Feni", "Sonagazi", 1500, "Abdul Karim", 18);
        school.openAsShelter();             // Inherited method
        school.convertClassroomsToShelter();// Child-specific method

        NGO bdrcs = new NGO("BDRCS Sonagazi Unit", "Feni", "Sonagazi", 500, "BDRCS", 1200);
        bdrcs.openAsShelter();              // Inherited method
        bdrcs.startFoodDistribution();      // Child-specific method
        System.out.println();


        // ----------------------------------------------------
        //  3. POLYMORPHISM
        // ----------------------------------------------------
        System.out.println("--- 3. POLYMORPHISM (contact() Dynamic Dispatch) --");
        Institution[] verificationPoints = {
            new School("Sonagazi Model High School", "Feni", "Sonagazi", 850, "Rahim Uddin", 14),
            new College("Sonagazi Govt College", "Feni", "Sonagazi", 1200, "+880 1819-345678"),
            new NGO("BDRCS Sonagazi Unit", "Feni", "Sonagazi", 500, "BDRCS", 1200),
            new NGO("BRAC Relief Hub", "Feni", "Sonagazi", 400, "BRAC", 800),
        };
        for (Institution inst : verificationPoints) {
            inst.contact(); // Dynamic dispatch at runtime
        }
        System.out.println();


        // ----------------------------------------------------
        //  4. ABSTRACTION & ERROR HANDLING IN OPERATIONS
        // ----------------------------------------------------
        System.out.println("--- 4. ABSTRACTION & ROUTE ERROR HANDLING ---------");
        // Normal Road Dispatch
        ReliefOperation op1 = new FloodReliefOperation(
            "Sonagazi, Feni", 142, "BDRCS Feni Unit", "CRITICAL", false);
        op1.dispatch();

        // Submerged Road Scenario -> Triggers Custom Exception & Catch Block Fallback
        ReliefOperation op2 = new FloodReliefOperation(
            "Companiganj, Noakhali", 76, "BRAC Coastal Team", "SEVERE", true);
        op2.dispatch();


        // ----------------------------------------------------
        //  5. ADVANCED ERROR HANDLING (Try-Catch Demonstrations)
        // ----------------------------------------------------
        System.out.println("--- 5. ERROR HANDLING DEMONSTRATION ---------------");

        // Test A: Business Logic Exception (Dispatching unverified report)
        System.out.println("  [Test A] Attempting to dispatch unverified report:");
        SMSReport unverifiedSms = new SMSReport("+880 1819-112233", "Parshuram", "Embankment broken.");
        try {
            unverifiedSms.markReliefAssigned(); // Throws UnverifiedAreaException
        } catch (UnverifiedAreaException ex) {
            System.err.println("  [CAUGHT EXPECTED ERROR] " + ex.getMessage());
        }

        // Test B: Validation Exception (Invalid Phone Number)
        System.out.println("\n  [Test B] Attempting to ingest invalid phone number:");
        try {
            new SMSReport("01700000000", "Fulgazi", "Flood water rising."); // Throws InvalidDistressSignalException
        } catch (InvalidDistressSignalException ex) {
            System.err.println("  [CAUGHT EXPECTED ERROR] " + ex.getMessage());
        }
        System.out.println();


        // ----------------------------------------------------
        //  6. MULTITHREADING (Parallel SMS Ingestion & Tracking)
        // ----------------------------------------------------
        System.out.println("--- 6. MULTITHREADING (Parallel Ingestion & Convoys) --");

        // Multithreading A: Ingest 3 incoming distress SMS messages concurrently via Worker Threads
        Thread t1 = new Thread(new SMSProcessorWorker("+880 1711-111111", "Sonagazi", "Water 3ft deep"), "WorkerThread-Feni");
        Thread t2 = new Thread(new SMSProcessorWorker("+880 1822-222222", "Companiganj", "Need boat rescue"), "WorkerThread-Noakhali");
        Thread t3 = new Thread(new SMSProcessorWorker("INVALID_NUMBER", "Sylhet", "Roads under water"), "WorkerThread-Sylhet");

        t1.start();
        t2.start();
        t3.start();

        // Multithreading B: Live Convoy Tracker running in background Thread
        ConvoyTrackerThread tracker = new ConvoyTrackerThread("CONVOY-BD-01", "Sonagazi Government College");
        tracker.start();

        // Wait for threads to complete cleanly before ending main program
        try {
            t1.join();
            t2.join();
            t3.join();
            tracker.join();
        } catch (InterruptedException e) {
            System.err.println("Main thread interrupted.");
        }

        System.out.println("\n==================================================");
        System.out.println("  All 6 Concepts (OOP + Multithreading + Errors)  ");
        System.out.println("  Demonstrated and Executed Successfully!         ");
        System.out.println("==================================================");
    }
}
