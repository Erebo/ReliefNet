package com.reliefnet.threads;

import com.reliefnet.exception.InvalidDistressSignalException;
import com.reliefnet.model.SMSReport;

/**
 * Multithreading: Worker task implementing Runnable.
 * Runs concurrently across background threads to ingest raw SMS signals.
 */
public class SMSProcessorWorker implements Runnable {
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
        System.out.println("  [" + threadName + "] Ingesting SMS from " + area + " (" + rawPhone + ")...");
        try {
            // Simulate I/O latency
            Thread.sleep(350);

            SMSReport report = new SMSReport(rawPhone, area, text);
            System.out.println("  [" + threadName + "] Successfully verified & ingested: " + report);

        } catch (InvalidDistressSignalException ex) {
            System.err.println("  [" + threadName + "] VALIDATION REJECTED: " + ex.getMessage());
        } catch (InterruptedException ex) {
            System.err.println("  [" + threadName + "] Thread execution interrupted.");
        }
    }
}
