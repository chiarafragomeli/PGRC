////////////////////////////////////////////////////////////
/////////////////////////Router SPA/////////////////////////
////////////////////////////////////////////////////////////

////////////////////////
///Tabella di routing///
////////////////////////

const routes = {
    "/": homeView,
    "/login": loginView,
    "/signin": signinView,
    "/register": registerView,
    "/search": searchView,
    "/cookbook": cookbookView,
    "/reviews": reviewsView,
    "/settings": settingsView,
    "/contact": contactView,
    "/recipe": recipeView
};

const protectedRoutes = ["/cookbook", "/reviews", "/settings"];

const noNavbarRoutes = ["/login", "/register", "/signin"];

/////////////////////
/////Navigazione/////
/////////////////////

/**
 * Permette di cambiare rotta da codice modificando l'hash della pagina.
 * Scatena in automatico l'evento hashchange gestito dal browser.
 * @param {string} path - Percorso hash di destinazione (es. "/cookbook")
 */
function navigate(path)
{
    window.location.hash = path;
}

//////////////////////
//////Rendering///////
//////////////////////

/**
 * Controller principale del router. Viene invocata a ogni cambio di hash o al caricamento della pagina.
 * Si occupa di:
 * 1. Estrarre il percorso base ed eventuali parametri (es. l'id in #/recipe/52772)
 * 2. Verificare se la rotta è protetta e se l'utente è loggato
 * 3. Fermare timer attivi della vista precedente (es. autoplay carosello 3D)
 * 4. Iniettare l'HTML della funzione view nel contenitore #app
 * 5. Invocare la corrispondente funzione init per il caricamento asincrono dei dati
 * 6. Riportare lo scroll in cima e aggiornare la barra di navigazione
 */
function render()
{
    const hash = window.location.hash.slice(1) || "/";
    const parts = hash.split("/").filter(Boolean);
    const basePath = "/" + (parts[0] || "");
    const param = parts[1] || null;

    if (protectedRoutes.includes(basePath) && !isLoggedIn())
    //controllo UX per rotte protette (il vero controllo di sicurezza è nei token del backend)
    {
        navigate("/login");
        return;
    }

    if (typeof _c3dStopAutoplay === "function") _c3dStopAutoplay();
    //se sto navigando via dalla homepage fermo l'autoplay del carosello 3D per non sprecare risorse

    const viewFn = routes[basePath];
    const app = document.getElementById("app");

    if (viewFn)
    {
        app.innerHTML = param ? viewFn(param) : viewFn();

        const routeName = basePath === "/" ? "home" : basePath.slice(1);
        
        /**
         * Associa il nome della pagina alla rispettiva funzione di inizializzazione asincrona.
         * @param {string} view - Nome della rotta corrente
         * @param {string|null} arg - Eventuale parametro ID (per la scheda ricetta)
         */
        function initView(view, arg)
        {
            switch (view)
            {
                case 'home':
                    if (typeof homeInit === 'function') homeInit();
                    break;
                case 'search':
                    if (typeof searchInit === 'function') searchInit();
                    break;
                case 'recipe':
                    if (typeof recipeInit === 'function') recipeInit(arg);
                    break;
                case 'login':
                    if (typeof loginInit === 'function') loginInit();
                    break;
                case 'signin':
                    if (typeof signinInit === 'function') signinInit();
                    break;
                case 'register':
                    if (typeof registerInit === 'function') registerInit();
                    break;
                case 'cookbook':
                    if (typeof cookbookInit === 'function') cookbookInit();
                    break;
                case 'reviews':
                    if (typeof reviewsInit === 'function') reviewsInit();
                    break;
                case 'settings':
                    if (typeof settingsInit === 'function') settingsInit();
                    break;
                case 'contact':
                    if (typeof contactInit === 'function') contactInit();
                    break;
                default:
                    console.error("Errore: la pagina " + view + " non esiste.");
            }
        }
        initView(routeName, param);
    }

    window.scrollTo(0, 0);
    updateNavbar(basePath);
}

/////////////////////////////////////////
///Aggiornamento dinamico della navbar///
/////////////////////////////////////////

/**
 * Aggiorna l'aspetto visivo della barra di navigazione in base alla rotta e allo stato di login:
 * 1. Nasconde la navbar nelle schermate di autenticazione/registrazione
 * 2. Mostra #nav-guest (Accedi/Registrati) oppure #nav-user (menu a tendina col nome utente)
 * 3. Evidenzia con la classe nav-link-active il link corrispondente alla pagina corrente
 * @param {string} basePath - Percorso base attivo (es. "/search")
 */
function updateNavbar(basePath)
{
    const navbar = document.querySelector("nav.navbar");
    const app = document.getElementById("app");

    if (noNavbarRoutes.includes(basePath))
    {
        if (navbar) navbar.style.display = "none";
        if (app) app.style.paddingTop = "1rem";
    }
    else 
    {
        if (navbar) navbar.style.display = "";
        if (app) app.style.paddingTop = "";
    }

    const logged = isLoggedIn();
    const session = getSession();
    
    const navGuest = document.getElementById("nav-guest");
    const navUser = document.getElementById("nav-user");
    
    if (navGuest) navGuest.style.display = logged ? "none" : "";
    if (navUser) navUser.style.display = logged ? "" : "none";

    if (logged && session)
    {
        const navUsername = document.getElementById("nav-username");
        if (navUsername) navUsername.textContent = session.username;
    }

    if (navbar)
    {
        navbar.querySelectorAll("a.nav-link").forEach(l =>
        {
            l.classList.remove("nav-link-active");
            l.removeAttribute("aria-current");
        });

        const activeLink = navbar.querySelector(`a.nav-link[href="#${basePath}"]`);
        if (activeLink)
        {
            activeLink.classList.add("nav-link-active");
            activeLink.setAttribute("aria-current", "page");
        }
    }
}

///////////////////////////////////
///Registrazione eventi listener///
///////////////////////////////////

window.addEventListener("hashchange", render);
window.addEventListener("load", render);

//////////////////////
////////Logout////////
//////////////////////

/**
 * Gestisce il logout dell'utente.
 * Pulisce la sessione locale e reindirizza con ricaricamento completo alla landing page.
 */
function handleLogout()
{
    clearSession();
    window.location.href = "landing.html";
}