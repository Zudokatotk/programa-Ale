// questions.js expone: window.QUESTION_BANK = [ {unit, type:"single|multi", q, options, answer:[idx...], explain} ]

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

// 1) Tomar banco real
const BANK = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];
console.log("Preguntas cargadas:", BANK.length);

// 2) Filtrar por unidad
let pool = BANK.filter(q => {
  if (UNIT === "all") return true;
  return String(q.unit) === String(UNIT);
});

unitTagEl.textContent = UNIT === "all" ? "Unidades 1–9" : `Unidad ${UNIT}`;

// Barajar preguntas
if (SHUFFLE_Q) pool = shuffle(pool);

// Si piden más de las que hay, usar las disponibles
const selected = pool.slice(0, Math.min(COUNT, pool.length));

let idx = 0;
let correct = 0;
let wrong = [];
let answered = false;

if (selected.length === 0) {
  // Mensaje útil si quedó vacío
  qTitle.textContent = "No hay preguntas para esa selección 😵‍💫";
  progressEl.textContent = "Pregunta 0 / 0";
  optionsEl.innerHTML = `<div class="tip">Revisa que <code>questions.js</code> no tenga errores y que las preguntas tengan <b>unit</b> correcto (1..9).</div>`;
  nextBtn.classList.add("hidden");
  finishBtn.classList.add("hidden");
} else {
  render();
}

function render(){
  const q = selected[idx];
  progressEl.textContent = `Pregunta ${idx+1} / ${selected.length}`;

  // Tu banco usa q en vez de question
  qTitle.textContent = q.q;

  feedbackEl.classList.add("hidden");
  feedbackEl.textContent = "";
  answered = false;

  // Construir opciones (y barajarlas si toca)
  let opts = q.options.map((text, i) => ({ text, i }));
  if (SHUFFLE_A) opts = shuffle(opts);

  // single => radio | multi => checkbox
  const inputType = (q.type === "multi") ? "checkbox" : "radio";

  optionsEl.innerHTML = opts.map((o) => `
    <label class="opt">
      <input type="${inputType}" name="opt" value="${o.i}">
      <div>${o.text}</div>
    </label>
  `).join("");

  nextBtn.classList.remove("hidden");
  finishBtn.classList.toggle("hidden", idx !== selected.length - 1);
}

nextBtn.addEventListener("click", () => submitAndNext(false));
finishBtn.addEventListener("click", () => submitAndNext(true));

function getSelectedIndexes(q){
  if (q.type === "multi") {
    return Array.from(document.querySelectorAll('input[name="opt"]:checked')).map(x => Number(x.value));
  } else {
    const chosen = document.querySelector('input[name="opt"]:checked');
    return chosen ? [Number(chosen.value)] : [];
  }
}

function sameSet(a, b){
  const A = [...a].sort().join(",");
  const B = [...b].sort().join(",");
  return A === B;
}

function submitAndNext(isFinish){
  const q = selected[idx];
  const chosenIdxs = getSelectedIndexes(q);

  if (chosenIdxs.length === 0) return alert("Elige una opción");

  // q.answer en tu banco es arreglo (ej: [0]) incluso para single
  const ok = sameSet(chosenIdxs, q.answer);

  if (ok) correct++;
  else {
    const userText = chosenIdxs.map(i => q.options[i]).join(", ");
    const correctText = q.answer.map(i => q.options[i]).join(", ");

    wrong.push({
      unit: q.unit,
      question: q.q,
      user: userText,
      correct: correctText,
      explanation: q.explain || ""
    });
  }

  // modo práctica: feedback al instante
  if (MODE === "practice" && !answered) {
    answered = true;
    feedbackEl.classList.remove("hidden");
    feedbackEl.innerHTML = ok
      ? `<span class="good">Correcto ✅</span>`
      : `<span class="bad">Incorrecto ❌</span><br>
         Correcta: <span class="good">${q.answer.map(i => q.options[i]).join(", ")}</span>
         ${q.explain ? `<br><i>${q.explain}</i>` : ""}`;
    return; // en práctica, primero ve el feedback, luego presiona otra vez
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
