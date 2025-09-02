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

export const fetchHospitals = async (clerk_id) => {
  const supabase = createClient();

  const hospital_id = await userHospital(clerk_id);

  const { data, error } = await supabase
  .from("hospitals")
  .select("id,name")
  .neq('id',hospital_id);

  if (error) {
    console.error("Error fetching hospitals:", error);
    throw error;
  }

  return data;
};

const userHospital = async (clerk_id) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("hospital_id")
    .eq("clerk_id", clerk_id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching hospital:", error);
    throw error;
  }

  const hospital_id = data?.hospital_id;

  if (!hospital_id) {
    throw new Error(`No hospital found for user with clerk_id ${clerk_id}`);
  }

  return hospital_id;
};

export const validHospitalSelection = async (hospital_id, department) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("hospital_capacity")
    .select("department, capacity_available")
    .eq("hospital_id", hospital_id)
    .eq("department", department);

  if (error) {
    console.error("Error fetching hospital capacity data:", error);
    throw error;
  }

  const hasDepartment = data.length > 0;
  const capacityAvailable = hasDepartment
    ? data[0].capacity_available > 0
    : false;

  return {
    hasDepartment,
    capacityAvailable,
    isValid: hasDepartment && capacityAvailable,
  };
};

// Haversine formula to compute distance in km
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Advanced hospital selection using exponential scaling
 * Returns the ID of the best hospital
 * @param {string} hospital_id - reference hospital
 * @param {string} department - required department
 * @returns {string|null} best hospital ID
 */
export const findOptimalHospital = async (clerk_id, department) => {
  const supabase = createClient();

  try {
    // 0. Fetch user's current hospital
    const hospital_id = await userHospital(clerk_id);

    // 1. Reference hospital coordinates
    const { data: hospitalData, error: hospitalError } = await supabase
      .from("hospitals")
      .select("id, latitude, longitude, type")
      .eq("id", hospital_id)
      .single();

    if (hospitalError || !hospitalData) {
      return { success: false, message: `Failed to fetch reference hospital for ID ${hospital_id}` };
    }

    const { latitude: refLat, longitude: refLon } = hospitalData;

    // 2. Fetch hospitals with required department and available capacity
    const { data: availableHospitals, error: capacityError } = await supabase
      .from("hospital_capacity")
      .select(`
        hospital_id,
        capacity_available,
        capacity_total,
        hospitals!inner(id, name, latitude, longitude, type)
      `)
      .gt("capacity_available", 0)
      .eq("department", department)
      .neq("hospital_id", hospital_id);

    if (capacityError) {
      return { success: false, message: "Failed to fetch hospital capacities" };
    }

    if (!availableHospitals || availableHospitals.length === 0) {
      return { success: false, message: "No available hospitals found with the required department and capacity" };
    }

    // 3. Compute distance and metrics
    const hospitalsWithMetrics = availableHospitals.map((row) => {
      const hosp = row.hospitals;
      const distance = getDistanceKm(refLat, refLon, hosp.latitude, hosp.longitude);
      const loadFactor = row.capacity_total
        ? 1 - row.capacity_available / row.capacity_total
        : 0.5;

      return {
        id: hosp.id,
        distance,
        capacity_available: row.capacity_available,
        loadFactor,
        type: hosp.type,
      };
    });

    // 4. Compute exponential score
    const weightedHospitals = hospitalsWithMetrics.map((h) => {
      const distanceScore = Math.exp(-h.distance / 10);
      const capacityScore = Math.exp(h.capacity_available / 10);
      const loadPenalty = Math.exp(-h.loadFactor * 5);
      const typeBonus = h.type === "specialist" ? 1.2 : 1;

      const score = distanceScore * capacityScore * loadPenalty * typeBonus;
      return { id: h.id, score };
    });

    // 5. Return hospital with max score
    weightedHospitals.sort((a, b) => b.score - a.score);
    const bestHospitalId = weightedHospitals[0]?.id || null;

    if (!bestHospitalId) {
      return { success: false, message: "No suitable hospital found" };
    }

    return { success: true, message: "Optimal hospital found", data: bestHospitalId };
  } catch (err) {
    return { success: false, message: `findOptimalHospital failed: ${err.message}` };
  }
};

