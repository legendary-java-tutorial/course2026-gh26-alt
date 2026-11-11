// Логика игры «Угадай число»: тексты и режимы — из docs/game.json, код их не хранит.

export type Mode = { min: number; max: number; higher: string; lower: string; win: string };
export type GameRecord = { mode: string; attempts: number; date: string };
export type GameStats = { games: number; totalAttempts: number; bestAttempts: number | null };
export type Game = {
  theme: string;
  greeting: string;
  attempts: string;
  hot: string;
  warm: string;
  cool: string;
  freezing: string;
  repeatedGuess: string;
  replayPrompt: string;
  replayYes: string;
  replayNo: string;
  replayEnd: string;
  recordsTitle: string;
  recordsEmpty: string;
  recordLine: string;
  statsLine: string;
  cli: {
    title: string;
    themeLine: string;
    modePrompt: string;
    modeLine: string;
    guessPrompt: string;
    invalidGuess: string;
    hintLine: string;
    temperatureLine: string;
    replayLine: string;
    saveError: string;
    statsSaveError: string;
    exitMessage: string;
  };
  modes: Record<string, Mode>;
};

// Текст docs/game.json → игра; ошибка — понятная, по-русски, с названием файла.
export function parseGame(text: string): Game {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("docs/game.json не читается: проверьте запятые между строками, кавычки и скобки");
  }
  return checkGame(data);
}

export function checkGame(data: unknown): Game {
  const g = data as Game;
  if (!g || typeof g !== "object") throw new Error("docs/game.json: ожидается объект в фигурных скобках");
  for (const key of ["theme", "greeting", "attempts", "hot", "warm", "cool", "freezing", "repeatedGuess", "replayPrompt", "replayYes", "replayNo", "replayEnd", "recordsTitle", "recordsEmpty", "recordLine", "statsLine"] as const) {
    if (typeof g[key] !== "string" || g[key].trim() === "") throw new Error(`docs/game.json: пустое или пропущенное поле "${key}"`);
  }
  if (!g.cli || typeof g.cli !== "object") throw new Error('docs/game.json: нет настроек интерфейса в "cli"');
  for (const [key, value] of Object.entries(g.cli)) {
    if (typeof value !== "string" || value.trim() === "") throw new Error(`docs/game.json: пустое или пропущенное поле "cli.${key}"`);
  }
  if (!g.modes || typeof g.modes !== "object" || Object.keys(g.modes).length === 0) {
    throw new Error('docs/game.json: нет ни одного режима в "modes"');
  }
  for (const [name, m] of Object.entries(g.modes)) {
    if (!m || typeof m !== "object") throw new Error(`docs/game.json: режим "${name}" должен быть в фигурных скобках`);
    if (!Number.isInteger(m.min) || !Number.isInteger(m.max) || m.min >= m.max) {
      throw new Error(`docs/game.json: в режиме "${name}" min и max — целые числа, min меньше max`);
    }
    for (const key of ["higher", "lower", "win"] as const) {
      if (typeof m[key] !== "string" || m[key].trim() === "") {
        throw new Error(`docs/game.json: в режиме "${name}" пустое или пропущенное сообщение "${key}"`);
      }
    }
  }
  return g;
}

function isGameRecord(item: unknown): item is GameRecord {
  if (!item || typeof item !== "object") return false;
  const record = item as Record<string, unknown>;
  return typeof record.mode === "string" && record.mode !== "" &&
    typeof record.attempts === "number" && Number.isInteger(record.attempts) && record.attempts > 0 &&
    typeof record.date === "string" && Number.isFinite(Date.parse(record.date));
}

// Сохраняет корректные результаты и оставляет топ-5 для каждого режима.
export function parseRecords(text: string): GameRecord[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const records = data.filter(isGameRecord);
  return topRecords(records);
}

export function addRecord(records: GameRecord[], mode: string, attempts: number, date = new Date().toISOString()): GameRecord[] {
  if (!mode || !Number.isInteger(attempts) || attempts < 1 || !Number.isFinite(Date.parse(date))) return topRecords(records);
  return topRecords([...records, { mode, attempts, date }]);
}

export function topRecords(records: GameRecord[], mode?: string): GameRecord[] {
  const sorted = records
    .filter((record) => !mode || record.mode === mode)
    .slice()
    .sort((a, b) => a.attempts - b.attempts || Date.parse(a.date) - Date.parse(b.date) || a.mode.localeCompare(b.mode));
  if (mode) return sorted.slice(0, 5);
  const counts = new Map<string, number>();
  return sorted.filter((record) => {
    const count = counts.get(record.mode) ?? 0;
    if (count >= 5) return false;
    counts.set(record.mode, count + 1);
    return true;
  });
}

export function parseStats(text: string): GameStats {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { games: 0, totalAttempts: 0, bestAttempts: null };
  }
  if (!data || typeof data !== "object") return { games: 0, totalAttempts: 0, bestAttempts: null };
  const stats = data as Record<string, unknown>;
  if (!Number.isInteger(stats.games) || (stats.games as number) < 0 ||
      !Number.isInteger(stats.totalAttempts) || (stats.totalAttempts as number) < 0 ||
      !(stats.bestAttempts === null || (Number.isInteger(stats.bestAttempts) && (stats.bestAttempts as number) > 0))) {
    return { games: 0, totalAttempts: 0, bestAttempts: null };
  }
  if (stats.games === 0 ? stats.totalAttempts !== 0 || stats.bestAttempts !== null :
      (stats.totalAttempts as number) < (stats.games as number) || stats.bestAttempts === null) {
    return { games: 0, totalAttempts: 0, bestAttempts: null };
  }
  return { games: stats.games as number, totalAttempts: stats.totalAttempts as number, bestAttempts: stats.bestAttempts as number | null };
}

export function addStats(stats: GameStats, attempts: number): GameStats {
  if (!Number.isInteger(attempts) || attempts < 1) return stats;
  return {
    games: stats.games + 1,
    totalAttempts: stats.totalAttempts + attempts,
    bestAttempts: stats.bestAttempts === null ? attempts : Math.min(stats.bestAttempts, attempts),
  };
}

// Ответ на догадку: больше, меньше или угадал.
export function hint(mode: Mode, secret: number, guess: number): string {
  if (guess < secret) return mode.higher;
  if (guess > secret) return mode.lower;
  return mode.win;
}

// Оценка близости догадки к загаданному числу относительно диапазона режима.
export function temperatureHint(game: Game, mode: Mode, secret: number, guess: number): string {
  const distance = Math.abs(secret - guess);
  const range = mode.max - mode.min;
  if (distance <= range * 0.15) return game.hot;
  if (distance <= range * 0.3) return game.warm;
  if (distance <= range * 0.6) return game.cool;
  return game.freezing;
}

// Загаданное число режима: целое от min до max включительно.
export function secretFor(mode: Mode, random: () => number = Math.random): number {
  return Math.min(mode.max, mode.min + Math.floor(random() * (mode.max - mode.min + 1)));
}

// Догадка из строки ввода: целое число или null.
export function parseGuess(text: string): number | null {
  const t = text.trim();
  if (!/^-?\d+$/.test(t)) return null;
  return Number(t);
}
