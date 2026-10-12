//////////////////////////////////////////////////////////////
/////////////////View del ricettario personale////////////////
//////////////////////////////////////////////////////////////

let _cbEntries = [];        //array in memoria con tutte le ricette del ricettario
let _cbGroupBy = "category"; //modalità di raggruppamento attiva

function cookbookView()
{
  return `
    <h2 class="page-title">Il mio ricettario</h2>
    <div id="cookbook-container">
      <div class="text-center py-5">
        <div class="spinner-border" role="status"></div>
      </div>
    </div>`;
}

async function cookbookInit()
{
  const container = document.getElementById("cookbook-container");

  const entries = await getCookbook();

  if (entries.length === 0)
  {
    container.innerHTML = `
          <div class="alert alert-info">
            Non hai ancora salvato nessuna ricetta.
            <a href="#/search" class="alert-link">Cerca una ricetta</a> per iniziare.
          </div>`;
    return;
  }

  //trovo le voci che necessitano di essere completate con themealdb
  const needApi = entries.filter(e => !e.category || !e.thumb);

  if (needApi.length > 0)
  {
    const meals = await Promise.all(
      needApi.map(e => getMealById(e.recipeId))
    ).catch(() => []);

    await Promise.all(meals.map(async (m, i) =>
    {
      if (!m) return;
      const e = needApi[i];
      e.category = e.category || m.strCategory || "";
      e.area = e.area || m.strArea || "";
      e.thumb = e.thumb || m.strMealThumb || "";
      if (!e.mealName) e.mealName = m.strMeal;
      await apiRequest("PATCH", `/cookbook/${e.recipeId}`, {
        category: e.category, area: e.area, thumb: e.thumb, mealName: e.mealName
      });
    })).catch(() => { });
  }

  _cbEntries = entries;
  _cbGroupBy = "category";
  _cbRender(container);
}

/**
 * Costruisce l'HTML del ricettario raggruppando le ricette in memoria (_cbEntries).
 * 1. Raggruppa le ricette per chiave ('category' o 'area')
 * 2. Ordina alfabeticamente sia i gruppi sia le ricette al loro interno
 * 3. Mostra i pulsanti per cambiare al volo il raggruppamento senza fare nuove richieste di rete
 * @param {HTMLElement} container - Il contenitore DOM in cui iniettare il markup
 */
function _cbRender(container)
{
  const key = _cbGroupBy === "category" ? "category" : "area";

  const groups = {};
  _cbEntries.forEach(e =>
  {
    const g = e[key] || "Altro";
    if (!groups[g]) groups[g] = [];
    groups[g].push(e);
  });

  //ordino le ricette all'interno di ogni gruppo per nome alfabetico
  for (const groupName in groups)
  {
    groups[groupName].sort(function(a, b)
    {
      return (a.mealName || "").localeCompare(b.mealName || "");
    });
  }

  /**
   * Genera l'HTML di una singola "pill" ricetta con immagine, nome e tasto elimina
   * @param {Object} e - Voce del ricettario
   * @returns {string}
   */
  function pillHtml(e)
  {
    return `
      <div class="cb-pill-wrap">
        <a href="#/recipe/${e.recipeId}" class="cb-pill-link">
          ${e.thumb ? `<img src="${e.thumb}" class="cb-pill-img" alt="${escapeHTML(e.mealName)}">` : ""}
          <span class="cb-pill-name">${escapeHTML(e.mealName || e.recipeId)}</span>
        </a>
        <button class="btn-cookbook-remove" onclick="removeFromCookbookAndRefresh('${e.recipeId}')" title="Rimuovi">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>`;
  }

  //ordino i nomi dei gruppi in ordine alfabetico e costruisco l'HTML con cicli for
  const groupNames = Object.keys(groups).sort(function(a, b)
  {
    return a.localeCompare(b);
  });

  let groupsHtml = "";
  for (let i = 0; i < groupNames.length; i++)
  {
    const name = groupNames[i];
    const list = groups[name];

    let pills = "";
    for (let j = 0; j < list.length; j++)
    {
      pills += pillHtml(list[j]);
    }

    groupsHtml += `
          <div class="cb-group mb-4">
            <h6 class="cb-group-title">${escapeHTML(name)}</h6>
            <div class="d-flex flex-wrap gap-2">
              ${pills}
            </div>
          </div>`;
  }

  container.innerHTML = `
      <div class="d-flex gap-2 mb-4">
        <button class="btn ${_cbGroupBy === "category" ? "btn-primary" : "btn-outline-secondary"} btn-sm"
          onclick="cookbookSetGroup('category')">Per tipologia</button>
        <button class="btn ${_cbGroupBy === "area" ? "btn-primary" : "btn-outline-secondary"} btn-sm"
          onclick="cookbookSetGroup('area')">Per cucina</button>
      </div>
      <div class="row g-4">
        ${groupsHtml}
      </div>`;
}

/**
 * Cambia la modalità di raggruppamento e ri-renderizza la pagina dai dati già in memoria.
 * @param {'category'|'area'} type - Criterio di raggruppamento
 */
function cookbookSetGroup(type)
{
  _cbGroupBy = type;
  _cbRender(document.getElementById("cookbook-container"));
}

/**
 * Rimuove una ricetta dal ricettario:
 * chiama il backend (DELETE), aggiorna la lista locale in memoria e ri-renderizza la pagina
 * senza dover fare un nuovo caricamento completo da rete.
 * @param {string} recipeId - ID della ricetta da rimuovere
 */
async function removeFromCookbookAndRefresh(recipeId)
{
  await removeFromCookbook(recipeId);
  _cbEntries = _cbEntries.filter(e => e.recipeId !== recipeId);
  if (_cbEntries.length === 0)
  {
    cookbookInit();
  } else
  {
    _cbRender(document.getElementById("cookbook-container"));
  }
}