//////////////////////////////////////////
/////////////////Homepage/////////////////
//////////////////////////////////////////
// questa view gestisce la schermata principale (#/) ed ha due versioni distinte in base allo stato di autenticazione dell'utente (ospite vs loggato). Include due componenti interattivi indipendenti: il carosello 3D e il carosello delle recensioni.

//////////////////
///Carosello 3D///
//////////////////

let _c3dMeals = [];       //array delle ricette mostrate nel carosello
let _c3dIdx = 0;          //indice della slide centrale attiva
let _c3dTimer = null;     //timer dell'avanzamento automatico (setInterval)
let _c3dSwapTimer = null; //timer della transizione di dissolvenza in corso (setTimeout)

/**
 * Avvia l'autoplay del carosello 3D avanzando di una slide ogni intervallo specificato.
 * Cancella prima eventuali timer precedenti per non sovrapporre esecuzioni.
 * @param {number} [ms=4000] - Intervallo di tempo in millisecondi
 */
function _c3dStartAutoplay(ms = 4000)
{
    _c3dStopAutoplay();
    _c3dTimer = setInterval(() => carousel3dNav(1), ms);
}

/**
 * Ferma tutti i timer attivi del carosello 3D (sia autoplay sia transizioni in corso).
 * Viene chiamata dal router quando si naviga via dalla home per evitare memory leak.
 */
function _c3dStopAutoplay()
{
    if (_c3dTimer) { clearInterval(_c3dTimer); _c3dTimer = null; }
    if (_c3dSwapTimer) { clearTimeout(_c3dSwapTimer); _c3dSwapTimer = null; }
}

/**
 * Genera l'HTML di una singola slide del carosello (link, immagine e didascalia).
 * @param {Object} meal - Dati della ricetta
 * @returns {string} Markup HTML della slide
 */
function _c3dSlideHTML(meal)
{
    if (!meal) return "";
    return `
    <a href="#/recipe/${meal.idMeal}">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <div class="c3d-caption">${meal.strMeal}</div>
    </a>`;
}

/**
 * Esegue la transizione fluida (crossfade) sostituendo la slide precedente con quella nuova.
 * Uso il doppio requestAnimationFrame per forzare il browser a calcolare due frame distinti:
 * nel primo l'elemento nuovo ha opacità 0, nel secondo passa a 1 avviando la transizione CSS senza scatti.
 * @param {HTMLElement} el - Il contenitore della slide (sinistra, centro o destra)
 * @param {string} newHTML - Il markup della nuova slide
 */
function _c3dSwap(el, newHTML)
{
    if (!el) return;
    const prev = el.firstElementChild;
    const tmp = document.createElement("div");
    tmp.innerHTML = newHTML;
    const next = tmp.firstElementChild;
    if (!next) { el.innerHTML = newHTML; return; }

    next.style.opacity = "0";
    next.style.transition = "opacity 0.38s ease";
    el.appendChild(next);

    requestAnimationFrame(() => requestAnimationFrame(() =>
    {
        next.style.opacity = "1";
        if (prev)
        {
            prev.style.transition = "opacity 0.38s ease";
            prev.style.opacity = "0";
        }
    }));

    _c3dSwapTimer = setTimeout(() =>
    {
        _c3dSwapTimer = null;
        if (prev && prev.parentNode === el) el.removeChild(prev);
        next.style.opacity = "";
        next.style.transition = "";
    }, 420);
}

/**
 * Renderizza le tre slide visibili (sinistra, centro, destra).
 * Sfrutta l'aritmetica modulare ((idx + dir + length) % length) per rendere il carosello
 * circolare e infinito in entrambe le direzioni.
 */
function _c3dRender()
{
    const n = _c3dMeals.length;
    if (n < 1) return;
    const li = (_c3dIdx - 1 + n) % n;
    const ri = (_c3dIdx + 1) % n;

    _c3dSwap(document.getElementById("c3d-left"), _c3dSlideHTML(_c3dMeals[li]));
    _c3dSwap(document.getElementById("c3d-center"), _c3dSlideHTML(_c3dMeals[_c3dIdx]));
    _c3dSwap(document.getElementById("c3d-right"), _c3dSlideHTML(_c3dMeals[ri]));
}

