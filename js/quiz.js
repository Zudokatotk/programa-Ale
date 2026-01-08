// Acepta:
// 1) window.QUESTIONS = [{ unit, question, options, answer, explanation, type }]
// 2) window.QUESTION_BANK = [{ unit, q, options, answer: [..], explain, type }]
// Soporta: single (radio) y multi (checkbox)

const settings = JSON.parse(localStorage.getItem("bioQuizSettings") || "{}");
const MODE = settings.mode || "exam";
const COUNT = settings.count || 20;
const UNIT = settings.unit || "all";
const SHUFFLE_Q = (settings.shuffleQ || "yes") === "yes";
const SHUFFLE_A = (settings.shuffleA || "yes") === "yes";

const qTitle = document.getElementById("qTitle");
const optionsEl = document.getElementById("options");
const progressEl = document.getElementById("progress");
const unitTagEl = document.getElementById("unitTag");
const nextBtn = document.getElementById("next");
const finishBtn = document.getElementById("finish");
const feedbackEl = document.getElementById("feedback");

const quizCard = document.getElementById("quizCard");
const resultCard = document.getElementById("resultCard");
const scoreEl = document.getElementById("score");
const errorsEl = document.getElementById("errors");

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Normaliza preguntas vengan de QUESTIONS o QUESTION_BANK
function normalizeQuestion(raw) {
  const questionText = raw.question ?? raw.q ?? "";
  const explanationText = raw.explanation ?? raw.explain ?? "";
  const options = Array.isArray(raw.options) ? raw.options : [];

  // answer puede ser number o array
  const ansArr = Array.isArray(raw.answer) ? raw.answer.map(Number) : [Number(raw.answer)];
  const type =
    raw.type ||
    (ansArr.length > 1 ? "multi" : "single"); // si hay varias respuestas => multi

  return {
    unit: raw.unit,
    type,
    question: questionText,
    options,
    answers: ansArr, // SIEMPRE array
    explanation: explanationText,
  };
}

const RAW_BANK = window.QUESTIONS || window.QUESTION_BANK || [];
let pool = RAW_BANK.map(normalizeQuestion).filter((q) => {
  if (UNIT === "all") return true;
  return String(q.unit) === String(UNIT);
});

unitTagEl.textContent = UNIT === "all" ? "Unidades 1–9" : `Unidad ${UNIT}`;

if (SHUFFLE_Q) pool = shuffle(pool);

// si piden más de las que hay, usamos las que existan
const selected = pool.slice(0, Math.min(COUNT, pool.length));

let idx = 0;
let correct = 0;
let wrong = [];
let answered = false;

render();

function render() {
  const q = selected[idx];

  // Si no hay preguntas, muestra un aviso claro
  if (!q) {
    qTitle.textContent = "No hay preguntas para mostrar 😵‍💫";
    progressEl.textContent = "Pregunta 0 / 0";
    optionsEl.innerHTML = `
      <div class="tip">
        Revisa que <code>questions.js</code> esté cargando y que tenga preguntas con <b>unit</b> correcto.
        <br/>Tip: abre la consola y mira <code>window.QUESTIONS</code> o <code>window.QUESTION_BANK</code>.
      </div>
    `;
    nextBtn.classList.add("hidden");
    finishBtn.classList.add("hidden");
    return;
  }

  progressEl.textContent = `Pregunta ${idx + 1} / ${selected.length}`;
  qTitle.textContent = q.question;

  feedbackEl.classList.add("hidden");
  feedbackEl.textContent = "";
  answered = false;

  // construir opciones (y barajarlas si toca)
  let opts = q.options.map((text, i) => ({ text, i }));
  if (SHUFFLE_A) opts = shuffle(opts);

  const inputType = q.type === "multi" ? "checkbox" : "radio";
  const nameAttr = "opt";

  optionsEl.innerHTML = opts
    .map(
      (o) => `
    <label class="opt">
      <input type="${inputType}" name="${nameAttr}" value="${o.i}">
      <div>${o.text}</div>
    </label>
  `
    )
    .join("");

  nextBtn.classList.remove("hidden");
  finishBtn.classList.toggle("hidden", idx !== selected.length - 1);
}

nextBtn.addEventListener("click", () => submitAndNext(false));
finishBtn.addEventListener("click", () => submitAndNext(true));

function arraysEqualAsSets(a, b) {
  const A = [...new Set(a)].sort((x, y) => x - y);
  const B = [...new Set(b)].sort((x, y) => x - y);
  if (A.length !== B.length) return false;
  return A.every((v, i) => v === B[i]);
}

function submitAndNext(isFinish) {
  const q = selected[idx];
  if (!q) return;

  const chosenEls = [...document.querySelectorAll('input[name="opt"]:checked')];
  if (chosenEls.length === 0) return alert("Elige una opción");

  const chosen = chosenEls.map((el) => Number(el.value));
  const ok = arraysEqualAsSets(chosen, q.answers);

  if (ok) correct++;
  else {
    wrong.push({
      unit: q.unit,
      question: q.question,
      user: chosen.map((i) => q.options[i]).join(", "),
      correct: q.answers.map((i) => q.options[i]).join(", "),
      explanation: q.explanation || "",
    });
  }

  // modo práctica: feedback al instante (una vez)
  if (MODE === "practice" && !answered) {
    answered = true;
    feedbackEl.classList.remove("hidden");
    feedbackEl.innerHTML = ok
      ? `<span class="good">Correcto ✅</span>`
      : `<span class="bad">Incorrecto ❌</span><br>
         Correcta: <span class="good">${q.answers.map((i) => q.options[i]).join(", ")}</span>
         ${q.explanation ? `<br><i>${q.explanation}</i>` : ""}`;
    return;
  }

  if (idx < selected.length - 1 && !isFinish) {
    idx++;
    render();
  } else {
    showResults();
  }
}

function showResults() {
  quizCard.classList.add("hidden");
  resultCard.classList.remove("hidden");

  const finalScore = selected.length ? Math.round((correct / selected.length) * 100) : 0;
  scoreEl.innerHTML = `Tu puntaje es: <b>${finalScore} / 100</b> (${correct} correctas de ${selected.length})`;

  errorsEl.innerHTML = wrong.length
    ? wrong
        .map(
          (e, i) => `
      <div class="error-card">
        <b>#${i + 1} | Unidad ${e.unit}</b><br>
        <b>${e.question}</b><br>
        Tu respuesta: <span class="bad">${e.user}</span><br>
        Correcta: <span class="good">${e.correct}</span><br>
        ${e.explanation ? `<div style="margin-top:6px;color:#cbd5e1"><i>${e.explanation}</i></div>` : ""}
      </div>
    `
        )
        .join("")
    : `<div class="error-card"><span class="good">¡Perfecto! No tuviste errores ✅</span></div>`;
}
