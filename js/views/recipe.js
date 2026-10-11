//////////////////////////////////////////////////////////////
/////////View della ricetta/////////
//////////////////////////////////////////////////////////////

let _recipeMealName = ""; // nome della ricetta visualizzata
let _recipeCategory = ""; // categoria
let _recipeArea = "";     // cucina di origine
let _recipeThumb = "";    // immagine di copertina

function recipeView(id)
{
  return `
    <button class="btn-back" onclick="history.back()">&#8592; Indietro</button>
    <div id="recipe-container">
      <div class="text-center py-5">
        <div class="spinner-border" role="status"></div>
      </div>
    </div>`;
}

async function recipeInit(id)
{
  const meal = await getMealById(id);
  const container = document.getElementById("recipe-container");

  if (!container || !meal)
  {
    if (container) container.innerHTML = `<div class="alert alert-danger">Ricetta non trovata.</div>`;
    return;
  }

  _recipeMealName = meal.strMeal;
  _recipeCategory = meal.strCategory || "";
  _recipeArea = meal.strArea || "";
  _recipeThumb = meal.strMealThumb || "";

  const ingredients = extractIngredients(meal);

  const session = getSession();

    let cookbookEntries = [];
    let reviews = [];
    try {
      const isLogged = (session !== null && session !== undefined);

      reviews = await getReviews(meal.idMeal);
      //scarico le recensioni pubbliche della ricetta

      if (isLogged) {
      //scarico il ricettario solo se l'utente è autenticato per non fare chiamate a vuoto
        cookbookEntries = await getCookbook();
      }
    } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
    }

  const cookbookEntry = cookbookEntries.find(e => e.recipeId === meal.idMeal);
  const inCookbook = !!cookbookEntry;
  //verifico se la ricetta è già tra i preferiti dell'utente

  const userReview = session ? reviews.find(r => r.userId === session.id) : null;
  //verifico se l'utente ha già recensito questa ricetta per nascondere il form

  const _noteValue = (session && cookbookEntry) ? (cookbookEntry.note || "") : "";
  //recupero l'eventuale nota personale salvata per questa ricetta

  //calcolo la media matematica dei voti gusto arrotondata per mostrare le stelle piene/vuote
  let avgTaste = 0;
  if (reviews.length > 0) {
      let somma = 0;
      for (let i = 0; i < reviews.length; i++) {
          somma = somma + reviews[i].taste;
      }
      let media = somma / reviews.length;
      avgTaste = Math.round(media);
  }

  //costruisco i menu a tendina per data di preparazione con cicli for tradizionali
  let dateSelectorsHtml = "";
  if (session && !userReview) {
    const oggi = new Date();
    const giornoCorrente = String(oggi.getDate()).padStart(2, "0");
    const meseCorrente = String(oggi.getMonth() + 1).padStart(2, "0");
    const annoCorrente = oggi.getFullYear();
    const nomiMesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    let optionsGiorni = "";
    for (let d = 1; d <= 31; d++) {
      const val = String(d).padStart(2, "0");
      optionsGiorni += `<option value="${val}"${val === giornoCorrente ? " selected" : ""}>${d}</option>`;
    }

    let optionsMesi = "";
    for (let m = 0; m < nomiMesi.length; m++) {
      const val = String(m + 1).padStart(2, "0");
      optionsMesi += `<option value="${val}"${val === meseCorrente ? " selected" : ""}>${nomiMesi[m]}</option>`;
    }

    let optionsAnni = "";
    for (let y = annoCorrente; y >= annoCorrente - 4; y--) {
      optionsAnni += `<option value="${y}"${y === annoCorrente ? " selected" : ""}>${y}</option>`;
    }

    dateSelectorsHtml = `
      <select id="review-day" class="form-select form-select-sm">${optionsGiorni}</select>
      <select id="review-month" class="form-select form-select-sm">${optionsMesi}</select>
      <select id="review-year" class="form-select form-select-sm">${optionsAnni}</select>`;
  }

  container.innerHTML = `
    <div class="text-center mb-4">
      <h1 class="recipe-title">${meal.strMeal}</h1>
      <p class="text-muted small mb-3">${meal.strCategory}${meal.strArea ? " · " + meal.strArea : ""}</p>

      ${session ? `
        <button class="btn ${inCookbook ? "btn-bookmark btn-bookmark--remove" : "btn-bookmark"} mb-4"
          onclick="toggleCookbook('${meal.idMeal}')">
          <i class="bi ${inCookbook ? "bi-bookmark-x" : "bi-bookmark-plus"}"></i>
          ${inCookbook ? "Rimuovi dal ricettario" : "Aggiungi al ricettario"}
        </button>` : ""}
    </div>

    <div class="row g-4">
      <div class="col-md-4">
        <img src="${meal.strMealThumb}" class="recipe-img" alt="${meal.strMeal}">

        ${avgTaste > 0 ? `
          <div class="mt-2 text-center">
            ${renderStars(avgTaste)}
            <span class="text-muted small ms-1">${reviews.length} recension${reviews.length === 1 ? "e" : "i"}</span>
          </div>` : ""}

        ${session && inCookbook ? `
          <div class="mt-3">
            <label class="form-label">La mia nota privata</label>
            <textarea id="note-input" class="form-control mb-2" rows="3"></textarea>
            <button class="btn btn-outline-secondary btn-sm" onclick="saveNote('${meal.idMeal}')">Salva nota</button>
          </div>` : ""}

        <div class="reviews-box mt-3">
          <h6 class="review-label">Recensioni</h6>
          <div id="reviews-list">
            ${reviews.length === 0
      ? `<p class="text-muted small mb-0">Nessuna recensione ancora.</p>`
      : reviews.map(r =>
      {
        return `
                    <div class="review-row">
                      <div class="d-flex justify-content-between align-items-center">
                        <strong class="small">${escapeHTML(r.username || "Utente")}</strong>
                        <span class="review-date">${escapeHTML(r.date)}</span>
                      </div>
                      <div class="small mt-1">
                        Difficoltà: ${renderStars(r.difficulty)}&nbsp;
                        Gusto: ${renderStars(r.taste)}
                      </div>

                      ${session && r.userId === session.id
            ? `<button class="btn-review-delete mt-1" onclick="handleDeleteReview('${r.id}','${meal.idMeal}')">Elimina</button>`
            : ""}
                    </div>`;
      }).join("")}
          </div>

          ${session && !userReview ? `
            <div class="mt-3 pt-2 border-top">
              <h6 class="review-label">Aggiungi recensione</h6>
              <div class="mb-2">
                <label class="form-label">Data preparazione</label>
                <div class="d-flex gap-2">
                  ${dateSelectorsHtml}
                </div>
              </div>
              <div class="mb-2">
                <label class="form-label">Difficoltà (1–5)</label>
                <input type="number" id="review-difficulty" class="form-control form-control-sm" min="1" max="5">
              </div>
              <div class="mb-3">
                <label class="form-label">Gusto (1–5)</label>
                <input type="number" id="review-taste" class="form-control form-control-sm" min="1" max="5">
              </div>
              <button class="btn btn-primary btn-sm w-100" onclick="submitReview('${meal.idMeal}')">Invia recensione</button>
            </div>` : ""}
        </div>
      </div>

      <div class="col-md-3">
        <div class="ingredients-header">Ingredienti</div>
        <ul class="list-unstyled mb-0">
          ${ingredients.map(i =>
        `<li class="ingredient-row">
                ${i.measure ? `<span class="text-muted">${i.measure}</span> ` : ""}${i.ingredient}
              </li>`
      ).join("")}
        </ul>
      </div>

      <div class="col-md-5">
        <div class="directions-header">Procedimento</div>
        <p class="directions-text">${meal.strInstructions}</p>
      </div>
    </div>`;

  // imposto il testo della nota personale con .value per prevenire XSS
  if (_noteValue)
  {
    const noteEl = document.getElementById("note-input");
    if (noteEl) noteEl.value = _noteValue;
  }
}

