// questions.js debe exponer: window.QUESTIONS = [ {unit: 1..9, question, options, answer, explanation} ]

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

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

let pool = (window.QUESTIONS || []).filter(q => {
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

function render(){
  const q = selected[idx];
  progressEl.textContent = `Pregunta ${idx+1} / ${selected.length}`;

  qTitle.textContent = q.question;
  feedbackEl.classList.add("hidden");
  feedbackEl.textContent = "";
  answered = false;

  // construir opciones (y barajarlas si toca)
  let opts = q.options.map((text, i) => ({ text, i }));
  if (SHUFFLE_A) opts = shuffle(opts);

  optionsEl.innerHTML = opts.map((o, k) => `
    <label class="opt">
      <input type="radio" name="opt" value="${o.i}">
      <div>${o.text}</div>
    </label>
  `).join("");

  nextBtn.classList.remove("hidden");
  finishBtn.classList.toggle("hidden", idx !== selected.length - 1);
}

nextBtn.addEventListener("click", () => submitAndNext(false));
finishBtn.addEventListener("click", () => submitAndNext(true));

function submitAndNext(isFinish){
  const chosen = document.querySelector('input[name="opt"]:checked');
  if (!chosen) return alert("Elige una opción");

  const q = selected[idx];
  const ans = Number(chosen.value);

  const ok = ans === q.answer;
  if (ok) correct++;
  else {
    wrong.push({
      unit: q.unit,
      question: q.question,
      user: q.options[ans],
      correct: q.options[q.answer],
      explanation: q.explanation || ""
    });
  }

  // modo práctica: feedback al instante
  if (MODE === "practice" && !answered) {
    answered = true;
    feedbackEl.classList.remove("hidden");
    feedbackEl.innerHTML = ok
      ? `<span class="good">Correcto ✅</span>`
      : `<span class="bad">Incorrecto ❌</span><br>
         Correcta: <span class="good">${q.options[q.answer]}</span>
         ${q.explanation ? `<br><i>${q.explanation}</i>` : ""}`;
    return; // en práctica, primero ve el feedback, luego vuelve a presionar
  }

  if (idx < selected.length - 1 && !isFinish) {
    idx++;
    render();
  } else {
    showResults();
  }
}

function showResults(){
  quizCard.classList.add("hidden");
  resultCard.classList.remove("hidden");

  const finalScore = Math.round((correct / selected.length) * 100);
  scoreEl.innerHTML = `Tu puntaje es: <b>${finalScore} / 100</b> (${correct} correctas de ${selected.length})`;

  errorsEl.innerHTML = wrong.length
    ? wrong.map((e, i) => `
      <div class="error-card">
        <b>#${i+1} | Unidad ${e.unit}</b><br>
        <b>${e.question}</b><br>
        Tu respuesta: <span class="bad">${e.user}</span><br>
        Correcta: <span class="good">${e.correct}</span><br>
        ${e.explanation ? `<div style="margin-top:6px;color:#cbd5e1"><i>${e.explanation}</i></div>` : ""}
      </div>
    `).join("")
    : `<div class="error-card"><span class="good">¡Perfecto! No tuviste errores ✅</span></div>`;
}
