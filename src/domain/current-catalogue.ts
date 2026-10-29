import { z } from "zod";
export const currentCataloguePolicySchema = z
  .object({
    schemaVersion: z.literal(1),
    version: z.string().min(1).max(80),
    publishedAt: z.string().datetime(),
    expectedSeedCount: z.number().int().min(1).max(100),
    seedSampleIds: z.array(z.string().uuid()).min(1).max(100),
    retiredSampleIds: z.array(z.string().uuid()).max(200),
    description: z.string().max(300),
  })
  .strict()
  .superRefine((x, c) => {
    if (x.seedSampleIds.length !== x.expectedSeedCount)
      c.addIssue({ code: "custom", message: "Catalogue is incomplete" });
    if (
      new Set(x.seedSampleIds).size !== x.seedSampleIds.length ||
      new Set(x.retiredSampleIds).size !== x.retiredSampleIds.length
    )
      c.addIssue({ code: "custom", message: "Duplicate catalogue identity" });
    if (x.seedSampleIds.some((id) => x.retiredSampleIds.includes(id)))
      c.addIssue({
        code: "custom",
        message: "Active and retired identities overlap",
      });
  });
export type CurrentCataloguePolicy = z.infer<
  typeof currentCataloguePolicySchema
>;
