import { z } from 'zod';

export const exceptionSchema = z.object({
  objectType: z.enum(['vm', 'host', 'lun']),
  identifier: z.string().min(1),
  sourceSystem: z.string().min(1),
  reason: z.string().min(3),
  createdBy: z.string().min(1),
});

export const systemConfigSchema = z.object({
  systemType: z.enum(['itop', 'vcenter', 'unity', 'pure', 'alletra']),
  name: z.string().trim().min(1, 'Tên kết nối không được để trống.').max(191),
  url: z
    .string()
    .trim()
    .min(1, 'URL/IP không được để trống.')
    .max(500)
    .refine((value) => !/\s/.test(value), 'URL/IP không được chứa khoảng trắng.'),
  username: z.string().trim().max(191).optional(),
  password: z.string().max(2048).optional(),
  port: z.number().int().min(1).max(65535).optional().nullable(),
  apiPath: z.string().trim().max(500).optional().nullable(),
});

export const discrepancySchema = z.object({
  objectType: z.enum(['vm', 'host', 'lun']),
  identifier: z.string().min(1),
  sourceSystem: z.string().min(1),
  type: z.enum(['missing_in_itop', 'extra_in_itop', 'field_mismatch']),
  field: z.string().optional().nullable(),
  itopValue: z.string().optional().nullable(),
  sourceValue: z.string().optional().nullable(),
  severity: z.enum(['low', 'medium', 'high']),
  summary: z.string().min(1),
});

