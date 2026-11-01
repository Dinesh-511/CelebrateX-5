import type { Task } from '../schemas';
import { diffDays } from './dates';

export interface Compression {
  /** True when the event is closer than the plan's longest lead time. */
  compressed: boolean;
  /** Share of the usual lead time that is available (1 when not compressed). */
  factor: number;
  availableDays: number;
  spanDays: number;
}

/**
 * Calculates whether a schedule needs compression and the available compression factor.
 *
 * @param tasks - The list of planning tasks.
 * @param eventDate - Target ISO event date.
 * @param today - Current reference ISO date.
 * @returns Compression details including factor and span.
 */
export function scheduleCompression(
  tasks: readonly Task[],
  eventDate: string,
  today: string,
): Compression {
  const spanDays = Math.max(0, ...tasks.map((t) => t.leadDays));
  const availableDays = diffDays(today, eventDate);
  const compressed = availableDays >= 0 && availableDays < spanDays;
  return { compressed, factor: compressed ? availableDays / spanDays : 1, availableDays, spanDays };
}

/**
 * When the event is closer than the usual lead time, pull every task in proportionally so the plan
 * starts today and keeps its order, instead of opening with a wall of overdue tasks. Leads and
 * durations are both rounded down, which keeps every dependency satisfiable (an on-time plan never
 * starts "at risk"). Past events are left alone, so their tasks honestly show as overdue.
 *
 * @param tasks - Raw tasks from preset templates.
 * @param eventDate - Target ISO event date.
 * @param today - Current reference ISO date.
 * @returns Adjusted tasks fitted to the available window.
 */
export function compressTasks(tasks: readonly Task[], eventDate: string, today: string): Task[] {
  const { compressed, factor } = scheduleCompression(tasks, eventDate, today);
  if (!compressed) return [...tasks];
  return tasks.map((t) => ({
    ...t,
    leadDays: Math.floor(t.leadDays * factor),
    durationDays: Math.floor(t.durationDays * factor),
  }));
}

/**
 * Safe reviver for JSON.parse that detects and blocks prototype pollution attempts
 * by rejecting __proto__, constructor, and prototype property keys.
 *
 * @param key - Object property key being parsed.
 * @param value - Property value.
 * @returns The parsed value if safe.
 * @throws Error if prototype pollution attempt is detected.
 */
export function safeJsonReviver(key: string, value: unknown): unknown {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    throw new Error(`Prototype pollution attempt detected: ${key}`);
  }
  return value;
}

/**
 * Parses JSON safely with prototype pollution defense.
 *
 * @param text - The JSON string to parse.
 * @returns The parsed object.
 */
export function safeJsonParse(text: string): unknown {
  return JSON.parse(text, safeJsonReviver);
}