/**
 * Sposta il carosello di una o più posizioni e riavvia il timer dell'autoplay.
 * @param {number} dir - Direzione: +1 per andare avanti, -1 per tornare indietro
 */
function carousel3dNav(dir)
{
    if (_c3dMeals.length === 0) return;
    _c3dIdx = (_c3dIdx + dir + _c3dMeals.length) % _c3dMeals.length;
    _c3dRender();
    _c3dStartAutoplay();
}

//////////////////////////////////////////
///Carosello recensioni della community///
//////////////////////////////////////////

let _crItems = []; //elenco di tutte le recensioni da impaginare
let _crPage = 0;   //indice della pagina corrente
const _CR_PER = 3; //numero di card visibili per schermata

/**
 * Renderizza la pagina corrente delle recensioni della community prelevando gli elementi
 * da _crItems tramite .slice() e disabilitando i pulsanti prev/next quando si raggiungono i limiti.
 */
function _crRenderPage()
{
    const track = document.getElementById("cr-track");
    if (!track) return;
    const start = _crPage * _CR_PER;
    const visible = _crItems.slice(start, start + _CR_PER);
    track.innerHTML = visible.map(r =>
    {
        return `
        <div class="cr-card">
          <a href="#/recipe/${r.recipeId}" class="community-review-title">${escapeHTML(r.mealName || r.recipeId)}</a>
          <div class="community-review-meta">
            <span>${escapeHTML(r.username || "Utente")}</span>
            <span class="review-date">${escapeHTML(r.date)}</span>
          </div>
          <div class="pill-stars mt-1">${renderStars(r.taste)}</div>
        </div>`;
    }).join("");

    const maxPage = Math.ceil(_crItems.length / _CR_PER) - 1;
    const prev = document.getElementById("cr-btn-prev");
    const next = document.getElementById("cr-btn-next");
    if (prev) prev.disabled = _crPage === 0;
    if (next) next.disabled = _crPage >= maxPage;
}

/**
 * Cambia pagina nel carosello delle recensioni con un effetto fade-out/fade-in.
 * Vincola l'indice tra 0 e maxPage con Math.min e Math.max.
 * @param {number} dir - Direzione: +1 per la pagina successiva, -1 per la precedente
 */
function crNav(dir)
{
    const maxPage = Math.ceil(_crItems.length / _CR_PER) - 1;
    _crPage = Math.min(maxPage, Math.max(0, _crPage + dir));
    const track = document.getElementById("cr-track");
    if (track)
    {
        track.style.opacity = "0";
        setTimeout(() => { _crRenderPage(); track.style.opacity = "1"; }, 200);
    }
}

/**
 * Genera il markup HTML di 5 stelle per rappresentare graficamente un punteggio.
 * È definita qui globalmente così viene ereditata anche dalle altre viste.
 * @param {number} n - Numero di stelle piene da visualizzare (1-5)
 * @returns {string} Stringa con i tag icona <i> di Bootstrap Icons
 */
function renderStars(n)
{
    let s = "";
    for (let i = 1; i <= 5; i++)
    {
        s += `<i class="bi bi-star${i <= n ? "-fill stars-filled" : " stars-empty"}"></i>`;
    }
    return s;
}

///////////////
///View HTML///
///////////////

