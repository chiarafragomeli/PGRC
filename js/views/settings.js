/////////////////////////////////////////////////////////////
///////////////////View delle impostazioni///////////////////
/////////////////////////////////////////////////////////////

function settingsView() {
    return `
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h2 class="page-title">Impostazioni profilo</h2>

        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">Modifica dati</h5>
            <div id="settings-message"></div>
            <form onsubmit="handleUpdateProfile(event)">
              <div class="mb-3">
                <label class="form-label">Nome utente</label>
                <input type="text" id="set-username" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Nuova password <span class="text-muted small">(lascia vuoto per non cambiarla)</span></label>
                <input type="password" id="set-password" class="form-control" minlength="6">
              </div>
              <div class="mb-3">
                <label class="form-label">Conferma nuova password</label>
                <input type="password" id="set-confirm" class="form-control">
              </div>
              <button type="submit" class="btn btn-primary">Salva modifiche</button>
            </form>
          </div>
        </div>

        <div class="card border-danger">
          <div class="card-body">
            <h5 class="card-title text-danger">Elimina account</h5>
            <p class="text-muted small">Eliminando il profilo perderai il tuo ricettario e tutte le recensioni.</p>
            <button class="btn btn-danger" onclick="handleDeleteAccount()">Elimina account</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function settingsInit() {
    const session = getSession();
    if (!session) return;
    document.getElementById("set-username").value = session.username;
}

async function handleUpdateProfile(event) {
  //aggiorna solo ciò che è stato modificato
    event.preventDefault();

    const msgDiv   = document.getElementById("settings-message");
    const username = document.getElementById("set-username").value.trim();
    const password = document.getElementById("set-password").value;
    const confirm  = document.getElementById("set-confirm").value;

    if (password && password !== confirm) {
        msgDiv.innerHTML = `<div class="alert alert-danger">Le password non coincidono.</div>`;
        return;
    }

    const result = await updateUser({ username, password: password || undefined });

    if (!result.success) {
        msgDiv.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        return;
    }

    const _hash = window.location.hash.slice(1) || "/";
    const _base = "/" + (_hash.split("/").filter(Boolean)[0] || "");
    updateNavbar(_base);

    msgDiv.innerHTML = `<div class="alert alert-success">Profilo aggiornato.</div>`;
}

async function handleDeleteAccount() {
    if (!confirm("Vuoi davvero cancellare il tuo account? Perderai il tuo ricettario e tutte le recensioni.")) return;

    await deleteCurrentUser();

    window.location.href = "landing.html";
}