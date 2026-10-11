/////////////////////////////////////////////////////////
//////////////////Client per TheMealDB //////////////////
/////////////////////////////////////////////////////////

const API_BASE = "https://www.themealdb.com/api/json/v1/1";

//////////////////////
///Ricerca per nome///
//////////////////////

/**
 * Cerca le ricette nel catalogo di TheMealDB filtrando per nome.
 * Uso encodeURIComponent per assicurarmi che caratteri speciali o spazi nella query non rompano l'URL.
 * @param {string} name - Termine di ricerca (es. "pasta", "chicken")
 * @returns {Promise<Array>} Array di ricette trovate o array vuoto se non ci sono risultati
 */
async function searchMealsByName(name)
{
    try
    {
        const res = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(name)}`);
        const data = await res.json();
        return data.meals || [];
    } catch { return []; }
}

//////////////////////////////////
///Ricerca per lettera iniziale///
/////////////////////////////////

/**
 * Cerca le ricette che iniziano per una determinata lettera.
 * Prendo solo letter[0] per sicurezza nel caso l'utente abbia inserito più di un carattere.
 * @param {string} letter - Lettera iniziale (es. "a", "b")
 * @returns {Promise<Array>} Array di ricette corrispondenti o array vuoto
 */
async function searchMealsByLetter(letter)
{
    try
    {
        const res = await fetch(`${API_BASE}/search.php?f=${encodeURIComponent(letter[0])}`);
        const data = await res.json();
        return data.meals || [];
    } catch { return []; }
}

//////////////////////////////////
///Lista delle aree geografiche///
//////////////////////////////////

/**
 * Recupera l'elenco di tutte le aree geografiche/cucine disponibili (es. "Italian", "Mexican").
 * Ciclo i risultati per estrarre direttamente una lista pulita di stringhe invece dell'array di oggetti grezzi.
 * @returns {Promise<string[]>} Array con i nomi delle cucine
 */
async function getAreas()
{
    try
    {
        const res = await fetch(`${API_BASE}/list.php?a=list`);
        const data = await res.json();
        const meals = data.meals || [];
        const areas = [];
        for (let i = 0; i < meals.length; i++)
        {
            areas.push(meals[i].strArea);
        }
        return areas;
    } catch { return []; }
}

/////////////////////////////////
///Ricerca per area geografica///
/////////////////////////////////

/**
 * Cerca le ricette appartenenti a una specifica area geografica/cucina.
 * Nota: l'endpoint filter.php restituisce dati parziali (solo id, nome e thumbnail),
 * per i dettagli completi serve poi getMealById().
 * @param {string} area - Nome dell'area (es. "Italian")
 * @returns {Promise<Array>} Array di ricette con dati sintetici
 */
async function searchMealsByArea(area)
{
    try
    {
        const res = await fetch(`${API_BASE}/filter.php?a=${encodeURIComponent(area)}`);
        const data = await res.json();
        return data.meals || [];
    } catch { return []; }
}

/////////////////////////////
///Ricerca per ingrediente///
/////////////////////////////

/**
 * Cerca le ricette che contengono un determinato ingrediente principale.
 * Nota: l'endpoint filter.php restituisce dati parziali (solo id, nome e thumbnail),
 * per i dettagli completi serve poi getMealById().
 * @param {string} ingredient - Nome dell'ingrediente in inglese (es. "garlic")
 * @returns {Promise<Array>} Array di ricette corrispondenti
 */
async function searchMealsByIngredient(ingredient)
{
    try
    {
        const res = await fetch(`${API_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
        const data = await res.json();
        return data.meals || [];
    } catch { return []; }
}

//////////////////////
///Ricetta completa///
//////////////////////

/**
 * Recupera la scheda completa e dettagliata di una singola ricetta dato il suo ID univoco.
 * TheMealDB racchiude sempre il risultato in un array meals, quindi estraggo il primo elemento con [0].
 * @param {string|number} id - Identificativo della ricetta (es. "52772")
 * @returns {Promise<Object|null>} Oggetto con tutti i campi della ricetta o null se non trovata
 */
async function getMealById(id)
{
    try
    {
        const res = await fetch(`${API_BASE}/lookup.php?i=${id}`);
        const data = await res.json();
        return data.meals ? data.meals[0] : null;
    } catch { return null; }
}

//////////////////////
///Ricette casuali////
//////////////////////

/**
 * Recupera N ricette casuali per popolare il carosello della homepage.
 * Siccome TheMealDB con /random.php restituisce una sola ricetta per volta, per non fare
 * chiamate sequenziali lente lancio N richieste in parallelo con Promise.all().
 * Con .catch(() => null) su ogni singola richiesta evito che un singolo fallimento blocchi le altre.
 * @param {number} count - Numero di ricette casuali richieste
 * @returns {Promise<Array>} Elenco di ricette casuali
 */
async function getRandomMeals(count)
{
    try
    {
        const requests = [];
        for (let i = 0; i < count; i++)
        {
            requests.push(
                fetch(`${API_BASE}/random.php`).then(r => r.json()).catch(() => null)
            );
        }

        const results = await Promise.all(requests);
        const meals = [];
        for (let i = 0; i < results.length; i++)
        {
            if (results[i] && results[i].meals && results[i].meals[0])
            {
                meals.push(results[i].meals[0]);
            }
        }
        return meals;
    } catch { return []; }
}

///////////////////////////
///Lista delle categorie///
///////////////////////////

/**
 * Recupera tutte le categorie di ricette con nome, descrizione e immagine.
 * Usata nella pagina di registrazione per mostrare le schede delle categorie preferite.
 * @returns {Promise<Array>} Elenco delle categorie
 */
async function getCategories()
{
    try
    {
        const res = await fetch(`${API_BASE}/categories.php`);
        const data = await res.json();
        return data.categories || [];
    } catch { return []; }
}