/**
 * Converte il formato non strutturato di TheMealDB in un array di oggetti pulito.
 * L'API restituisce 20 proprietà piatte:
 * questo ciclo raggruppa le coppie ingrediente/quantità scartando i campi vuoti.
 * @param {Object} meal - Oggetto ricetta grezzo da TheMealDB
 * @returns {Array<{ingredient: string, measure: string}>} Lista ingredienti formattata
 */
function extractIngredients(meal)
{
  const list = [];
  for (let i = 1; i <= 20; i++)
  {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim())
    {
      list.push({ ingredient: ingredient.trim(), measure: measure ? measure.trim() : "" });
    }
  }
  return list;
}

/**
 * Aggiunge o rimuove la ricetta corrente dal ricettario personale (toggle).
 * Dopo la modifica ricarica la vista chiamando di nuovo recipeInit.
 * @param {string} recipeId - ID della ricetta
 */
async function toggleCookbook(recipeId)
{
  const session = getSession();
  if (!session) return;
  const entries = await getCookbook();
  if (entries.some(e => e.recipeId === recipeId))
  {
    await removeFromCookbook(recipeId);
  } else
  {
    await addToCookbook(recipeId, _recipeMealName, _recipeCategory, _recipeArea, _recipeThumb, "");
  }
  recipeInit(recipeId);
}

/**
 * Salva la nota privata dell'utente per la ricetta inviandola con PATCH al backend.
 * @param {string} recipeId - ID della ricetta
 */
async function saveNote(recipeId)
{
  const note = document.getElementById("note-input").value;
  await updateNote(recipeId, note);
  alert("Nota salvata.");
}

/**
 * Legge i campi del form recensione, valida data e voti (1-5) e invia il POST al backend.
 * Se la validazione o l'invio falliscono mostra un alert all'utente.
 * @param {string} recipeId - ID della ricetta da recensire
 */
async function submitReview(recipeId)
{
  const day = document.getElementById("review-day").value;
  const month = document.getElementById("review-month").value;
  const year = document.getElementById("review-year").value;
  const date = (day && month && year) ? `${year}-${month}-${day}` : "";

  const difficulty = parseInt(document.getElementById("review-difficulty").value);
  const taste = parseInt(document.getElementById("review-taste").value);

  if (!date || isNaN(difficulty) || isNaN(taste))
  {
    alert("Compila tutti i campi.");
    return;
  }

  if (difficulty < 1 || difficulty > 5 || taste < 1 || taste > 5)
  {
    alert("I voti devono essere tra 1 e 5.");
    return;
  }

  //controllo logico della data
  const parsedDate = new Date(`${year}-${month}-${day}`);
  if (isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== parseInt(year) ||
    parsedDate.getMonth() + 1 !== parseInt(month) ||
    parsedDate.getDate() !== parseInt(day))
  {
    alert("La data inserita non è valida.");
    return;
  }

  try
  {
    await addReview(recipeId, _recipeMealName, date, difficulty, taste);
    recipeInit(recipeId);
  } catch (err)
  {
    alert(err.message || "Errore durante l'invio della recensione.");
  }
}

/**
 * Elimina una recensione scritta dall'utente corrente e aggiorna la lista.
 * @param {string} reviewId - ID MongoDB della recensione
 * @param {string} recipeId - ID della ricetta associata
 */
async function handleDeleteReview(reviewId, recipeId)
{
  await deleteReview(reviewId);
  recipeInit(recipeId);
}