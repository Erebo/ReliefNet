package com.reliefnet.exception;

/**
 * Checked Exception: Thrown when road connectivity to a disaster zone is cut off.
 */
public class RoadSubmergedException extends Exception {
    public RoadSubmergedException(String message) {
        super(message);
    }
}
