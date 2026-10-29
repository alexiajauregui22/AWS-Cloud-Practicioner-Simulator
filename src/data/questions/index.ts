import type { DomainId, Question } from "@/lib/types";
import { BILLING_QUESTIONS } from "./billing";
import { CONCEPTS_QUESTIONS } from "./concepts";
import { SECURITY_QUESTIONS } from "./security";
import { TECHNOLOGY_QUESTIONS } from "./technology";

export const QUESTIONS: Question[] = [
  ...CONCEPTS_QUESTIONS,
  ...SECURITY_QUESTIONS,
  ...TECHNOLOGY_QUESTIONS,
  ...BILLING_QUESTIONS,
];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q])
);

export const questionsByDomain = (d: DomainId) => QUESTIONS.filter((q) => q.domain === d);
