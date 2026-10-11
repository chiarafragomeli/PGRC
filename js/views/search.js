//////////////////////////////////////////////////////////////
/////////////////View della pagina di ricerca/////////////////
//////////////////////////////////////////////////////////////
//la ricerca di ricette viene gestita con quattro modalità: per nome, ingrediente, lettera iniziale, cucina.

function searchView()
{
  return `
    <h2 class="page-title">Cerca ricette</h2>
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-2 align-items-start">
          <div class="col-md-4">
            <select id="search-type" class="form-select" onchange="updateSearchInput()">
              <option value="name">Per nome</option>
              <option value="ingredient">Per ingrediente</option>
              <option value="letter">Per lettera iniziale</option>
              <option value="area">Per tipologia di cucina</option>
            </select>
          </div>
          <div class="col-md-6" id="search-text-wrap">
            <input type="text" id="search-input" class="form-control" placeholder="es. Pasta, Chicken…"
              oninput="clearSearchError()">
            <div id="search-error" class="search-error d-none">Inserisci un termine di ricerca.</div>
          </div>
          <div class="col-md-6 d-none" id="search-area-wrap">
            <select id="search-area" class="form-select">
              <option value="">Caricamento cucine…</option>
            </select>
          </div>
          <div class="col-md-2 d-flex gap-2">
            <button class="btn btn-primary flex-grow-1" onclick="handleSearch()">Cerca</button>
            <button class="btn btn-outline-secondary" onclick="clearSearch()" title="Cancella">&#10005;</button>
          </div>
        </div>
      </div>
    </div>
    <div id="search-results" class="row row-cols-1 row-cols-md-3 g-4"></div>
  `;
}

const placeholders = {
  name: "es. pasta, chicken…",
  ingredient: "es. garlic, tomato…",
  letter: "es. a, b, c…"
};

async function updateSearchInput()
{
  const type = document.getElementById("search-type").value;
  const textWrap = document.getElementById("search-text-wrap");
  const areaWrap = document.getElementById("search-area-wrap");
  const input = document.getElementById("search-input");

  if (type === "area")
  {
    textWrap.classList.add("d-none");
    areaWrap.classList.remove("d-none");

    const areaSelect = document.getElementById("search-area");
    if (areaSelect.options.length <= 1)
    {
      const areas = await getAreas();
      areaSelect.innerHTML = areas.map(a =>
        `<option value="${a}">${a}</option>`
      ).join("");
    }
  } else
  {
    areaWrap.classList.add("d-none");
    textWrap.classList.remove("d-none");
    input.placeholder = placeholders[type] || "Cerca…";

    input.maxLength = type === "letter" ? 1 : 524288;
    input.value = "";
  }
}

async function handleSearch()
{
  const type = document.getElementById("search-type").value;
  const container = document.getElementById("search-results");

  let query = "";
  if (type === "area")
  {
    query = document.getElementById("search-area").value;
  } else
  {
    query = document.getElementById("search-input").value.trim();
  }

  if (!query)
  {
    if (type === "area")
    {
      container.innerHTML = `<div class="col-12"><p class="text-muted">Seleziona una cucina dal menu.</p></div>`;
    } else
    {
      const input = document.getElementById("search-input");
      const err = document.getElementById("search-error");
      if (input) input.classList.add("is-invalid");
      if (err) err.classList.remove("d-none");
    }
    return;
  }

  if (type === "letter" && query.length !== 1)
  {
    container.innerHTML = `<div class="col-12"><p class="text-muted">Inserisci una sola lettera (es. A, B, C…).</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border" role="status"></div>
    </div>`;

  let meals = [];
  if (type === "name") meals = await searchMealsByName(query);
  else if (type === "ingredient") meals = await searchMealsByIngredient(query);
  else if (type === "letter") meals = await searchMealsByLetter(query);
  else meals = await searchMealsByArea(query);

  if (meals.length === 0)
  {
    container.innerHTML = `<div class="col-12"><p class="text-muted">Nessuna ricetta trovata.</p></div>`;
    return;
  }

  sessionStorage.setItem("pgrc_last_search", JSON.stringify({ type, query }));
  //la ricerca viene salvata solamente per la sessione di navigazione e non oltre

  let html = "";
  for (let i = 0; i < meals.length; i++)
  {
    const meal = meals[i];
    html += `
    <div class="col">
      <div class="card h-100">
        <img src="${meal.strMealThumb}" class="card-img-top card-recipe-img" alt="${meal.strMeal}">
        <div class="card-body">
          <h5 class="card-title">${meal.strMeal}</h5>
          <p class="card-text text-muted small">${meal.strCategory || ""} ${meal.strArea ? "· " + meal.strArea : ""}</p>
        </div>
        <div class="card-footer bg-transparent">
          <a href="#/recipe/${meal.idMeal}" class="btn btn-outline-primary btn-sm w-100">Vedi ricetta</a>
        </div>
      </div>
    </div>`;
  }
  container.innerHTML = html;
}

async function searchInit()
{
  //ripristina l'ultima ricerca da sessionStorage se c'è
  const input = document.getElementById("search-input");
  input.placeholder = placeholders["name"];

  input.addEventListener("keydown", function (e)
  {
    if (e.key === "Enter") handleSearch();
  });

  const saved = sessionStorage.getItem("pgrc_last_search");
  if (!saved) return;

  let type, query;
  try { ({ type, query } = JSON.parse(saved)); } catch { return; }

  const typeSelect = document.getElementById("search-type");
  typeSelect.value = type;
  await updateSearchInput();

  if (type === "area")
  {
    document.getElementById("search-area").value = query;
  } else
  {
    input.value = query;
  }

  handleSearch();
}

function clearSearchError()
{
  const input = document.getElementById("search-input");
  const err = document.getElementById("search-error");
  if (input) input.classList.remove("is-invalid");
  if (err) err.classList.add("d-none");
}


function clearSearch()
{
  document.getElementById("search-type").value = "name";
  updateSearchInput();
  document.getElementById("search-input").value = "";
  document.getElementById("search-results").innerHTML = "";
  sessionStorage.removeItem("pgrc_last_search");
}