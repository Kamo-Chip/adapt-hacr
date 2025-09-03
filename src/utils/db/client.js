import { createClient } from "@/utils/supabase/client";

/**
 * Check if a user exists in the Supabase database by their Clerk ID
 * @param {string} clerk_id - The Clerk ID of the user to check
 * @returns {Promise<boolean>} - True if the user exists, false otherwise
 */
export async function checkUserExists(clerk_id) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerk_id);

  if (error) {
    console.error("Error checking user existence:", error);
    throw error;
  }

  return data.length > 0;
}

export async function checkOnboardingStatus(clerk_id) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("onboarding_complete")
    .eq("clerk_id", clerk_id)
    .single();

  if (error) {
    console.error("Error checking onboarding status:", error);
    throw error;
  }

  return data ? data.onboarding_complete : false;
}

export async function createUser(clerk_id, email, name) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .insert([{ clerk_id, email, name, onboarding_complete: false }])
    .select();

  if (error) {
    console.error("Error creating user:", error);
    throw error;
  }

  return data[0];
}

/**
 * Upload an image to Supabase storage
 * @param {File} file - The image file to upload
 * @param {string} bucket - The name of the storage bucket
 * @param {string} fileName - The name to give the uploaded file
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export const uploadImageToSupabase = async (file, bucket, fileName) => {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).upload(fileName, file);
  if (error) {
    console.error("Error uploading image:", error.message);
    throw error;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
};


async function getUserHospitalId(clerk_id) {
  const supabase = createClient();

  const { data, error } = await supabase()
    .from("users")
    .select("hospital_id")
    .eq("clerk_id", clerk_id)
    .single();
  if (error) throw error;
  return data?.hospital_id ?? null;
}

// LISTS
export async function getReferrals(clerk_id) {
  const supabase = createClient();

  const hospitalId = await getUserHospitalId(clerk_id);
  if (!hospitalId) return [];
  const { data, error } = await supabase()
    .from("referrals")
    .select("*")
    .eq("to_hospital_id", hospitalId)
    .eq("status", "pending")             // <- align this vocabulary with your DB
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSpecificReferrals(clerk_id) {
  const supabase = createClient();

  const hospitalId = await getUserHospitalId(clerk_id);
  if (!hospitalId) return [];
  const { data, error } = await supabase()
    .from("referrals")
    .select("*")
    .eq("to_hospital_id", hospitalId)
    .eq("status", "pending")
    .eq("referral_type", "specific")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getGeneralReferrals(clerk_id) {
  const supabase = createClient();

  const hospitalId = await getUserHospitalId(clerk_id);
  if (!hospitalId) return [];
  const { data, error } = await supabase()
    .from("referrals")
    .select("*")
    .eq("to_hospital_id", hospitalId)
    .eq("status", "pending")
    .eq("referral_type", "general")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ACTIONS (singular, by referral id)
export async function approveReferral(referralId, clerk_id) {
  const supabase = createClient();

  const { data, error } = await supabase()
    .from("referrals")
    .update({
      status: "approved",
      responded_at: new Date().toISOString(),
      assigned_to_user_id: clerk_id, // optional: ensure assignment on approve
      updated_at: new Date().toISOString(),
    })
    .eq("id", referralId)
    .eq("status", "pending")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * If you truly want to “reject” (final state), keep status "rejected".
 * If the intent is “decline this assignment, keep it available”, then:
 *  - set status back to "pending"
 *  - clear assigned_to_user_id
 *  - (optionally) store a reason
 */
export async function rejectReferral(referralId, reason = null) {
  const supabase = createClient();

  const { data, error } = await supabase()
    .from("referrals")
    .update({
      status: "rejected",                  // or "pending" + assigned_to_user_id: null (see below)
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // additional_notes: reason ?? null, // or add a dedicated 'rejection_reason' column
    })
    .eq("id", referralId)
    .eq("status", "pending")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

// “Decline but keep pending” alternative:
/*
export async function declineReferral(referralId, reason = null) {
  const { data, error } = await supabase()
    .from("referrals")
    .update({
      status: "pending",
      assigned_to_user_id: null,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // additional_notes: reason ?? null,
    })
    .eq("id", referralId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
*/

export async function completeReferral(referralId, clerk_id) {
  const supabase = createClient();

  const { data, error } = await supabase()
    .from("referrals")
    .update({
      status: "completed",
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", referralId)
    .eq("assigned_to_user_id", clerk_id) // safety: only the assignee can complete
    .eq("status", "approved")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}