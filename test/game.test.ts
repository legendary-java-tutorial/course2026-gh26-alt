// Тесты курса: npm test проверяет игру без партии — тексты в docs/game.json и логику ответов.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseGame, hint, parseGuess, secretFor } from "../src/game.ts";

test("тексты игры: docs/game.json правильный, режимы названы в приветствии", () => {
  const game = parseGame(readFileSync(new URL("../docs/game.json", import.meta.url), "utf8"));
  const names = Object.keys(game.modes);
  if (names.length > 1) {
    for (const name of names) assert.ok(game.greeting.includes(name), `в приветствии нет режима "${name}"`);
  }
});

test("логика игры: ответы на догадку и загаданное число", () => {
  const mode = { min: 1, max: 10, higher: "выше", lower: "ниже", win: "да" };
  assert.equal(hint(mode, 5, 3), "выше");
  assert.equal(hint(mode, 5, 8), "ниже");
  assert.equal(hint(mode, 5, 5), "да");
  assert.equal(secretFor(mode, () => 0), 1);
  assert.equal(secretFor(mode, () => 0.9999), 10);
  assert.equal(parseGuess(" 7 "), 7);
  assert.equal(parseGuess(""), null);
  assert.equal(parseGuess("2.5"), null);
});
