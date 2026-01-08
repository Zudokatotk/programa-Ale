function calcularResultado() {

  // Respuestas correctas (hecho: definidas explícitamente)
  const respuestasCorrectas = {
    q1: ["a", "c"],
    q2: ["b"]
  };

  let puntaje = 0;
  let totalPreguntas = Object.keys(respuestasCorrectas).length;
  let detalle = "";

  for (let pregunta in respuestasCorrectas) {

    const seleccionadas = Array.from(
      document.querySelectorAll(`input[name="${pregunta}"]:checked`)
    ).map(el => el.value);

    const correctas = respuestasCorrectas[pregunta];

    const esCorrecta =
      seleccionadas.length === correctas.length &&
      seleccionadas.every(val => correctas.includes(val));

    if (esCorrecta) {
      puntaje += 100 / totalPreguntas;
      detalle += `<p>✅ ${pregunta}: correcta</p>`;
    } else {
      detalle += `<p>❌ ${pregunta}: incorrecta</p>`;
    }
  }

  const resultadoFinal = `
    <h2>Resultado</h2>
    <p>Puntaje: ${puntaje.toFixed(0)} / 100</p>
    ${detalle}
  `;

  document.getElementById("resultado").innerHTML = resultadoFinal;
}
