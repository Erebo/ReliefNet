export type UserRole = "ADMIN" | "OPERATOR" | "VERIFIER" | "RELIEF_PROVIDER" | "VIEWER";

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  organization_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SMSParseResult {
  division: string;
  district: string;
  upazila: string;
  union?: string;
  location_confidence: string;
  need_types: string[];
  severity: SeverityLevel;
  households_affected: number;
  people_affected: number;
  is_trapped: boolean;
  report_id?: number;
  notes?: string;
}

export type AdminLevel = "DIVISION" | "DISTRICT" | "UPAZILA" | "UNION";

export interface AdministrativeArea {
  id: number;
  name: string;
  bangla_name?: string;
  level: AdminLevel;
  pcode?: string;
  parent_id?: number;
  center_lat: number;
  center_lon: number;
  bounding_box?: string;
  geojson_geometry?: string;
  population_est?: number;
}

export type InstitutionType = "SCHOOL" | "COLLEGE" | "NGO" | "CYCLONE_SHELTER" | "HOSPITAL";
export type VerificationStatus = "PENDING" | "CONTACTED" | "VERIFIED" | "PARTIALLY_VERIFIED" | "REJECTED";

export interface Institution {
  id: number;
  name: string;
  bangla_name?: string;
  type: InstitutionType;
  division: string;
  district: string;
  upazila: string;
  union?: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  source: string;
  source_id?: string;
  capacity_est?: number;
  verification_status: VerificationStatus;
  last_verified_at?: string;
  created_at: string;
  nearby_reports_count?: number;
}

export type ProviderType = "GOV" | "INGO" | "LOCAL_NGO" | "VOLUNTEER";
export type ResourceCategory = "FOOD" | "WATER" | "MEDICINE" | "HYGIENE" | "SHELTER" | "BOAT" | "VOLUNTEER" | "TRANSPORT";

export interface ReliefResource {
  id: number;
  provider_id: number;
  category: ResourceCategory;
  item_name: string;
  available_qty: number;
  reserved_qty: number;
  delivered_qty: number;
  unit: string;
  last_updated: string;
}

export interface ReliefProvider {
  id: number;
  name: string;
  bangla_name?: string;
  type: ProviderType;
  contact_person: string;
  phone: string;
  email?: string;
  website?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  operating_upazilas?: string;
  is_verified: boolean;
  is_available: boolean;
  notes?: string;
  is_demo_data: boolean;
  created_at: string;
  updated_at: string;
  resources: ReliefResource[];
}

export type ReportSource = "SMS" | "WEB" | "OPERATOR" | "IMPORTED";
export type SeverityLevel = "CRITICAL" | "SEVERE" | "MODERATE" | "LOW";
export type ReportStatus = "UNVERIFIED" | "PENDING_VERIFICATION" | "VERIFIED" | "PARTIALLY_VERIFIED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

export interface CommunityReport {
  id: number;
  source: ReportSource;
  sender_phone?: string;
  reporter_name?: string;
  raw_message: string;
  division?: string;
  district?: string;
  upazila?: string;
  union?: string;
  locality_details?: string;
  latitude?: number;
  longitude?: number;
  location_confidence: string;
  need_type?: string;
  severity: SeverityLevel;
  people_affected?: number;
  households_affected?: number;
  is_water_available: boolean;
  is_food_available: boolean;
  is_medical_needed: boolean;
  is_trapped: boolean;
  status: ReportStatus;
  assignment_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type VerificationCondition = "SAFE" | "PARTIALLY_FLOODED" | "SEVERELY_FLOODED" | "EVACUATED" | "UNABLE_TO_CONFIRM";

export interface VerificationRecord {
  id: number;
  report_id?: number;
  institution_id?: number;
  verifier_id?: number;
  reported_condition: VerificationCondition;
  status: VerificationStatus;
  water_level_estimate?: string;
  access_road_status?: string;
  shelter_occupancy?: number;
  notes?: string;
  verified_at: string;
  institution_name?: string;
  verifier_name?: string;
}

export type AssignmentPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type AssignmentStatus = "ASSIGNED" | "ACCEPTED" | "PREPARING" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "PARTIALLY_DELIVERED" | "CANCELLED";

export interface AllocatedResourceItem {
  category: string;
  item_name: string;
  quantity: number;
  unit: string;
}

export interface ReliefAssignment {
  id: number;
  provider_id: number;
  provider_name?: string;
  created_by_user_id?: number;
  destination_division: string;
  destination_district: string;
  destination_upazila: string;
  destination_union?: string;
  destination_locality?: string;
  destination_lat?: number;
  destination_lon?: number;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  allocated_resources: string;
  target_households?: number;
  target_people?: number;
  expected_delivery_time?: string;
  dispatched_at?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryItem {
  id: number;
  delivery_id: number;
  resource_category: ResourceCategory;
  item_name: string;
  quantity_delivered: number;
  unit: string;
}

export interface ReliefDelivery {
  id: number;
  assignment_id: number;
  delivered_by_user_id?: number;
  status: AssignmentStatus;
  delivered_at: string;
  people_served: number;
  households_served: number;
  proof_notes?: string;
  distribution_point?: string;
  created_at: string;
  items: DeliveryItem[];
}

export type ContactMethod = "PHONE" | "EMAIL" | "SMS" | "IN_PERSON";

export interface Communication {
  id: number;
  institution_id?: number;
  provider_id?: number;
  logged_by_user_id?: number;
  contact_method: ContactMethod;
  contact_target: string;
  purpose: string;
  result: string;
  notes?: string;
  contacted_at: string;
  logged_by_name?: string;
}

export interface SMSMessage {
  id: number;
  message_sid?: string;
  sender: string;
  body: string;
  direction: string;
  is_processed: boolean;
  parsed_location?: string;
  parsed_need?: string;
  parsed_severity?: string;
  parsed_people?: number;
  parsed_households?: number;
  processing_notes?: string;
  received_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  actor_name?: string;
  details?: string;
  created_at: string;
}

export interface FloodSimulation {
  id: number;
  name: string;
  severity: SeverityLevel;
  affected_district: string;
  affected_upazilas: string;
  water_level_m_est: number;
  source_label: string;
  geojson_polygon: string;
  is_active: boolean;
  simulated_at: string;
}

export type GapType = "CRITICAL_GAP" | "RESPONSE_GAP" | "COVERAGE_GAP" | "VERIFICATION_GAP" | "AID_DUPLICATION";

export interface GapAlert {
  id: string;
  gap_type: GapType;
  severity: SeverityLevel;
  title: string;
  district: string;
  upazila: string;
  union?: string;
  locality?: string;
  lat?: number;
  lon?: number;
  report_count: number;
  verified_households_affected: number;
  assigned_providers_count: number;
  allocated_food_packages: number;
  allocated_water_units: number;
  delivered_food_packages: number;
  delivered_water_units: number;
  description: string;
  recommended_action: string;
  action_type: "ASSIGN_PROVIDER" | "EXPEDITE_DISPATCH" | "REVIEW_COVERAGE" | "VERIFY_AREA";
}

export interface SearchResult {
  id: number;
  title: string;
  bangla_title?: string;
  type: string;
  lat: number;
  lon: number;
  subtitle?: string;
  confidence?: string;
}

export interface OverviewMetrics {
  critical_needs: number;
  pending_verifications: number;
  active_operations: number;
  in_transit: number;
  delivered_aid: number;
  critical_gaps: number;
  total_reports: number;
  total_providers: number;
}
