import { z } from "zod";

const idString = z.string().trim().min(1);

export const academicYearFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  calendarType: z.string().trim().min(1),
});

export const batchFormSchema = z.object({
  name: z.string().trim().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
  type: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  description: z.string().optional(),
  isActive: z.boolean(),
  academicYear: idString,
});

export const facultyProjectFormSchema = z.object({
  projectName: z.string().trim().min(1),
  group: idString,
  teacher: idString,
  projectRepository: idString,
});

/** `groupMembers` = comma- or whitespace-separated student IDs */
export const facultyGroupFormSchema = z.object({
  name: z.string().trim().min(1),
  groupMembersCsv: z.string().default(""),
  groupLeader: idString,
});

export function parseStudentIds(csv) {
  return String(csv ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
