// Игра в браузере: та же сборка в docs/ и тот же docs/game.json; страница — docs/index.html (GitHub Pages).
import { parseGame, hint, parseGuess, secretFor, type Game, type Mode } from "./game.js";

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

function start(name: string) {
  mode = game.modes[name];
  secret = secretFor(mode);
  tries = 0;
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
  if (guess === null) {
    $("answer").textContent = `Нужно целое число от ${mode.min} до ${mode.max}.`;
    return;
  }
  tries++;
  if (guess === secret) {
    $("answer").textContent = `${hint(mode, secret, guess)} Попыток: ${tries}. Выберите режим, чтобы сыграть ещё.`;
    input.disabled = true;
    return;
  }
  $("answer").textContent = hint(mode, secret, guess);
  input.focus();
};
