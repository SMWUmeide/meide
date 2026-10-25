import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
const code = z.number().int().min(1).max(14);
const text = z.string().max(4000);
const money = z.object({
  amount: z.number().int().min(0).max(100000000),
  currency: z.string().regex(/^[A-Z]{3}$/),
});
export const itemOutput = z.object({
  sectionId: z.string().min(1).max(80),
  photoIndex: z.number().int().min(0),
  readConfidence: z.enum(["high", "low"]),
  original: text.min(1),
  korean: text.min(1),
  price: money,
  confirmed: z.object({
    ingredients: z
      .array(z.object({ korean: text, original: text, note: text.optional() }))
      .max(40),
    allergens: z.array(code).max(14),
  }),
  ai: z.object({
    analogy: text,
    taste: text,
    possibleIngredients: z.array(text).max(40),
    cooking: text,
    possibleAllergens: z.array(z.object({ code, reason: text })).max(14),
    askStaff: z.object({ korean: text, local: text }).optional(),
  }),
});
export const analysisOutput = z.object({
  language: z.string().min(2).max(20),
  currency: z.string().regex(/^[A-Z]{3}$/),
  restaurantNameOnMenu: text.optional(),
  coperto: money.optional(),
  photos: z
    .array(
      z.object({
        index: z.number().int().min(0),
        readable: z.enum(["ok", "blurry", "glare"]),
      }),
    )
    .min(1)
    .max(12),
  sections: z
    .array(
      z.object({ id: z.string().min(1).max(80), original: text, korean: text }),
    )
    .max(40),
  items: z.array(itemOutput).max(160),
});
// Repeated array/numeric bounds make Gemini's decoding grammar reject this
// otherwise valid schema. Keep the wire shape here and enforce all limits above
// in validateAnalysis after generation.
function generationSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(generationSchema);
  if (!value || typeof value !== "object") return value;
  const validationOnly = new Set([
    "$schema",
    "minLength",
    "maxLength",
    "pattern",
    "minItems",
    "maxItems",
    "minimum",
    "maximum",
  ]);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !validationOnly.has(key))
      .map(([key, child]) => [key, generationSchema(child)]),
  );
}
export const analysisResponseSchema = generationSchema(
  zodToJsonSchema(analysisOutput, {
    $refStrategy: "none",
    target: "jsonSchema7",
  }),
);
export const analysisInput = z
  .object({
    photos: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          localKey: z.string().max(160),
          data: z
            .string()
            .min(1)
            .max(5500000)
            .regex(/^[A-Za-z0-9+/=]+$/),
          mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        }),
      )
      .min(1)
      .max(12),
    taste: z
      .array(z.object({ allergens: z.array(code).max(14) }).strict())
      .max(20),
  })
  .strict();
export type AnalysisInput = z.infer<typeof analysisInput>;
export type AnalysisOutput = z.infer<typeof analysisOutput>;
export function validateAnalysis(input: unknown, photoCount: number) {
  return analysisOutput
    .superRefine((value, ctx) => {
      const ids = value.sections.map((s) => s.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({ code: "custom", message: "Duplicate section IDs" });
      const indexes = value.photos.map((p) => p.index);
      if (
        indexes.length !== photoCount ||
        new Set(indexes).size !== photoCount ||
        indexes.some((i) => i >= photoCount)
      )
        ctx.addIssue({ code: "custom", message: "Photo coverage mismatch" });
      for (const item of value.items) {
        if (
          item.photoIndex >= photoCount ||
          !ids.includes(item.sectionId) ||
          item.price.currency !== value.currency
        )
          ctx.addIssue({
            code: "custom",
            message: "Invalid item reference/currency",
          });
        const photo = value.photos.find((p) => p.index === item.photoIndex);
        if (photo?.readable !== "ok" && item.readConfidence !== "low")
          ctx.addIssue({
            code: "custom",
            message: "Unreadable photo requires low confidence",
          });
      }
      if (value.coperto && value.coperto.currency !== value.currency)
        ctx.addIssue({ code: "custom", message: "Invalid coperto currency" });
    })
    .safeParse(input);
}
