package com.reliefnet.exception;

/**
 * Checked Exception: Thrown when relief dispatch is attempted on an unverified report.
 * Demonstrates business rule validation via Java Exception Handling.
 */
public class UnverifiedAreaException extends Exception {
    public UnverifiedAreaException(String message) {
        super(message);
    }
}
