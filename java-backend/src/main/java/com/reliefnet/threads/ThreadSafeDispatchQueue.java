package com.reliefnet.threads;

import java.util.LinkedList;
import java.util.Queue;

/**
 * Multithreading: Thread-safe queue demonstrating synchronization & thread locking.
 */
public class ThreadSafeDispatchQueue {
    private final Queue<String> queue = new LinkedList<>();
    private final int capacity;

    public ThreadSafeDispatchQueue(int capacity) {
        this.capacity = capacity;
    }

    public synchronized void enqueue(String mission) throws InterruptedException {
        while (queue.size() == capacity) {
            wait(); // Thread waits if queue is full
        }
        queue.add(mission);
        System.out.println("  [ThreadQueue] Enqueued: " + mission + " (Queue Size: " + queue.size() + ")");
        notifyAll(); // Notify consumer threads
    }

    public synchronized String dequeue() throws InterruptedException {
        while (queue.isEmpty()) {
            wait(); // Thread waits if queue is empty
        }
        String mission = queue.poll();
        System.out.println("  [ThreadQueue] Dequeued for Dispatch: " + mission);
        notifyAll();
        return mission;
    }
}
