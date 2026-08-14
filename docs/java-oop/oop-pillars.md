# The 4 OOP Pillars in ReliefNet

This document details how **Encapsulation**, **Inheritance**, **Polymorphism**, and **Abstraction** are implemented in the ReliefNet flood coordination codebase.

---

## 1. 🔒 Encapsulation

> **Definition:** Bundling data and methods together inside a class and restricting direct external access to enforce data integrity.

### Implementation: `com.reliefnet.model.SMSReport`

```java
public class SMSReport {
    // Private fields: internal state cannot be modified arbitrarily
    private final String senderPhone;   // Immutable once initialized
    private final String areaName;
    private final String messageText;
    private String status;              // PENDING -> VERIFIED -> RELIEF_ASSIGNED
    private int verifiedHouseholds;

    public SMSReport(String senderPhone, String areaName, String messageText) {
        if (senderPhone == null || !senderPhone.startsWith("+880")) {
            throw new InvalidDistressSignalException("Invalid phone format: " + senderPhone);
        }
        this.senderPhone = senderPhone;
        this.areaName = areaName;
        this.messageText = messageText;
        this.status = "PENDING";
        this.verifiedHouseholds = 0;
    }

    // Public Getters for read-only access
    public String getSenderPhone() { return senderPhone; }
    public String getStatus() { return status; }
    public int getVerifiedHouseholds() { return verifiedHouseholds; }

    // Controlled State Mutation
    public void markVerified(int households) {
        if (households <= 0) throw new IllegalArgumentException("Households must be positive");
        this.verifiedHouseholds = households;
        this.status = "VERIFIED";
    }

    public void markReliefAssigned() throws UnverifiedAreaException {
        if (!"VERIFIED".equals(this.status)) {
            throw new UnverifiedAreaException("Cannot dispatch relief to unverified area: " + areaName);
        }
        this.status = "RELIEF_ASSIGNED";
    }
}
```

### Why it Demonstrates Encapsulation:
1. **Data Protection:** Fields like `status` and `verifiedHouseholds` are `private`. External classes cannot execute `report.status = "DELIVERED"`.
2. **Business Rule Enforcement:** State transitions must go through `markVerified()` and `markReliefAssigned()`.
3. **Immutability:** Key identifying fields like `senderPhone` are marked `final`.

---

## 2. 🏛️ Inheritance

> **Definition:** A mechanism where a new class inherits state and behavior from an existing class, promoting code reuse.

### Implementation: `Institution` $\rightarrow$ `School`, `College`, `NGO`

```
                      ┌───────────────────────────┐
                      │    class Institution      │
                      │ ------------------------- │
                      │ - name: String            │
                      │ - district: String        │
                      │ - capacityPersons: int    │
                      │ + openAsShelter()         │
                      │ + contact()               │
                      └─────────────┬─────────────┘
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
┌─────────────────────────┐ ┌───────────────┐ ┌────────────────────────┐
│      class School       │ │ class College │ │       class NGO        │
│ ----------------------- │ │ ------------- │ │ ---------------------- │
│ - headmasterName: String│ │-principalPhone│ │-organizationType:String│
│ - classrooms: int       │ │+callPrincipal │ │-dailyMealCapacity: int │
│ +convertClassrooms()    │ └───────────────┘ │+startFoodDistribution()│
└─────────────────────────┘                   └────────────────────────┘
```

```java
// Base Class
public class Institution {
    protected String name;
    protected String district;
    protected String upazila;
    protected int    capacityPersons;

    public Institution(String name, String district, String upazila, int capacityPersons) {
        this.name = name;
        this.district = district;
        this.upazila = upazila;
        this.capacityPersons = capacityPersons;
    }

    public void openAsShelter() {
        System.out.println("[Shelter Open] " + name + " - capacity: " + capacityPersons);
    }

    public void contact() {
        System.out.println("[Contact] Reaching out to " + name);
    }
}

// Subclass: School
public class School extends Institution {
    private String headmasterName;
    private int numberOfClassrooms;

    public School(String name, String district, String upazila, int cap, String headmaster, int rooms) {
        super(name, district, upazila, cap); // Calls parent constructor
        this.headmasterName = headmaster;
        this.numberOfClassrooms = rooms;
    }

    public void convertClassroomsToShelter() {
        System.out.println("[School] " + numberOfClassrooms + " classrooms converted to shelter beds.");
    }
}
```

---

## 3. 🔄 Polymorphism

> **Definition:** The ability of different classes to respond to the same method call with distinct implementations (Dynamic Method Dispatch).

### Implementation: `@Override contact()` on `Institution[]`

```java
// In School.java
@Override
public void contact() {
    System.out.println("[School Contact] Calling headmaster " + headmasterName + " at " + name);
}

// In College.java
@Override
public void contact() {
    System.out.println("[College Contact] Calling principal " + principalPhone + " at " + name);
}

// In NGO.java
@Override
public void contact() {
    System.out.println("[NGO Contact] Coordinating with " + organizationType + " team at " + name);
}
```

### Runtime Execution:
```java
Institution[] verificationPoints = {
    new School("Sonagazi Model High School", "Feni", "Sonagazi", 850, "Rahim Uddin", 14),
    new College("Sonagazi Govt College", "Feni", "Sonagazi", 1200, "+880 1819-345678"),
    new NGO("BDRCS Sonagazi Unit", "Feni", "Sonagazi", 500, "BDRCS", 1200)
};

// Polymorphism in action: Java dynamically resolves the correct method at runtime
for (Institution inst : verificationPoints) {
    inst.contact();
}
```

---

## 4. 🎭 Abstraction

> **Definition:** Hiding complex implementation details and showing only the essential public interface to the user.

### Implementation: `abstract class ReliefOperation` $\rightarrow$ `FloodReliefOperation`

```java
// Abstract Class (Template Method Pattern)
public abstract class ReliefOperation {
    protected String destinationArea;
    protected int targetHouseholds;
    protected String assignedProvider;

    public ReliefOperation(String area, int households, String provider) {
        this.destinationArea = area;
        this.targetHouseholds = households;
        this.assignedProvider = provider;
    }

    // Public Template Method — The only method the operator calls
    public final void dispatch() {
        try {
            validateRoute();                 // Hidden internal step
            int[] cargo = calculateCargo();  // Hidden internal step
            generateDispatchOrder(cargo);    // Hidden internal step
            System.out.println("[OK] Dispatched to " + destinationArea + " via " + assignedProvider);
        } catch (RoadSubmergedException e) {
            System.err.println("[WARNING] Road Blocked: " + e.getMessage());
            System.out.println("[FALLBACK] Dispatched via Army Rescue Boats.");
        }
    }

    protected abstract void validateRoute() throws RoadSubmergedException;
    protected abstract int[] calculateCargo();
    protected abstract void generateDispatchOrder(int[] cargo);
}
```

### Why it Demonstrates Abstraction:
* The operator only executes `operation.dispatch()`.
* They do not need to manually compute cargo quotas (`targetHouseholds * multiplier * 2`) or manage road-connectivity checks — all complexity is abstracted away.