function homeView()
{
    if (isLoggedIn())
    {
        return `
        <div class="row mt-2 g-5 mb-5">
          <div class="col-md-6">
            <h2 class="section-title">Ultime ricette salvate</h2>
            <div id="home-cookbook-list">
              <div class="text-center py-4"><div class="spinner-border" role="status"></div></div>
            </div>
            <a href="#/cookbook" class="section-link">Vai al mio ricettario →</a>
          </div>
          <div class="col-md-6">
            <h2 class="section-title">Ultime ricette recensite</h2>
            <div id="home-reviews-list">
              <div class="text-center py-4"><div class="spinner-border" role="status"></div></div>
            </div>
            <a href="#/reviews" class="section-link">Vai alle mie recensioni →</a>
          </div>
        </div>

        <div class="row mt-2 g-5 mb-4">
          <div class="col-12">
            <h2 class="section-title">Cosa stanno cucinando gli altri?</h2>
            <div id="home-community-reviews">
              <div class="cr-wrap">
                <div class="cr-track" id="cr-track">
                  <div class="text-center py-4 w-100"><div class="spinner-border" role="status"></div></div>
                </div>
                <button class="cr-btn cr-btn-prev" id="cr-btn-prev" onclick="crNav(-1)">&#8249;</button>
                <button class="cr-btn cr-btn-next" id="cr-btn-next" onclick="crNav(1)">&#8250;</button>
              </div>
            </div>
          </div>
        </div>

        <div class="c3d-wrap mb-5">
          <div class="c3d-stage">
            <div class="c3d-slide c3d-left"   id="c3d-left"></div>
            <div class="c3d-slide c3d-center" id="c3d-center">
              <div class="text-center py-5"><div class="spinner-border" role="status"></div></div>
            </div>
            <div class="c3d-slide c3d-right"  id="c3d-right"></div>
          </div>
          <button class="c3d-btn c3d-btn-prev" onclick="carousel3dNav(-1)">&#8249;</button>
          <button class="c3d-btn c3d-btn-next" onclick="carousel3dNav(1)">&#8250;</button>
        </div>`;
    }

    return `
    <div class="row g-5 mt-1 mb-5">
      <div class="col-md-6">
        <h2 class="section-title">Ultime ricette<br>recensite</h2>
        <div id="last-reviewed-list">
          <div class="text-center py-4"><div class="spinner-border" role="status"></div></div>
        </div>
      </div>

      <div class="col-md-6">
        <h2 class="section-title">Le ricette più<br>votate</h2>
        <div id="top-rated-list">
          <div class="text-center py-4"><div class="spinner-border" role="status"></div></div>
        </div>
      </div>
    </div>

    <div class="c3d-wrap mb-5">
      <div class="c3d-stage">
        <div class="c3d-slide c3d-left"   id="c3d-left"></div>
        <div class="c3d-slide c3d-center" id="c3d-center">
          <div class="text-center py-5"><div class="spinner-border" role="status"></div></div>
        </div>
        <div class="c3d-slide c3d-right"  id="c3d-right"></div>
      </div>
      <button class="c3d-btn c3d-btn-prev" onclick="carousel3dNav(-1)">&#8249;</button>
      <button class="c3d-btn c3d-btn-next" onclick="carousel3dNav(1)">&#8250;</button>
    </div>`;
}

///////////////////////////////////////
///Init - caricamento dati asincrono///
///////////////////////////////////////

/**
 * Funzione di inizializzazione della home invocata dal router.
 * Smista la logica tra utente loggato e ospite.
 */
async function homeInit()
{
    if (isLoggedIn())
    {
        await homeInitLogged();
    } else
    {
        await homeInitGuest();
    }
}

/**
 * Carica e visualizza i contenuti per gli utenti non autenticati:
 * 1. Recupera tutte le recensioni per mostrare le ultime ricette uniche (con Set per deduplicare)
 * 2. Calcola le ricette con punteggio medio più alto e le ordina
 * 3. Popola e avvia il carosello 3D con 6 ricette casuali
 */
