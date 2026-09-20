/**
 * User Types
 *
 * Basic TypeScript interfaces for user and profile data structures.
 * These are used for UI rendering only — no real user data is stored here.
 *
 * TODO: Extend these types to match the Supabase auth.users and profiles schema.
 */

/**
 * The role determines which dashboard and features a user sees.
 * NOTE: This is the single source of truth for roles across the app.
 * See `constants/roles.ts` for the role configuration maps.
 */
export type UserRole = 'student' | 'employer' | 'admin';

/** Verification state of a student account. */
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

/**
 * Core user record (mirrors Supabase auth.users + custom profile).
 */
export interface User {
  /** Supabase auth user UUID. */
  id: string;
  /** User email address. */
  email: string;
  /** User role on the platform. */
  role: UserRole;
  /** Display name. */
  displayName: string;
  /** URL to profile avatar image. */
  avatarUrl?: string;
  /** ISO date-time string when the account was created. */
  createdAt: string;
}

/**
 * Student profile — extends User with university-specific fields.
 */
export interface StudentProfile extends User {
  role: 'student';
  /** KU Sriracha student ID (used for verification). */
  studentId?: string;
  /** Faculty / department name. */
  faculty?: string;
  /** Year of study (1–4+). */
  studyYear?: number;
  /** University affiliation label, e.g. "Kasetsart University Sriracha". */
  university: string;
  /** KU email used for verification, e.g. xxx@ku.th. */
  universityEmail?: string;
  /** KU student verification status. */
  verificationStatus: VerificationStatus;
  /** Optional short bio. */
  bio?: string;
  /** List of skill tags. */
  skills?: string[];
}

/**
 * Employer profile — extends User with business-specific fields.
 */
export interface EmployerProfile extends User {
  role: 'employer';
  /** Business / company name. */
  companyName: string;
  /** URL to company logo. */
  companyLogoUrl?: string;
  /** Business category, e.g. "Food & Beverage". */
  category?: string;
  /** Business address or area. */
  address?: string;
  /** Whether the employer account has been verified by an admin. */
  isVerified: boolean;
  /** Total number of active job listings. */
  activeJobCount?: number;
}

/**
 * Admin profile — minimal extension of User.
 */
export interface AdminProfile extends User {
  role: 'admin';
}

/** Union of all profile types. */
export type AnyProfile = StudentProfile | EmployerProfile | AdminProfile;
