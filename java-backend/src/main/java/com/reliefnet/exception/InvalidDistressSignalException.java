package com.reliefnet.exception;

/**
 * Unchecked Exception: Thrown when raw input data fails integrity validation.
 */
public class InvalidDistressSignalException extends RuntimeException {
    public InvalidDistressSignalException(String message) {
        super(message);
    }
}