async function homeInitGuest()
{
    const reviews = await getReviews();

    const carouselMeals = await getRandomMeals(6);
    if (carouselMeals && carouselMeals.length > 0)
    {
        _c3dMeals = carouselMeals;
        _c3dIdx = 0;
        _c3dRender();
        _c3dStartAutoplay();
    } else
    {
        const elC = document.getElementById("c3d-center");
        if (elC) elC.innerHTML = '<p class="text-center py-4 text-muted">Nessuna ricetta disponibile.</p>';
    }

    //ultime ricette recensite uniche
    const lastEl = document.getElementById("last-reviewed-list");
    if (lastEl)
    {
        if (reviews.length > 0)
        {
            const seen = new Set();
            const unique = [];
            reviews.forEach(r =>
            {
                if (!seen.has(r.recipeId)) { seen.add(r.recipeId); unique.push(r); }
            });
            lastEl.innerHTML = unique.slice(0, 4).map(r =>
                `<a href="#/recipe/${r.recipeId}" class="recipe-pill mb-2">${escapeHTML(r.mealName || r.recipeId)}</a>`
            ).join("");
        } else
        {
            lastEl.innerHTML = '<p class="text-muted small">Nessuna ricetta ancora recensita. Sii il primo!</p>';
        }
    }

    //ricette con punteggio medio più alto
    const topEl = document.getElementById("top-rated-list");
    if (topEl)
    {
        if (reviews.length === 0)
        {
            topEl.innerHTML = `
              <p class="text-muted" style="font-size:.95rem; line-height:1.6;">
                Nessuna ricetta ancora votata.<br>
                Sii il primo a lasciare una recensione!
              </p>`;
        } else
        {
            const ratings = {};
            reviews.forEach(r =>
            {
                if (!ratings[r.recipeId])
                {
                    ratings[r.recipeId] = { name: r.mealName || r.recipeId, sum: 0, count: 0 };
                }
                ratings[r.recipeId].sum += r.taste;
                ratings[r.recipeId].count++;
            });
            //trasformo l'oggetto con le somme in una lista con le medie calcolate
            const ratingList = [];
            for (const id in ratings)
            {
                const d = ratings[id];
                const avg = d.sum / d.count;
                ratingList.push({ id: id, name: d.name, avg: avg });
            }

            //ordino in ordine decrescente in base al voto medio
            ratingList.sort(function(a, b)
            {
                return b.avg - a.avg;
            });

            //prendo al massimo le prime 3 ricette più votate
            const topMeals = ratingList.slice(0, 3);
            let topHtml = "";
            for (let i = 0; i < topMeals.length; i++)
            {
                const m = topMeals[i];
                topHtml += `<a href="#/recipe/${m.id}" class="recipe-pill mb-2">
                  ${m.name}
                  <div class="pill-stars">${renderStars(Math.round(m.avg))}</div>
                </a>`;
            }
            topEl.innerHTML = topHtml;
        }
    }
}

/**
 * Carica i dati personalizzati per l'utente loggato:
 * 1. Esegue 3 chiamate in parallelo con Promise.all (ricettario personale, recensioni personali, tutte le recensioni)
 * 2. Mostra le ultime ricette salvate e recensite dall'utente
 * 3. Popola il carosello delle recensioni escludendo quelle scritte dall'utente stesso
 * 4. Avvia il carosello 3D
 */
async function homeInitLogged()
{
    const session = getSession();

    const [entries, reviews, allReviews] = await Promise.all([
        getCookbook(),
        getMyReviews(),
        getReviews()
    ]);

    const carouselMeals = await getRandomMeals(6);
    if (carouselMeals && carouselMeals.length > 0)
    {
        _c3dMeals = carouselMeals;
        _c3dIdx = 0;
        _c3dRender();
        _c3dStartAutoplay();
    } else
    {
        const elC = document.getElementById("c3d-center");
        if (elC) elC.innerHTML = '<p class="text-center py-4 text-muted">Nessuna ricetta disponibile.</p>';
    }

    // ultime ricette salvate nel ricettario
    const cbEl = document.getElementById("home-cookbook-list");
    if (cbEl)
    {
        if (entries.length === 0)
        {
            cbEl.innerHTML = '<p class="text-muted small">Nessuna ricetta salvata. <a href="#/search">Cerca una ricetta</a>.</p>';
        } else
        {
            cbEl.innerHTML = entries.slice(0, 4).map(e =>
                `<a href="#/recipe/${e.recipeId}" class="recipe-pill mb-2">${escapeHTML(e.mealName || e.recipeId)}</a>`
            ).join("");
        }
    }

    //ultime ricette recensite dall'utente
    const revEl = document.getElementById("home-reviews-list");
    if (revEl)
    {
        if (reviews.length === 0)
        {
            revEl.innerHTML = '<p class="text-muted small">Non hai ancora lasciato recensioni.</p>';
        } else
        {
            revEl.innerHTML = reviews.slice(0, 3).map(r =>
                `<a href="#/recipe/${r.recipeId}" class="recipe-pill mb-2">
                  ${escapeHTML(r.mealName || r.recipeId)}
                  <div class="pill-stars">${renderStars(r.taste)}</div>
                </a>`
            ).join("");
        }
    }

    //carosello recensioni community (escluse le proprie)
    const otherReviews = allReviews.filter(r => r.userId !== session.id);
    if (otherReviews.length === 0)
    {
        const track = document.getElementById("cr-track");
        if (track) track.innerHTML = '<p class="text-muted small py-2">Nessuna recensione dalla community ancora.</p>';
    } else
    {
        _crItems = otherReviews;
        _crPage = 0;
        _crRenderPage();
    }
}