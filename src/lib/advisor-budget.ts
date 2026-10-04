import { getCatalogItem } from "./catalog";

export interface BudgetConstraintResult {
  /** Possibly-trimmed list, in the same order as the input (most important first). */
  itemIds: string[];
  estimatedWeeklyCents: number;
  /** True only when items were actually dropped to fit the budget. */
  trimmed: boolean;
}

/**
 * Enforces a weekly budget on an advisor suggestion (AI or rule-based
 * fallback, either can be handed in here) regardless of how well the model
 * itself respected the number we asked for. We trust the caller's ordering
 * ("most important first" — both the AI prompt and the fallback bank are
 * written that way) and drop from the tail once the running total would
 * exceed the budget.
 *
 * Unknown catalog ids are dropped silently (same validation the advisor
 * route already does for the AI path) rather than crashing a suggestion.
 * When no budget is given, every valid id is kept and nothing is trimmed —
 * this is also how a caller with no budget opinion gets a correct total.
 */
export function applyBudgetConstraint(
  itemIds: string[],
  budgetWeeklyCents: number | undefined,
): BudgetConstraintResult {
  const valid = itemIds.filter((id) => getCatalogItem(id) !== undefined);

  if (budgetWeeklyCents === undefined || budgetWeeklyCents <= 0) {
    const total = valid.reduce((sum, id) => sum + (getCatalogItem(id)?.weeklyPriceUsdCents ?? 0), 0);
    return { itemIds: valid, estimatedWeeklyCents: total, trimmed: false };
  }

  const kept: string[] = [];
  let total = 0;

  for (const id of valid) {
    const item = getCatalogItem(id)!;
    const nextTotal = total + item.weeklyPriceUsdCents;
    // Always keep at least one item, even over budget alone, so a tight
    // budget still gets a concrete starting point rather than an empty room.
    if (nextTotal <= budgetWeeklyCents || kept.length === 0) {
      kept.push(id);
      total = nextTotal;
    }
  }

  return { itemIds: kept, estimatedWeeklyCents: total, trimmed: kept.length < valid.length };
}
