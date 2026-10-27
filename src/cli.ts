// Игра в терминале: npm start собирает её в docs/ и запускает отсюда.
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { parseGame, hint, temperatureHint, parseGuess, secretFor, addRecord, parseRecords, topRecords, type Game, type GameRecord } from "./game.js";

let game: Game;
try {
  game = parseGame(readFileSync(new URL("./game.json", import.meta.url), "utf8"));
} catch (e) {
  console.error(`Ошибка: ${(e as Error).message}`);
  process.exit(1);
}

const recordsFile = new URL("./records.json", import.meta.url);
let records: GameRecord[];
try {
  records = parseRecords(readFileSync(recordsFile, "utf8"));
} catch {
  records = [];
}

function saveRecords() {
  try {
    writeFileSync(recordsFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  } catch {
    console.error("Не удалось сохранить файл docs/records.json.");
  }
}

function printRecords(modeName: string) {
  console.log(game.recordsTitle.replace("{mode}", modeName));
  const best = topRecords(records, modeName);
  if (best.length === 0) {
    console.log(game.recordsEmpty);
    return;
  }
  best.forEach((record, index) => {
    console.log(game.recordLine
      .replace("{position}", String(index + 1))
      .replace("{attempts}", String(record.attempts))
      .replace("{date}", new Date(record.date).toLocaleString("ru-RU")));
  });
}

const rl = createInterface({ input: stdin, output: stdout });
rl.on("close", () => {
  console.log("\nДо встречи!");
  process.exit(0);
});

const names = Object.keys(game.modes);
console.log(`${game.greeting} (тема: ${game.theme})`);
let name = names[0];
if (names.length > 1) {
  const answer = (await rl.question(`Какой режим (${names.join(" / ")})? `)).trim();
  name = names.includes(answer) ? answer : names[0];
}
const mode = game.modes[name];
console.log(`Режим ${name}: число от ${mode.min} до ${mode.max}.`);
printRecords(name);

let replay = true;
while (replay) {
  const secret = secretFor(mode);
  let previousGuess: number | undefined;
  const guesses = new Set<number>();
  for (let tries = 1; ; ) {
    const guess = parseGuess(await rl.question("Ваша догадка: "));
    if (guess === null || guess < mode.min || guess > mode.max) {
      console.log(`Нужно целое число от ${mode.min} до ${mode.max}.`);
      continue;
    }
    if (guess === secret) {
      console.log(game.attempts.replace("{count}", String(tries)));
      records = addRecord(records, name, tries);
      saveRecords();
      printRecords(name);
      break;
    }
    if (guesses.has(guess)) console.log(game.repeatedGuess);
    console.log(hint(mode, secret, guess));
    console.log(temperatureHint(game, secret, guess, previousGuess));
    guesses.add(guess);
    previousGuess = guess;
    tries++;
  }
  replay = (await rl.question(`${game.replayPrompt} (${game.replayYes}/${game.replayNo}) `)).trim().toLocaleLowerCase() === game.replayYes.toLocaleLowerCase();
}
console.log(game.replayEnd);
rl.removeAllListeners("close");
rl.close();
