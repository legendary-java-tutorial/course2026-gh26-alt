// Тесты курса: npm test проверяет игру без партии — тексты в docs/game.json и логику ответов.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseGame, hint, temperatureHint, parseGuess, secretFor } from "../src/game.ts";

test("тексты игры: docs/game.json правильный, режимы названы в приветствии", () => {
  const game = parseGame(readFileSync(new URL("../docs/game.json", import.meta.url), "utf8"));
  const names = Object.keys(game.modes);
  assert.equal(game.attempts.replace("{count}", "7"), "Угадал за 7 попыток!");
  assert.deepEqual(game.modes["лёгкий"] && [game.modes["лёгкий"].min, game.modes["лёгкий"].max], [1, 50]);
  assert.deepEqual(game.modes["трудный"] && [game.modes["трудный"].min, game.modes["трудный"].max], [1, 500]);
  if (names.length > 1) {
    for (const name of names) assert.ok(game.greeting.includes(name), `в приветствии нет режима "${name}"`);
  }
});

test("подсказка: теплее, холоднее и первая попытка", () => {
  const game = parseGame(readFileSync(new URL("../docs/game.json", import.meta.url), "utf8"));
  assert.equal(temperatureHint(game, 5, 8), game.firstGuess);
  assert.equal(temperatureHint(game, 5, 6, 8), game.warmer);
  assert.equal(temperatureHint(game, 5, 9, 8), game.colder);
  assert.equal(temperatureHint(game, 5, 2, 8), game.sameDistance);
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
