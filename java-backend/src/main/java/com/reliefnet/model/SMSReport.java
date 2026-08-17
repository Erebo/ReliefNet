package com.reliefnet.model;

import com.reliefnet.exception.InvalidDistressSignalException;
import com.reliefnet.exception.UnverifiedAreaException;

/**
 * Pillar 1: ENCAPSULATION
 * - Private internal state
 * - Strict getters
 * - Controlled state transitions through business logic methods
 */
public class SMSReport {

    private final String senderPhone;
    private final String areaName;
    private final String messageText;
    private String status;
    private int verifiedHouseholds;

    public SMSReport(String senderPhone, String areaName, String messageText) {
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
