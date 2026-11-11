// Игра в терминале: npm start собирает её в docs/ и запускает отсюда.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { parseGame, hint, temperatureHint, parseGuess, secretFor } from "./game.js";
let game;
try {
    game = parseGame(readFileSync(new URL("./game.json", import.meta.url), "utf8"));
}
catch (e) {
    console.error(`Ошибка: ${e.message}`);
    process.exit(1);
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
let replay = true;
while (replay) {
    const secret = secretFor(mode);
    let previousGuess;
    const guesses = new Set();
    for (let tries = 1;;) {
        const guess = parseGuess(await rl.question("Ваша догадка: "));
        if (guess === null || guess < mode.min || guess > mode.max) {
            console.log(`Нужно целое число от ${mode.min} до ${mode.max}.`);
            continue;
        }
        if (guess === secret) {
            console.log(game.attempts.replace("{count}", String(tries)));
            break;
        }
        if (guesses.has(guess))
            console.log(game.repeatedGuess);
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
