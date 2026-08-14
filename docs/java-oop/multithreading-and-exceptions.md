# Multithreading & Error Handling in ReliefNet

This document details the **Concurrency Architecture** and **Custom Exception Hierarchy** implemented in the ReliefNet Java codebase.

---

## ⚡ 1. Multithreading Implementation

ReliefNet utilizes Java Multithreading to handle high-volume distress signals during peak flood disasters without blocking emergency operators.

### Architecture Components:

```
[Raw Incoming SMS Signals]
            │
            ▼
 ┌────────────────────────────────────────────────┐
 │     SMSProcessorWorker (implements Runnable)   │
 ├────────────────────────────────────────────────┤
 │  WorkerThread-Feni     WorkerThread-Noakhali   │
 └────────────────────────────────────────────────┘
            │
            ▼
 ┌────────────────────────────────────────────────┐
 │    ThreadSafeDispatchQueue (synchronized)      │
 ├────────────────────────────────────────────────┤
 │  enqueue() / dequeue() with wait() & notify()  │
 └────────────────────────────────────────────────┘
            │
            ▼
 ┌────────────────────────────────────────────────┐
 │     ConvoyTrackerThread (extends Thread)       │
 ├────────────────────────────────────────────────┤
 │  Asynchronous status progression updates       │
 └────────────────────────────────────────────────┘
```

---

### A. Worker Threads: `SMSProcessorWorker implements Runnable`

Processes multiple distress messages concurrently:

```java
public class SMSProcessorWorker implements Runnable {
    private final String rawPhone;
    private final String area;
    private final String text;

    public SMSProcessorWorker(String rawPhone, String area, String text) {
        this.rawPhone = rawPhone;
        this.area = area;
        this.text = text;
    }

    @Override
    public void run() {
        String threadName = Thread.currentThread().getName();
        try {
            Thread.sleep(350); // Simulate network parse latency
            SMSReport report = new SMSReport(rawPhone, area, text);
            System.out.println(" [" + threadName + "] Ingested: " + report);
        } catch (InvalidDistressSignalException ex) {
            System.err.println(" [" + threadName + "] REJECTED: " + ex.getMessage());
        } catch (InterruptedException ex) {
            System.err.println(" [" + threadName + "] Interrupted.");
        }
    }
}
```

---

### B. Background Tracking: `ConvoyTrackerThread extends Thread`

Simulates non-blocking movement of relief cargo through 4 operational milestones:

```java
public class ConvoyTrackerThread extends Thread {
    private final String convoyId;
    private final String destination;

    public ConvoyTrackerThread(String convoyId, String destination) {
        super("TrackerThread-" + convoyId);
        this.convoyId = convoyId;
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
                System.out.println(" [" + getName() + "] " + convoyId + " -> " + stage);
            } catch (InterruptedException e) {
                break;
            }
        }
    }
}
```

---

### C. Thread Safety: `ThreadSafeDispatchQueue`

Demonstrates monitor locks, condition synchronization, and mutual exclusion:

```java
public class ThreadSafeDispatchQueue {
    private final Queue<String> queue = new LinkedList<>();
    private final int capacity;

    public ThreadSafeDispatchQueue(int capacity) {
        this.capacity = capacity;
    }

    public synchronized void enqueue(String mission) throws InterruptedException {
        while (queue.size() == capacity) {
            wait(); // Wait if queue is full
        }
        queue.add(mission);
        notifyAll(); // Wake up worker threads
    }

    public synchronized String dequeue() throws InterruptedException {
        while (queue.isEmpty()) {
            wait(); // Wait if queue is empty
        }
        String mission = queue.poll();
        notifyAll();
        return mission;
    }
}
```

---

## 🛡️ 2. Custom Exception & Error Handling

ReliefNet categorizes errors into **Checked Exceptions** (recoverable business/environmental failures) and **Unchecked Exceptions** (data validation errors).

```
                      java.lang.Throwable
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
        java.lang.Exception         java.lang.RuntimeException
        (Checked Exceptions)          (Unchecked Exceptions)
                │                             │
    ┌───────────┴───────────┐                 │
    ▼                       ▼                 ▼
UnverifiedAreaException  RoadSubmergedException  InvalidDistressSignalException
```

---

### Exception Specifications:

| Exception Class | Hierarchy | Trigger Condition | System Recovery Action |
|---|---|---|---|
| **`UnverifiedAreaException`** | `extends Exception` | Operator attempts to dispatch cargo to a `PENDING` report. | Dispatches are halted until verification at an institution occurs. |
| **`RoadSubmergedException`** | `extends Exception` | Highway connectivity to flood zone is inundated by floodwater. | Caught inside `dispatch()` to automatically trigger **Army Rescue Boat Fallback**. |
| **`InvalidDistressSignalException`** | `extends RuntimeException` | Raw SMS message has missing content or invalid non-`+880` phone format. | Rejected at the worker thread boundary before database persistence. |

---

### Robust `try-catch-finally` Pattern in Relief Operations:

```java
public final void dispatch() {
    try {
        validateRoute();
        int[] cargo = calculateCargo();
        generateDispatchOrder(cargo);
        System.out.println(" [OK] Dispatched via " + assignedProvider);
    } catch (RoadSubmergedException e) {
        // Handle environmental disaster blockage
        System.err.println(" [WARNING] Route Submerged: " + e.getMessage());
        System.out.println(" [FALLBACK] Rerouting cargo via Army Rescue Boats.");
    } finally {
        // Guaranteed audit log execution
        System.out.println(" [Audit Log] Dispatch attempt logged to central database.");
    }
}
```
