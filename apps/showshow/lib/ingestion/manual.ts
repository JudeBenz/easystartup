import type { IngestionAdapter, NormalizedEditionFact } from "./schema";
import { NormalizedEditionFactSchema, assertNotAggregatorSource } from "./schema";

/**
 * Manual entry adapter — primary path for curated official-site facts.
 * Future adapters (official APIs, licensed feeds) implement the same interface.
 */
export class ManualFactAdapter implements IngestionAdapter {
  id = "manual-v1";
  label = "Manual official-site entry";
  sourceKind = "manual" as const;

  constructor(private readonly facts: NormalizedEditionFact[]) {}

  async fetchFacts(): Promise<NormalizedEditionFact[]> {
    return this.facts.map((raw) => {
      assertNotAggregatorSource(raw.sourceUrl);
      assertNotAggregatorSource(raw.officialWebsiteUrl);
      return NormalizedEditionFactSchema.parse({
        ...raw,
        adapterId: this.id,
        sourceKind: this.sourceKind,
      });
    });
  }
}

export async function runAdapter(adapter: IngestionAdapter): Promise<NormalizedEditionFact[]> {
  const facts = await adapter.fetchFacts();
  return facts.map((f) => {
    assertNotAggregatorSource(f.sourceUrl);
    return NormalizedEditionFactSchema.parse(f);
  });
}
