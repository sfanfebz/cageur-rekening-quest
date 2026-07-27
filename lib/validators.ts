import { z } from "zod";

const onlyDigits = /^\d+$/;
const onlySymbolsOrDigits = /^[^a-zA-Z]*$/;

export const identitySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nama minimal 3 karakter.")
    .refine((value) => !onlyDigits.test(value.replace(/\s+/g, "")), "Nama tidak boleh hanya angka.")
    .refine((value) => !onlySymbolsOrDigits.test(value), "Nama tidak boleh hanya simbol atau angka."),
  nip: z
    .string()
    .trim()
    .min(1, "NIP wajib diisi.")
    .regex(onlyDigits, "NIP hanya boleh berisi angka."),
  consent: z.literal(true, { errorMap: () => ({ message: "Persetujuan wajib dicentang." }) }),
});

export type IdentityInput = z.infer<typeof identitySchema>;

export const passcodeSchema = z.object({
  passcode: z.string().min(1),
});

export const questStartSchema = z.object({
  campaignCode: z.string().min(1),
  questCode: z.string().min(1),
});

export const questCompleteSchema = z.object({
  campaignCode: z.string().min(1),
  questCode: z.string().min(1),
  answer: z.unknown(),
});

export const adminParticipantIdSchema = z.object({
  participantId: z.string().uuid(),
});

export const adminSwitchCampaignSchema = z.object({
  campaignId: z.string().uuid(),
});
