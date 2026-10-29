import { useSyncExternalStore } from "react";
import { dayKey } from "@/lib/dates";
import type { DomainId, Lang, Level } from "@/lib/types";

export interface Attempt {
  qid: string;
  domain: DomainId;
  level: Level;
  correct: boolean;
  at: number;
  mode: "practice" | "exam";
}

export interface ExamAnswer {
  qid: string;
  chosen: number[];
  correct: boolean;
}

export interface ExamResult {
  id: string;
  at: number;
  kind: "full" | "mini";
  score: number;
  correct: number;
  total: number;
  durationSec: number;
  byDomain: Record<DomainId, { c: number; t: number }>;
  answers: ExamAnswer[];
}

export interface AppState {
  version: 1;
  lang: Lang;
  name: string;
  examDate: string;
  dailyGoal: number;
  xp: number;
  attempts: Attempt[];
  exams: ExamResult[];
  /** tarjetas marcadas como dominadas */
  cardsKnown: Record<string, number>;
  lessonsDone: Record<string, number>;
  /** acciones de estudio por día (YYYY-MM-DD) */
  activity: Record<string, number>;
}

const KEY = "cloudcoach.v1";

const DEFAULT: AppState = {
  version: 1,
  lang: "es",
  name: "",
  examDate: "2026-12-20",
  dailyGoal: 20,
  xp: 0,
  attempts: [],
  exams: [],
  cardsKnown: {},
  lessonsDone: {},
  activity: {},
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento lleno o bloqueado: la sesión sigue en memoria */
  }
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(state);
  save();
  for (const l of listeners) l();
}

export function getState() {
  return state;
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Estado completo. Deriva valores con useMemo en cada vista. */
export function useStore(): AppState {
  return useSyncExternalStore(subscribe, getState);
}

const bump = (activity: Record<string, number>, n = 1) => {
  const k = dayKey();
  return { ...activity, [k]: (activity[k] ?? 0) + n };
};

const XP_BY_LEVEL: Record<Level, number> = { easy: 10, medium: 15, hard: 20 };

/* Acciones */

export const actions = {
  setLang: (lang: Lang) => setState((s) => ({ ...s, lang })),
  setName: (name: string) => setState((s) => ({ ...s, name })),
  setExamDate: (examDate: string) => setState((s) => ({ ...s, examDate })),
  setDailyGoal: (dailyGoal: number) => setState((s) => ({ ...s, dailyGoal })),

  recordAnswer(a: Omit<Attempt, "at">) {
    setState((s) => ({
      ...s,
      xp: s.xp + (a.correct ? XP_BY_LEVEL[a.level] : 2),
      attempts: [...s.attempts, { ...a, at: Date.now() }].slice(-6000),
      activity: bump(s.activity),
    }));
  },

  markCard(id: string, known: boolean) {
    setState((s) => {
      const cardsKnown = { ...s.cardsKnown };
      if (known) cardsKnown[id] = Date.now();
      else delete cardsKnown[id];
      return { ...s, cardsKnown, xp: s.xp + 2, activity: bump(s.activity) };
    });
  },

  completeLesson(id: string) {
    setState((s) =>
      s.lessonsDone[id]
        ? s
        : {
            ...s,
            lessonsDone: { ...s.lessonsDone, [id]: Date.now() },
            xp: s.xp + 15,
            activity: bump(s.activity, 2),
          }
    );
  },

  saveExam(r: ExamResult, attempts: Omit<Attempt, "at">[]) {
    setState((s) => ({
      ...s,
      xp: s.xp + 50 + r.correct * 5,
      exams: [...s.exams, r],
      attempts: [...s.attempts, ...attempts.map((a) => ({ ...a, at: r.at }))].slice(-6000),
      activity: bump(s.activity, attempts.length),
    }));
  },

  reset() {
    setState(() => DEFAULT);
  },

  importState(json: string) {
    const parsed = JSON.parse(json) as AppState;
    if (parsed.version !== 1) throw new Error("bad version");
    setState(() => ({ ...DEFAULT, ...parsed }));
  },
};
