/**
 * @typedef {Object} Referral
 * @property {string} id - UUID primary key
 * @property {string} referral_type - Type of referral (e.g., "specific")
 * @property {string} status - Current status, defaults to "DRAFT"
 * @property {string} from_hospital_id - UUID of the hospital creating the referral
 * @property {string|null} to_hospital_id - UUID of the hospital receiving the referral (nullable)
 * @property {string} created_by_user_id - Clerk ID of the user who created it
 * @property {string|null} assigned_to_user_id - Clerk ID of the user assigned (nullable)'
 * @property {string} patient_name - Patient's first name
 * @property {number|null} patient_age - Patient's age in years (nullable)
 * @property {string} department - Department handling the referral
 * @property {string} urgency - Level of urgency
 * @property {string|null} condition_description - Patient condition description
 * @property {string|null} known_allergies - Known allergies
 * @property {string|null} current_medications - Current medications
 * @property {string|null} preferred_referral_date - Preferred referral date (ISO date string)
 * @property {boolean} consent_medical_info - Whether patient consented to share medical info
 * @property {boolean} consent_whatsapp - Whether patient consented to WhatsApp comms
 * @property {string|null} additional_notes - Extra notes
 * @property {string} created_at - Timestamp with timezone when created
 * @property {string} updated_at - Timestamp with timezone when last updated
 * @property {string|null} responded_at - Timestamp when responded (nullable)
 * @property {string|null} closed_at - Timestamp when closed (nullable)
 * @property {string|null} ai_summary - AI-generated summary
 * @property {string[]|null} document_urls - Array of document URLs (nullable)
 */


/**
 * @typedef {Object} User
 * @property {string} clerk_id - Primary key (Clerk ID)
 * @property {string|null} email - User’s email (unique, nullable)
 * @property {string|null} name - User’s full name
 * @property {string|null} role - User’s role (e.g., "Doctor", "Admin")
 * @property {string|null} hospital_id - UUID of hospital (nullable, FK)
 * @property {boolean} onboarding_complete - Whether onboarding has been completed
 * @property {string} created_at - Timestamp with timezone when created
 */

/**
 * @typedef {Object} Hospital
 * @property {string} id - UUID primary key
 * @property {string|null} name - Hospital name
 * @property {string|null} type - Hospital type (e.g., "Public", "Private")
 * @property {string|null} whatsapp_number - WhatsApp contact number
 * @property {string|null} address_line1 - Street address line 1
 * @property {string|null} city - City
 * @property {string|null} province - Province
 * @property {string|null} postal_code - Postal/ZIP code
 * @property {string} country - Country (defaults to "South Africa")
 * @property {number|null} latitude - Latitude coordinate
 * @property {number|null} longitude - Longitude coordinate
 * @property {string} created_at - Timestamp with timezone when created
 * @property {string} updated_at - Timestamp with timezone when last updated
 */

/**
 * @typedef {Object} HospitalCapacity
 * @property {string} id - UUID primary key
 * @property {string} hospital_id - UUID of hospital (FK)
 * @property {string|null} department - Department name (nullable)
 * @property {number} capacity_total - Total number of beds/capacity
 * @property {number} capacity_available - Available capacity
 * @property {string} last_updated - Timestamp with timezone when last updated
 */

/**
 * @typedef {Object} ReferralDocument
 * @property {string} id - UUID primary key
 * @property {string} referral_id - UUID of referral (FK)
 * @property {string} bucket - Storage bucket (defaults to "medical-docs")
 * @property {string} object_path - Path to object in storage
 * @property {string|null} file_name - Original file name
 * @property {string|null} mime_type - MIME type (e.g., application/pdf, image/png)
 * @property {string|null} uploaded_by - UUID of user who uploaded the document (nullable)
 * @property {string} created_at - Timestamp with timezone when created
 */

export {};