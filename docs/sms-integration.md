# ReliefNet SMS Ingestion & Deterministic NLP Architecture

## 1. Overview
ReliefNet provides a reliable, deterministic SMS ingestion gateway designed to handle emergency distress messages in both **Bangla** and **English**, even in conditions of intermittent connectivity or unstructured text inputs.

```
+------------------------------------+
|  Telco / Gateway (Twilio / Infobip)|
|  or ReliefNet SMS Simulator        |
+-----------------+------------------+
                  | HTTP POST /api/v1/sms/webhook
                  v
+------------------------------------+
|   FastAPI SMS Ingestion Endpoint   |
|   (/api/v1/sms/webhook)            |
+-----------------+------------------+
                  |
                  v
+------------------------------------+
| Deterministic Regex & Bangla NLP   |
| Extractor (backend/app/sms/parser) |
+-----------------+------------------+
   |              |             |
   v              v             v
Location       Needs       Households &
(Sonagazi)  (Food/Water)     Severity
                  |
                  v
+------------------------------------+
| Community Distress Report Created  |
| (Status: UNVERIFIED)               |
+-----------------+------------------+
                  |
                  v
+------------------------------------+
| Area Need Signals Aggregation &    |
| Local Ground-Truth Verification    |
+------------------------------------+
```

---

## 2. Deterministic Bangla NLP Extractor

The extractor (`backend/app/sms/parser.py`) uses pattern matching and location alias dictionaries across all 8 Divisions and Upazilas in Bangladesh:

### A. Number Extraction
- Supports both English digits (`0-9`) and Bangla digits (`০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯`).
- Extracts affected household counts from phrases like `৫০ পরিবার` or `50 households`.

### B. Location Entity Extraction
- Maps local geographic terms (e.g. `সোনাগাজী`, `পরশুরাম`, `ফুলগাজী`, `চর চান্দিয়া`, `ফেনী`) directly to standardized Upazilas and Districts.
- Computes extraction confidence: `HIGH` (exact match), `MEDIUM` (district match), or `LOW` (unknown).

### C. Need Classification
Detects emergency need categories:
- **Food**: `খাবার`, `খাদ্য`, `চাল`, `ত্রাণ`, `food`, `ration`, `rice`
- **Drinking Water**: `পানি`, `বিশুদ্ধ পানি`, `জল`, `water`, `drinking`
- **Medical**: `ঔষধ`, `স্যালাইন`, `ডাক্তার`, `জরুরী চিকিৎসা`, `medicine`, `saline`, `medical`
- **Boat Rescue / Trapped**: `নৌকা`, `বোট`, `পানিবন্দী`, `আটকে`, `উদ্ধার`, `boat`, `rescue`, `trapped`

---

## 3. Inbound Webhook API

### Endpoint: `POST /api/v1/sms/webhook`
Compatible with standard Twilio/Telco webhook payloads:

#### Payload (JSON or Form-URL-Encoded):
```json
{
  "From": "+8801819123456",
  "Body": "আমাদের এলাকায় পানি বাড়ছে। প্রায় ৫০ পরিবার পানিবন্দী। খাবার ও বিশুদ্ধ পানি প্রয়োজন। সোনাগাজী, ফেনী।",
  "To": "+8801700000000",
  "MessageSid": "SM1234567890abcdef"
}
```

#### Response:
```json
{
  "status": "success",
  "report_id": 19,
  "parsed": {
    "upazila": "Sonagazi",
    "district": "Feni",
    "location_confidence": "HIGH",
    "need_types": ["Food", "Water"],
    "households_affected": 50,
    "severity": "CRITICAL"
  }
}
```

---

## 4. Webhook Simulator Console
Operators can test the pipeline interactively from the web UI at `/sms` with built-in presets:
1. Sonagazi Bangla Severe Flood (`৫০ পরিবার পানিবন্দী...`)
2. Parshuram Boat Rescue Urgent (`বুক সমান পানি, উদ্ধার বোট পাঠান...`)
3. Fulgazi Medical & Food Need (`খাবার ও স্যালাইন ঔষধের অভাব...`)
4. English Crisis Report (`Urgent help required at Sonagazi Sadar...`)
