// Логика игры «Угадай число»: тексты и режимы — из docs/game.json, код их не хранит.

export type Mode = { min: number; max: number; higher: string; lower: string; win: string };
export type Game = { theme: string; greeting: string; modes: Record<string, Mode> };

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
  for (const key of ["theme", "greeting"] as const) {
    if (typeof g[key] !== "string" || g[key].trim() === "") throw new Error(`docs/game.json: пустое или пропущенное поле "${key}"`);
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

// Ответ на догадку: больше, меньше или угадал.
export function hint(mode: Mode, secret: number, guess: number): string {
  if (guess < secret) return mode.higher;
  if (guess > secret) return mode.lower;
  return mode.win;
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
