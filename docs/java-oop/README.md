# ReliefNet — Java OOP Architecture & System Design

This directory contains complete documentation for the **Java Object-Oriented Programming (OOP)** implementation of **ReliefNet**, a Flood Relief Coordination Platform for Bangladesh.

---

## 📁 Java Architecture Overview

The Java implementation is organized into standard enterprise packages under `java-backend/` as well as a standalone runnable file `ReliefNetOOP.java`.

```
docs/java-oop/
├── README.md                          # Architecture overview and execution guide
├── oop-pillars.md                     # Deep-dive: Encapsulation, Inheritance, Polymorphism, Abstraction
└── multithreading-and-exceptions.md   # Deep-dive: Threading model, thread safety, and custom exceptions
```

```
java-backend/src/main/java/com/reliefnet/
├── ReliefNetApplication.java          # Main application orchestrator
├── model/                             # 🔒 Encapsulation & 🏛️ Inheritance
│   ├── SMSReport.java                 # Encapsulated distress report entity
│   ├── Institution.java               # Base infrastructure class
│   ├── School.java                    # Subclass with educational shelter methods
│   ├── College.java                   # Subclass with campus coordination
│   └── NGO.java                       # Subclass with relief distribution capacity
├── service/                           # 🎭 Abstraction
│   ├── ReliefOperation.java           # Abstract base class with template dispatch()
│   └── FloodReliefOperation.java      # Concrete route & cargo calculation service
├── threads/                           # ⚡ Multithreading
│   ├── SMSProcessorWorker.java        # Runnable worker for concurrent SMS ingestion
│   ├── ConvoyTrackerThread.java       # Thread for asynchronous convoy stage updates
│   └── ThreadSafeDispatchQueue.java   # Synchronized queue with wait()/notifyAll()
└── exception/                         # 🛡️ Error & Exception Handling
    ├── UnverifiedAreaException.java   # Checked: Prevents premature relief dispatch
    ├── RoadSubmergedException.java    # Checked: Triggers boat convoy fallback
    └── InvalidDistressSignalException.java # Unchecked: Input validation
```

---

## 🎯 The 4 OOP Pillars Summary

| Pillar | Implementation Class | Core Mechanism |
|---|---|---|
| **1. Encapsulation** | `SMSReport` | Private fields (`senderPhone`, `status`), immutability, and controlled mutation methods (`markVerified()`, `markReliefAssigned()`). |
| **2. Inheritance** | `Institution` $\rightarrow$ `School`, `College`, `NGO` | Reuses common attributes (`name`, `capacity`, `openAsShelter()`) while children add domain-specific features. |
| **3. Polymorphism** | `@Override contact()` on `Institution[]` | Dynamic method dispatch at runtime to execute specialized verification actions per institution type. |
| **4. Abstraction** | `abstract class ReliefOperation` | Exposes a single public `dispatch()` template method while hiding route validation and cargo math. |

---

## ⚡ Multithreading & 🛡️ Error Handling Summary

* **Multithreading:**
  * **Parallel SMS Ingestion**: `SMSProcessorWorker` (implements `Runnable`) ingests incoming SMS messages concurrently via worker threads without blocking HQ operations.
  * **Asynchronous Convoy Tracking**: `ConvoyTrackerThread` (extends `Thread`) simulates real-time movement through 4 operational stages.
  * **Thread Synchronization**: `ThreadSafeDispatchQueue` uses `synchronized`, `wait()`, and `notifyAll()` for thread-safe mission queuing.

* **Error Handling:**
  * Custom checked exceptions (`UnverifiedAreaException`, `RoadSubmergedException`) enforce business logic and trigger automatic recovery fallbacks (e.g., Army Rescue Boats).
  * Custom unchecked exception (`InvalidDistressSignalException`) validates Bangladesh phone number formats (`+880`).
  * `try-catch-finally` guarantees audit logging across all dispatch scenarios.

---

## 🚀 How to Run the Java Implementation

### Method A: Standalone File (Fastest)
```powershell
javac ReliefNetOOP.java; java ReliefNetOOP
```

### Method B: Enterprise Package (`java-backend/`)
```powershell
New-Item -ItemType Directory -Force -Path bin
javac -d bin (Get-ChildItem -Recurse java-backend\src\main\java\*.java | ForEach-Object { $_.FullName })
java -cp bin com.reliefnet.ReliefNetApplication
```
