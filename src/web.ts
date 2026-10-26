// Игра в браузере: та же сборка в docs/ и тот же docs/game.json; страница — docs/index.html (GitHub Pages).
import { parseGame, hint, temperatureHint, parseGuess, secretFor, type Game, type Mode } from "./game.js";

const $ = (id: string) => document.getElementById(id)!;
const input = $("guess") as HTMLInputElement;
let game: Game;
try {
  game = parseGame(await (await fetch("./game.json")).text());
} catch (e) {
  $("answer").textContent = `Ошибка: ${(e as Error).message}`;
  throw e;
}
$("greeting").textContent = game.greeting;
$("theme").textContent = `тема: ${game.theme}`;
$("choose").hidden = false;

let mode: Mode;
let secret = 0;
let tries = 0;
let previousGuess: number | undefined;
let guesses = new Set<number>();

function start(name: string) {
  mode = game.modes[name];
  secret = secretFor(mode);
  tries = 0;
  previousGuess = undefined;
  guesses = new Set<number>();
  $("range").textContent = `Режим ${name}: число от ${mode.min} до ${mode.max}.`;
  $("answer").textContent = "";
  $("play").hidden = false;
  input.disabled = false;
  input.value = "";
  input.focus();
}

for (const name of Object.keys(game.modes)) {
  const b = document.createElement("button");
  b.textContent = name;
  b.onclick = () => start(name);
  $("modes").append(b);
}

$("play").onsubmit = (e) => {
  e.preventDefault();
  const guess = parseGuess(input.value);
  input.value = "";
  if (guess === null || guess < mode.min || guess > mode.max) {
    $("answer").textContent = `Нужно целое число от ${mode.min} до ${mode.max}.`;
    return;
  }
  tries++;
  if (guess === secret) {
    $("answer").textContent = `${game.attempts.replace("{count}", String(tries))} Выберите режим, чтобы сыграть ещё.`;
    input.disabled = true;
    return;
  }
  const repeatedHint = guesses.has(guess) ? `${game.repeatedGuess} ` : "";
  $("answer").textContent = `${repeatedHint}${hint(mode, secret, guess)} ${temperatureHint(game, secret, guess, previousGuess)}`;
  guesses.add(guess);
  previousGuess = guess;
  input.focus();
};
