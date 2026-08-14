import re
from typing import Dict, Any, Optional, List, Tuple
from backend.app.schemas.sms import SMSParseResult

# Bangla numeral conversion dictionary
BANGLA_DIGITS = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
}

def normalize_bangla_digits(text: str) -> str:
    """Converts Bangla numerical characters to standard ASCII digits."""
    res = []
    for ch in text:
        res.append(BANGLA_DIGITS.get(ch, ch))
    return "".join(res)

# Location Entities Dictionary (English -> Bangla aliases + Default centroid)
LOCATION_DICTIONARY = [
    {
        "name": "Sonagazi",
        "bangla": "সোনাগাজী",
        "district": "Feni",
        "division": "Chittagong",
        "aliases": ["sonagazi", "সোনাগাজী", "sonagaji", "সোনাগাজি"],
        "lat": 22.8500,
        "lon": 91.3900
    },
    {
        "name": "Feni Sadar",
        "bangla": "ফেনী সদর",
        "district": "Feni",
        "division": "Chittagong",
        "aliases": ["feni sadar", "ফেনী সদর", "feni", "ফেনী", "ফেনি", "feni town"],
        "lat": 23.0186,
        "lon": 91.3966
    },
    {
        "name": "Parshuram",
        "bangla": "পরশুরাম",
        "district": "Feni",
        "division": "Chittagong",
        "aliases": ["parshuram", "পরশুরাম", "parashuram", "পরশু রাম"],
        "lat": 23.2144,
        "lon": 91.4394
    },
    {
        "name": "Fulgazi",
        "bangla": "ফুলগাজী",
        "district": "Feni",
        "division": "Chittagong",
        "aliases": ["fulgazi", "ফুলগাজী", "fulgaji", "ফুলগাজি"],
        "lat": 23.1283,
        "lon": 91.4428
    },
    {
        "name": "Chhagalnaiya",
        "bangla": "ছাগলনাইয়া",
        "district": "Feni",
        "division": "Chittagong",
        "aliases": ["chhagalnaiya", "ছাগলনাইয়া", "chagalnaiya", "ছাগলনাইয়া"],
        "lat": 23.0361,
        "lon": 91.5186
    },
    {
        "name": "Daganbhuiyan",
        "bangla": "দাগনভূঞা",
        "district": "Feni",
        "division": "Chittagong",
        "aliases": ["daganbhuiyan", "দাগনভূঞা", "daganbhuiya", "দাগনভুঁইয়া"],
        "lat": 22.9372,
        "lon": 91.3061
    },
    {
        "name": "Companiganj",
        "bangla": "কোম্পানীগঞ্জ",
        "district": "Noakhali",
        "division": "Chittagong",
        "aliases": ["companiganj", "কোম্পানীগঞ্জ", "companyganj", "কোম্পানিগঞ্জ"],
        "lat": 22.7667,
        "lon": 91.2833
    },
    {
        "name": "Senbagh",
        "bangla": "সেনবাগ",
        "district": "Noakhali",
        "division": "Chittagong",
        "aliases": ["senbagh", "সেনবাগ", "senbag", "সেনবাগ"],
        "lat": 22.9833,
        "lon": 91.2333
    },
    {
        "name": "Begumganj",
        "bangla": "বেগমগঞ্জ",
        "district": "Noakhali",
        "division": "Chittagong",
        "aliases": ["begumganj", "বেগমগঞ্জ", "chowmuhani", "চৌমুহনী"],
        "lat": 22.9500,
        "lon": 91.1000
    },
    {
        "name": "Chauddagram",
        "bangla": "চৌদ্দগ্রাম",
        "district": "Comilla",
        "division": "Chittagong",
        "aliases": ["chauddagram", "চৌদ্দগ্রাম", "chauddagram"],
        "lat": 23.2167,
        "lon": 91.3167
    }
]

