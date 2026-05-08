import clsx from "clsx";
import { z } from "zod";

export const registerTeacherSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z
    .string()
    .refine(
      (val) => val === "" || /^\d{10,}$/.test(val),
      "Phone must contain at least 10 digits"
    )
    .optional()
    .or(z.literal("")),
  dateOfBirth: z
    .string()
    .refine(
      (val) =>
        val === "" ||
        !isNaN(Date.parse(val)),
      "Invalid date format"
    )
    .optional()
    .or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  joiningDate: z
    .string()
    .refine(
      (val) =>
        val === "" ||
        !isNaN(Date.parse(val)),
      "Invalid date format"
    )
    .optional()
    .or(z.literal("")),
});

export const updateTeacherSchema = z.object({
  phone: z
    .string()
    .refine(
      (val) => val === "" || /^\d{10,}$/.test(val),
      "Phone must contain at least 10 digits"
    )
    .optional()
    .or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

export type RegisterTeacherInput = z.infer<typeof registerTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;