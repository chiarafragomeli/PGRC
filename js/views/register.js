////////////////////////////////////////////////////////////////
/////////////////View del form di registrazione/////////////////
////////////////////////////////////////////////////////////////
//questo file gestisce la creazione di un nuovo account utente. Implementa la validazione lato client prima di inviare al server, per ridurre le richieste HTTP non necessarie. Il backend valida sempre i dati in modo indipendente.

function registerView()
{
  return `
    <div class="row justify-content-center mt-3 mb-5">
      <div class="col-md-6 col-lg-5">
        <div class="card card-auth p-5">
          <h4>Crea un account</h4>

          <div id="register-error" class="alert alert-danger d-none"></div>

          <form onsubmit="handleRegister(event)">
            <div class="mb-3">
              <label class="form-label">Nome e cognome <span class="text-danger">*</span></label>
              <input type="text" id="reg-username" class="form-control" placeholder="Inserisci il tuo nome completo"
                oninput="clearFieldError('reg-username')">
              <div id="err-username" class="search-error d-none">Inserisci il tuo nome.</div>
            </div>

            <div class="mb-3">
              <label class="form-label">Email <span class="text-danger">*</span></label>
              <input type="email" id="reg-email" class="form-control" placeholder="tua@email.com"
                oninput="clearFieldError('reg-email')">
              <div id="err-email" class="search-error d-none">Inserisci un'email valida.</div>
            </div>

            <div class="mb-3">
              <label class="form-label">Password <span class="text-danger">*</span></label>
              <input type="password" id="reg-password" class="form-control" placeholder="Crea una password"
                oninput="clearFieldError('reg-password')">
              <div id="err-password" class="search-error d-none">La password deve essere di almeno 6 caratteri.</div>
            </div>

            <div class="mb-3">
              <label class="form-label">Conferma Password <span class="text-danger">*</span></label>
              <input type="password" id="reg-confirm" class="form-control" placeholder="Ripeti la password"
                oninput="clearFieldError('reg-confirm')">
              <div id="err-confirm" class="search-error d-none">Le password non coincidono.</div>
            </div>

            <div class="mb-4">
              <label class="form-label">Categorie preferite <span class="text-muted small">(opzionale)</span></label>
              <div id="category-chips" class="chips-wrap mt-2">
                <div class="spinner-border spinner-border-sm" role="status"></div>
              </div>
            </div>

            <button type="submit" class="btn-auth">Registrati</button>
          </form>

          <p class="auth-footer">
            Hai già un account? <a href="#/signin">Accedi</a>
          </p>
        </div>
      </div>
    </div>`;
}

async function registerInit()
{
  const cats = await getCategories();
  const wrap = document.getElementById("category-chips");
  if (!wrap) return;
  if (!cats || cats.length === 0)
  {
    wrap.innerHTML = '<span class="text-muted small">Categorie non disponibili.</span>';
    return;
  }

  wrap.innerHTML = cats.map(c =>
    `<span class="category-chip" data-cat="${c.strCategory}" onclick="toggleChip(this)">${c.strCategory}</span>`
  ).join("");
  //genera un tag categoria
}

function toggleChip(el)
{
  el.classList.toggle("selected");
  //aggiunge o rimuove la classe selected dal tag categoria
}

function clearFieldError(id)
{
  //rimuove la segnalazione d'errore
  const el = document.getElementById(id);
  const err = document.getElementById("err-" + id.replace("reg-", ""));
  if (el) el.classList.remove("is-invalid");
  if (err) err.classList.add("d-none");
}

function showFieldError(id, msgId)
{
  const el = document.getElementById(id);
  const err = document.getElementById(msgId);
  if (el) el.classList.add("is-invalid");
  if (err) err.classList.remove("d-none");
  return false;
}

async function handleRegister(event)
{
  event.preventDefault();

  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;
  const errorDiv = document.getElementById("register-error");
  errorDiv.classList.add("d-none");

  const selectedChips = document.querySelectorAll(".category-chip.selected");
  const favorites = [];
  for (let i = 0; i < selectedChips.length; i++)
  {
    favorites.push(selectedChips[i].dataset.cat);
  }

  let valid = true;
  if (!username) { showFieldError("reg-username", "err-username"); valid = false; }
  if (!email) { showFieldError("reg-email", "err-email"); valid = false; }
  if (password.length < 6) { showFieldError("reg-password", "err-password"); valid = false; }
  if (password !== confirm) { showFieldError("reg-confirm", "err-confirm"); valid = false; }
  if (!valid) return;

  const result = await registerUser(username, email, password, favorites);

  if (result.success)
  {
    navigate("/");
  } else
  {
    errorDiv.textContent = result.error;
    errorDiv.classList.remove("d-none");
  }
}