# Need Keywords
NEED_PATTERNS = {
    "Water": [r"পানি", r"পানি\b", r"বিশুদ্ধ পানি", r"খাবার পানি", r"water", r"drinking water", r"clean water"],
    "Food": [r"খাবার", r"চাল", r"ডাল", r"শুকনো খাবার", r"খাদ্য", r"food", r"rice", r"ration", r"relief food"],
    "Medicine": [r"ঔষধ", r"ঔষধপত্র", r"স্যালাইন", r"চিকিৎসা", r"ডাক্তার", r"medicine", r"medical", r"saline", r"doctor"],
    "Boat Rescue": [r"নৌকা", r"বোট", r"উদ্ধার", r"স্পিডবোট", r"ট্রলার", r"boat", r"rescue", r"trapped", r"panibondi", r"পানিবন্দী"],
    "Shelter": [r"আশ্রয়", r"তাঁবু", r"পলিথিন", r"shelter", r"tent", r"tarp"]
}


def parse_sms_report(sender: str, raw_message: str) -> Dict[str, Any]:
    """
    Deterministic rule-based parser for disaster SMS in Bangla and English.
    Extracts: location, district, upazila, needs, severity, and household numbers.
    """
    normalized_text = normalize_bangla_digits(raw_message.lower())

    # 1. Location Matching
    matched_location = None
    location_confidence = "LOW"

    for loc in LOCATION_DICTIONARY:
        for alias in loc["aliases"]:
            if alias.lower() in normalized_text:
                matched_location = loc
                location_confidence = "HIGH"
                break
        if matched_location:
            break

    # 2. Needs Extraction
    detected_needs = []
    for need_category, patterns in NEED_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, raw_message, re.IGNORECASE):
                detected_needs.append(need_category)
                break

    if not detected_needs:
        detected_needs = ["Food", "Drinking Water"]

    # 3. Affected Quantity Extraction (People / Households)
    households = None
    people = None

    # Match patterns like: "৫০ পরিবার" / "50 households" / "100 families" / "50 poribar"
    hh_match = re.search(r'(\d+)\s*(পরিবার|family|families|household|households|poribar)', normalized_text, re.IGNORECASE)
    if hh_match:
        try:
            households = int(hh_match.group(1))
        except ValueError:
            pass

    # Match patterns like: "১০০ জন" / "100 people" / "300 person"
    people_match = re.search(r'(\d+)\s*(জন|মানুষ|লোক|people|persons|person)', normalized_text, re.IGNORECASE)
    if people_match:
        try:
            people = int(people_match.group(1))
        except ValueError:
            pass

    if households and not people:
        people = households * 4
    elif people and not households:
        households = max(1, people // 4)

    # 4. Severity Assessment
    is_urgent = False
    severity = "MODERATE"
    if any(k in normalized_text for k in ["জরুরী", "জরুরি", "পানিবন্দী", "বাঁচান", "urgent", "trapped", "critical", "danger", "help"]):
        is_urgent = True
        severity = "CRITICAL"
    elif "উদ্ধার" in normalized_text or "boat" in normalized_text or "নৌকা" in normalized_text:
        is_urgent = True
        severity = "CRITICAL"
    elif len(detected_needs) >= 3:
        severity = "SEVERE"

    return {
        "raw_message": raw_message,
        "sender": sender,
        "location": matched_location["name"] if matched_location else None,
        "division": matched_location["division"] if matched_location else "Chittagong",
        "district": matched_location["district"] if matched_location else "Feni",
        "upazila": matched_location["name"] if matched_location else "Sonagazi",
        "union": None,
        "lat": matched_location["lat"] if matched_location else 22.8500,
        "lon": matched_location["lon"] if matched_location else 91.3900,
        "location_confidence": location_confidence,
        "need_types": detected_needs,
        "need_type_string": ", ".join(detected_needs),
        "severity": severity,
        "people_affected": people or 50,
        "households_affected": households or 12,
        "is_urgent": is_urgent,
        "is_trapped": is_urgent or "পানিবন্দী" in raw_message
    }
