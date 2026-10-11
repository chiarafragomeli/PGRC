////////////////////////////////////////////////////////////
/////////////////Client HTTP per il backend/////////////////
////////////////////////////////////////////////////////////

const BACKEND_BASE = "/api";

/**
 * Pulisce una stringa sostituendo i caratteri speciali HTML con le rispettive entità.
 * La uso prima di inserire dati dinamici con innerHTML per prevenire attacchi XSS.
 * @param {string} str - La stringa da bonificare
 * @returns {string} Stringa sicura da stampare nel DOM
 */
function escapeHTML(str)
{
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/////////////////////////////////////////////////////////
///Gestione del token e della sessione in localStorage///
/////////////////////////////////////////////////////////
// flusso:
// 1) il token JWT serve per autenticare le richieste HTTP verso il server (header Authorization)
// 2) la sessione locale contiene una copia dei dati utente per aggiornare subito la UI (es. navbar)

/**
 * Recupera il token JWT salvato nel localStorage.
 * @returns {string|null} Il token salvato o null se non presente
 */
function getToken() { return localStorage.getItem("pgrc_token"); }

/**
 * Salva il token JWT nel localStorage.
 * @param {string} t - Il token restituito dal server
 */
function _setToken(t) { localStorage.setItem("pgrc_token", t); }

/**
 * Rimuove il token JWT dal localStorage.
 */
function _clearToken() { localStorage.removeItem("pgrc_token"); }

/**
 * Recupera l'oggetto con i dati dell'utente loggato salvato nel localStorage.
 * Uso il try/catch per evitare crash se il JSON fosse corrotto.
 * @returns {Object|null} Oggetto utente (id, username, email) o null
 */
function getSession() { try { return JSON.parse(localStorage.getItem("pgrc_session")); } catch { return null; } }

/**
 * Salva i dati dell'utente serializzati in formato JSON nel localStorage.
 * @param {Object} u - Dati del profilo utente
 */
function _setSession(u) { localStorage.setItem("pgrc_session", JSON.stringify(u)); }

/**
 * Controlla se c'è un utente attualmente loggato.
 * Restituisce true solo se sono presenti sia il token sia i dati di sessione.
 * @returns {boolean}
 */
function isLoggedIn() { return !!(getToken() && getSession()); }

/**
 * Svuota completamente la sessione dell'utente dal client.
 * La chiamo al logout o quando l'utente elimina l'account e pulisco anche
 * sessionStorage così non restano ricerche precedenti.
 */
function clearSession()
{
    _clearToken();
    localStorage.removeItem("pgrc_session");
    sessionStorage.removeItem("pgrc_last_search");
}

//////////////////////
///Fetch con token ///
//////////////////////

/**
 * Wrapper principale per effettuare le richieste HTTP al server Express.
 * Si occupa di:
 * 1. Impostare Content-Type application/json;
 * 2. Allegare il token JWT nell'header Authorization se l'utente è loggato;
 * 3. Leggere la risposta come testo per gestire eventuali body vuoti senza errori di parsing;
 * 4. Lanciare un errore se lo status code HTTP indica fallimento (!res.ok);
 * 
 * @param {string} method - Metodo HTTP ("GET", "POST", "PUT", "PATCH", "DELETE")
 * @param {string} path - Percorso relativo dell'endpoint (es. "/auth/login")
 * @param {Object} [body] - Dati da inviare nel corpo della richiesta (per POST/PUT/PATCH)
 * @returns {Promise<Object>} Risposta del server parsata in JSON
 * @throws {Error} Se la risposta ha status >= 400 o se il server non è raggiungibile
 */
async function apiRequest(method, path, body)
{
    const opts = { method, headers: { "Content-Type": "application/json" } };

    const token = getToken();

    if (token) opts.headers["Authorization"] = `Bearer ${token}`;
     //se ho il token lo aggiungo come bearer token

    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(`${BACKEND_BASE}${path}`, opts);

    let data = {};
    const text = await res.text();
    //leggo prima come testo grezzo per non rompere JSON.parse se il body è vuoto
    if (text)
    {
        try { data = JSON.parse(text); }
        catch
        {
            throw new Error("Risposta non valida dal server. Assicurati di aprire l'app da http://localhost:3000");
        }
    }

    if (!res.ok) throw new Error(data.error || "Errore del server.");
    return data;
}

/////////////////////
///Autenticazione////
/////////////////////

/**
 * Effettua il login inviando email e password al backend.
 * Se ha successo salva token e sessione in localStorage e ripulisce le ricerche da guest.
 * @param {string} email - Email dell'utente
 * @param {string} password - Password in chiaro
 * @returns {Promise<{success: boolean, error?: string}>} Esito dell'operazione
 */
async function loginUser(email, password)
{
    try
    {
        const data = await apiRequest("POST", "/auth/login", { email, password });
        _setToken(data.token);
        _setSession(data.user);
        sessionStorage.removeItem("pgrc_last_search");
        return { success: true };
    } catch (err)
    {
        return { success: false, error: err.message };
    }
}

/**
 * Registra un nuovo utente.
 * Il backend crea l'utente ed emette direttamente il token, quindi effettuo
 * subito l'accesso salvando token e sessione locale senza dover rifare il login.
 * @param {string} username - Nome utente
 * @param {string} email - Indirizzo email
 * @param {string} password - Password scelta
 * @param {string[]} favoriteDishes - Categorie preferite selezionate con i chip
 * @returns {Promise<{success: boolean, error?: string}>} Esito dell'operazione
 */
async function registerUser(username, email, password, favoriteDishes)
{
    try
    {
        const data = await apiRequest("POST", "/auth/register", { username, email, password, favoriteDishes });
        _setToken(data.token);
        _setSession(data.user);
        sessionStorage.removeItem("pgrc_last_search");
        return { success: true };
    } catch (err)
    {
        return { success: false, error: err.message };
    }
}

/**
 * Aggiorna i dati del profilo dell'utente loggato (PUT /api/auth/me).
 * Invia al server solo i campi che sono stati effettivamente compilati
 * (es. permette di cambiare solo il nome senza toccare la password).
 * @param {Object} data - Dati del profilo da aggiornare
 * @param {string} [data.username] - Nuovo nome utente opzionale
 * @param {string} [data.password] - Nuova password opzionale
 * @returns {Promise<{success: boolean, error?: string}>} Esito dell'operazione
 */
async function updateUser(data)
{
    try
    {
        const body = {};
        if (data && data.username) body.username = data.username;
        if (data && data.password) body.password = data.password;
        const user = await apiRequest("PUT", "/auth/me", body);
        _setSession(user);
        return { success: true };
    } catch (err)
    {
        return { success: false, error: err.message };
    }
}

/**
 * Elimina definitivamente l'account dell'utente corrente (DELETE /api/auth/me).
 * Dopo l'eliminazione pulisce subito la sessione locale.
 * @returns {Promise<{success: boolean, error?: string}>} Esito dell'operazione
 */
async function deleteCurrentUser()
{
    try
    {
        await apiRequest("DELETE", "/auth/me");
        clearSession();
        return { success: true };
    } catch (err)
    {
        return { success: false, error: err.message };
    }
}

///////////////////////
//////Ricettario///////
///////////////////////

/**
 * Recupera tutte le ricette salvate nel ricettario personale dell'utente loggato.
 * @returns {Promise<Array>} Lista delle ricette salvate (o array vuoto in caso di errore)
 */
async function getCookbook()
{
    try { return await apiRequest("GET", "/cookbook"); }
    catch { return []; }
}

/**
 * Aggiunge una ricetta al ricettario personale salvando i metadati denormalizzati nel database.
 * In questo modo il ricettario si può visualizzare senza dover richiamare TheMealDB.
 * @param {string} recipeId - ID TheMealDB della ricetta
 * @param {string} mealName - Nome della pietanza
 * @param {string} category - Categoria (es. "Pasta")
 * @param {string} area - Cucina/area geografica (es. "Italian")
 * @param {string} thumb - URL dell'immagine
 * @param {string} [note] - Nota personale opzionale
 * @returns {Promise<boolean>} True se salvata con successo, false altrimenti
 */
async function addToCookbook(recipeId, mealName, category, area, thumb, note)
{
    try
    {
        await apiRequest("POST", "/cookbook", { recipeId, mealName, category, area, thumb, note: note || "" });
        return true;
    } catch { return false; }
}

/**
 * Rimuove una ricetta salvata dal ricettario dell'utente.
 * @param {string} recipeId - ID della ricetta da eliminare
 * @returns {Promise<boolean>} True se rimossa con successo, false altrimenti
 */
async function removeFromCookbook(recipeId)
{
    try { await apiRequest("DELETE", `/cookbook/${recipeId}`); return true; }
    catch { return false; }
}

/**
 * Modifica la nota privata di una ricetta già presente nel ricettario.
 * Usa PATCH perché aggiorna solo il campo "note" senza riscrivere l'intero documento.
 * @param {string} recipeId - ID della ricetta
 * @param {string} note - Testo della nota aggiornata
 * @returns {Promise<boolean>} True se modificata con successo, false altrimenti
 */
async function updateNote(recipeId, note)
{
    try { await apiRequest("PATCH", `/cookbook/${recipeId}`, { note }); return true; }
    catch { return false; }
}

///////////////////////
//////Recensioni///////
///////////////////////

/**
 * Recupera le recensioni salvate.
 * Se passo recipeId mi restituisce solo quelle della ricetta specifica,
 * altrimenti mi restituisce tutte le recensioni della community.
 * @param {string} [recipeId] - ID opzionale per filtrare su una singola ricetta
 * @returns {Promise<Array>} Lista delle recensioni trovate
 */
async function getReviews(recipeId)
{
    try
    {
        const path = recipeId ? `/reviews?recipeId=${recipeId}` : "/reviews";
        return await apiRequest("GET", path);
    } catch { return []; }
}

/**
 * Recupera esclusivamente le recensioni lasciate dall'utente loggato.
 * Il backend ricava l'utente dal JWT senza bisogno di passare l'id nell'URL.
 * @returns {Promise<Array>} Elenco delle recensioni personali
 */
async function getMyReviews()
{
    try { return await apiRequest("GET", "/reviews/mine"); }
    catch { return []; }
}

/**
 * Invia una nuova recensione al backend per una specifica ricetta.
 * Non metto il try/catch qui per far propagare l'errore alla UI
 * (es. se l'utente ha già recensito la ricetta riceve 409 Conflict).
 * @param {string} recipeId - ID TheMealDB della ricetta
 * @param {string} mealName - Nome della ricetta
 * @param {string} date - Data di preparazione in formato stringa
 * @param {number} difficulty - Difficoltà su scala 1-5
 * @param {number} taste - Valutazione gusto su scala 1-5
 * @returns {Promise<Object>} La recensione appena creata
 */
async function addReview(recipeId, mealName, date, difficulty, taste)
{
    return apiRequest("POST", "/reviews", { recipeId, mealName, date, difficulty, taste });
}

/**
 * Elimina una recensione specifica dell'utente.
 * Il backend verifica che l'autore della recensione sia effettivamente l'utente loggato.
 * @param {string} id - ID MongoDB (_id) del documento Review
 * @returns {Promise<boolean>} True se eliminata con successo, false altrimenti
 */
async function deleteReview(id)
{
    try { await apiRequest("DELETE", `/reviews/${id}`); return true; }
    catch { return false; }
}