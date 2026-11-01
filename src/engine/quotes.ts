import { MAX_QUOTES_PER_CATEGORY, type Category, type Plan, type Quote } from '../schemas';
import { categoryLabel } from './presets';
import { formatINR } from './money';

/** Maximum conventional advance percentage requested before triggering a warning flag. */
export const MAX_TYPICAL_ADVANCE_PCT = 50;

/** Total the vendor would charge for `guests`, or null when the quote has no usable price. */
export function effectiveCost(quote: Quote, guests: number): number | null {
  if (quote.totalPrice != null) return quote.totalPrice;
  if (quote.pricePerPlate != null) {
    return quote.pricePerPlate * Math.max(guests, quote.guestMinimum ?? 0);
  }
  return null;
}

export type FlagCode =
  | 'guestMinimumExceedsGuests'
  | 'overCategoryBudget'
  | 'taxNotStated'
  | 'advanceHigh'
  | 'overtimeFeeApplies'
  | 'noCancellationPolicy';

export interface QuoteFlag {
  code: FlagCode;
  message: string;
  /** Extra rupees, when the flag is a money amount (overCategoryBudget). */
  amount?: number;
}

/**
 * Compares an extracted quotation against the plan's allocation, guest count, and risk parameters.
 *
 * @param quote - The vendor quotation to inspect.
 * @param plan - Current plan details.
 * @returns Array of risk or mismatch flags.
 */
export function compareQuote(quote: Quote, plan: Plan): QuoteFlag[] {
  const flags: QuoteFlag[] = [];
  if (quote.guestMinimum != null && quote.guestMinimum > plan.guests) {
    flags.push({
      code: 'guestMinimumExceedsGuests',
      message: `Vendor minimum is ${quote.guestMinimum} guests but your plan has ${plan.guests}; you pay for ${quote.guestMinimum - plan.guests} extra.`,
    });
  }
  const cost = effectiveCost(quote, plan.guests);
  if (cost != null) {
    const budget = plan.allocation[quote.category];
    if (cost > budget) {
      const amount = cost - budget;
      flags.push({
        code: 'overCategoryBudget',
        amount,
        message: `${formatINR(amount)} over your ${categoryLabel(plan.occasion, quote.category)} budget of ${formatINR(budget)}.`,
      });
    }
  }
  if (quote.taxIncluded == null) {
    flags.push({
      code: 'taxNotStated',
      message: 'GST/tax is not mentioned; ask whether it is included.',
    });
  }
  if (quote.advancePercent != null && quote.advancePercent > MAX_TYPICAL_ADVANCE_PCT) {
    flags.push({
      code: 'advanceHigh',
      message: `${quote.advancePercent}% advance is high; 25-50% is more usual.`,
    });
  }
  if (quote.overtimeFeePerHour != null && quote.overtimeFeePerHour > 0) {
    flags.push({
      code: 'overtimeFeeApplies',
      message: `Overtime is charged at ${formatINR(quote.overtimeFeePerHour)} per hour.`,
    });
  }
  if (quote.cancellationPolicy == null) {
    flags.push({
      code: 'noCancellationPolicy',
      message: 'No cancellation or refund policy stated.',
    });
  }
  return flags;
}

export interface MissingField {
  field: string;
  question: string;
}

/**
 * Identifies crucial quote details that were omitted from vendor documentation.
 *
 * @param quote - Parsed quote object.
 * @returns List of missing fields and polite clarifying questions.
 */
export function missingFields(quote: Quote): MissingField[] {
  const out: MissingField[] = [];
  if (quote.totalPrice == null && quote.pricePerPlate == null) {
    out.push({ field: 'price', question: 'What is the total price (or per-plate rate)?' });
  }
  if (quote.guestMinimum == null) {
    out.push({ field: 'guestMinimum', question: 'Is there a minimum guest count?' });
  }
  if (quote.taxIncluded == null) {
    out.push({ field: 'taxIncluded', question: 'Is GST/tax included in this price?' });
  }
  if (quote.advancePercent == null) {
    out.push({
      field: 'advancePercent',
      question: 'How much advance is needed to confirm the booking?',
    });
  }
  if (quote.overtimeFeePerHour == null) {
    out.push({
      field: 'overtimeFeePerHour',
      question: 'What is the charge if the event runs over time?',
    });
  }
  if (quote.cancellationPolicy == null) {
    out.push({
      field: 'cancellationPolicy',
      question: 'What is your cancellation and refund policy?',
    });
  }
  if (quote.inclusions.length === 0) {
    out.push({ field: 'inclusions', question: 'What exactly is included in the price?' });
  }
  return out;
}

/**
 * Generates a polite, copy-ready clarification message to send to the vendor.
 *
 * @param quote - Target quotation.
 * @param plan - Current plan details.
 * @returns Ready-to-send draft message.
 */
export function inquiryDraft(quote: Quote, plan: Plan): string {
  const label = categoryLabel(plan.occasion, quote.category).toLowerCase();
  const greeting = quote.vendorName ? `Namaste ${quote.vendorName},` : 'Namaste,';
  const intro = `Thank you for your quote for ${label}. We are planning an event on ${plan.eventDate} with about ${plan.guests} guests.`;
  const missing = missingFields(quote);
  if (missing.length === 0) {
    return `${greeting}\n\n${intro} Your quote covers everything we needed. Please let us know the next steps to confirm the booking.\n\nThank you!`;
  }
  const list = missing.map((m, i) => `${i + 1}. ${m.question}`).join('\n');
  return `${greeting}\n\n${intro} Before we decide, could you please confirm:\n${list}\n\nThank you, we look forward to hearing from you.`;
}

/**
 * Adds a quote to the plan unless the category already reached comparison limit.
 *
 * @param plan - Current plan.
 * @param quote - Quote payload to store.
 * @param id - Unique quote ID.
 * @returns Updated plan and whether quote was added.
 */
export function addQuote(plan: Plan, quote: Quote, id: string): { plan: Plan; added: boolean } {
  const count = plan.quotes.filter((q) => q.category === quote.category).length;
  if (count >= MAX_QUOTES_PER_CATEGORY) return { plan, added: false };
  return {
    plan: {
      ...plan,
      quotes: [...plan.quotes, { id, category: quote.category, quote, accepted: false }],
    },
    added: true,
  };
}

/**
 * Accepting a quote makes it the single verified quotation for its category.
 *
 * @param plan - Current plan.
 * @param id - Quote ID to accept.
 * @returns Updated plan with designated quotation accepted.
 */
export function acceptQuote(plan: Plan, id: string): Plan {
  const target = plan.quotes.find((q) => q.id === id);
  if (!target) return plan;
  return {
    ...plan,
    quotes: plan.quotes.map((q) =>
      q.category === target.category ? { ...q, accepted: q.id === id } : q,
    ),
  };
}

/**
 * Removes a saved quote from the plan.
 *
 * @param plan - Current plan.
 * @param id - Quote ID to remove.
 * @returns Updated plan without the specified quote.
 */
export function removeQuote(plan: Plan, id: string): Plan {
  return { ...plan, quotes: plan.quotes.filter((q) => q.id !== id) };
}

/**
 * Marks all quotes in the specified category as unaccepted.
 *
 * @param plan - Current plan.
 * @param category - Target budget category.
 * @returns Updated plan with category unverified.
 */
export function unacceptCategory(plan: Plan, category: Category): Plan {
  return {
    ...plan,
    quotes: plan.quotes.map((q) => (q.category === category ? { ...q, accepted: false } : q)),
  };
}
