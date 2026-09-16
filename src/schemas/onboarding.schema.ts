import { z } from "zod";
import { EMPLOYMENT_TYPES, GENDERS, QUALIFICATION_TYPES } from "@/types/onboarding";

const MOBILE_REGEX = /^[+]?[\d\s-]{7,15}$/;
const PINCODE_REGEX = /^\d{4,8}$/;
const YEAR_REGEX = /^\d{4}$/;

export const basicInfoSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date")
    .refine((value) => new Date(value) <= new Date(), "Date of birth cannot be in the future")
    .refine((value) => {
      const dob = new Date(value);
      const sixteenYearsAgo = new Date();
      sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);
      return dob <= sixteenYearsAgo;
    }, "Must be at least 16 years old"),
  gender: z.enum(GENDERS, { message: "Select a gender" }),
  // The backend creates the User account from this step, so the email that
  // account logs in with is collected here — not in Contact Information.
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  profilePictureName: z.string().optional(),
  profilePictureUrl: z.string().optional(),
});
export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

export const contactInfoSchema = z.object({
  mobile: z.string().trim().min(1, "Mobile number is required").regex(MOBILE_REGEX, "Enter a valid mobile number"),
  alternateMobile: z
    .string()
    .trim()
    .regex(MOBILE_REGEX, "Enter a valid mobile number")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().regex(PINCODE_REGEX, "Enter a valid pincode").optional().or(z.literal("")),
});
export type ContactInfoValues = z.infer<typeof contactInfoSchema>;

export const professionalInfoSchema = z.object({
  department: z.string().trim().min(1, "Department is required"),
  designation: z.string().trim().min(1, "Designation is required"),
  joiningDate: z
    .string()
    .min(1, "Joining date is required")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date"),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional().or(z.literal("")),
  reportingManager: z.string().trim().optional(),
  workLocation: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  previousCompany: z.string().trim().optional(),
});
export type ProfessionalInfoValues = z.infer<typeof professionalInfoSchema>;

export const roleAccessSchema = z.object({
  role: z.string().min(1, "Select a role"),
});

export const technologySchema = z.object({
  technologies: z.array(z.string()).min(1, "Select at least one technology"),
});

export const qualificationEntrySchema = z
  .object({
    type: z.enum(QUALIFICATION_TYPES, { message: "Select a qualification type" }),
    institution: z.string().trim().min(1, "Institution is required"),
    boardOrDegree: z.string().trim().min(1, "Board / degree is required"),
    specialization: z.string().trim().optional(),
    startYear: z.string().min(1, "Start year is required").regex(YEAR_REGEX, "Enter a valid 4-digit year"),
    endYear: z.string().min(1, "End year is required").regex(YEAR_REGEX, "Enter a valid 4-digit year"),
    percentageOrGrade: z.string().trim().optional(),
    certificateFileName: z.string().optional(),
    certificateUrl: z.string().optional(),
  })
  .refine((data) => Number(data.endYear) >= Number(data.startYear), {
    message: "End year can't be before start year",
    path: ["endYear"],
  });
export type QualificationEntryValues = z.infer<typeof qualificationEntrySchema>;

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  relationship: z.string().trim().min(1, "Relationship is required"),
  mobile: z.string().trim().min(1, "Mobile number is required").regex(MOBILE_REGEX, "Enter a valid mobile number"),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  isPrimary: z.boolean(),
});
export type EmergencyContactValues = z.infer<typeof emergencyContactSchema>;
