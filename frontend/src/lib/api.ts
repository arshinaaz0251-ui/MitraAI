const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import type {
  AuditResponse,
  SimulateRequest,
  SimulateResponse,
  SchemeInfo,
  Language,
} from "./types";

export async function auditCitizen(
  file: File | null,
  spokenGoal: string,
  language: Language
): Promise<AuditResponse> {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  formData.append("spoken_goal", spokenGoal);
  formData.append("language", language);

  const res = await fetch(`${API_BASE}/api/v1/audit`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Audit failed" }));
    throw new Error(error.detail || "Audit failed");
  }

  return res.json();
}

export async function simulateEligibility(
  request: SimulateRequest
): Promise<SimulateResponse> {
  const res = await fetch(`${API_BASE}/api/v1/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error("Simulation failed");
  }

  return res.json();
}

export async function fetchSchemes(
  language: Language
): Promise<{ schemes: SchemeInfo[]; total: number }> {
  const res = await fetch(
    `${API_BASE}/api/v1/schemes?language=${language}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch schemes");
  }

  return res.json();
}

export async function explainSimpler(
  schemeInfo: string,
  language: Language
): Promise<string> {
  const formData = new FormData();
  formData.append("scheme_info", schemeInfo);
  formData.append("language", language);

  const res = await fetch(`${API_BASE}/api/v1/explain`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Explanation failed");
  }

  const data = await res.json();
  return data.explanation;
}

export interface CitizenProfileCreate {
  full_name: string;
  phone_number?: string | null;
  masked_id?: string | null;
  annual_income: number;
  category: string;
  state?: string;
  age?: number | null;
  is_student?: boolean;
}

export async function submitProfile(
  profile: CitizenProfileCreate,
  language: Language
): Promise<AuditResponse> {
  const res = await fetch(`${API_BASE}/api/v1/profile?language=${language}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Profile save failed" }));
    throw new Error(error.detail || "Profile save failed");
  }

  return res.json();
}

export async function registerCitizen(
  profile: CitizenProfileCreate
): Promise<{ status: string; profile_id?: string; message?: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(error.detail || "Registration failed");
  }

  return res.json();
}
