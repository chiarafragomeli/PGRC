//////////////////////////////////////////////////////////////
///View per la scelta login/registrazione e form di accesso///
//////////////////////////////////////////////////////////////
//questo file gestisce due view distinte: loginView() -> schermata split "Hai già un account? / Vuoi unirti?"; signinView() -> il vero form di login con email e password. Contiene anche il pannello di recupero password (fittizio).

function loginView()
{
  return `
    <div class="row g-0 login-split-panel">
      <div class="col-md-6 login-panel-green d-flex flex-column justify-content-between">
        <h2 class="login-panel-title">CIAO! HAI GIÀ UN ACCOUNT?</h2>
        <div>
          <a href="#/signin" class="btn-login-light w-100 text-center d-block">
            Accedi →
          </a>
        </div>
      </div>
      <div class="col-md-6 login-panel-beige d-flex flex-column justify-content-between">
        <h2 class="login-panel-title login-panel-title--green">VUOI UNIRTI ALLA COMMUNITY?</h2>
        <div>
          <a href="#/register" class="btn-login-green w-100 text-center d-block">
            Registrati →
          </a>
        </div>
      </div>
    </div>`;
}

function signinView()
{
  return `
    <div class="row justify-content-center my-5">
      <div class="col-md-5 col-lg-4">
        <div class="card card-auth p-5">
          <h4>Accedi</h4>

          <div id="login-error" class="alert alert-danger d-none"></div>

          <form onsubmit="handleLogin(event)">
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" id="login-email" class="form-control" placeholder="tua@email.com" required>
            </div>
            <div class="mb-4">
              <label class="form-label">Password</label>
              <input type="password" id="login-password" class="form-control" placeholder="La tua password" required>
            </div>
            <button type="submit" class="btn-auth">Accedi</button>
          </form>

          <p class="auth-footer">
            Non hai un account? <a href="#/register">Registrati</a>
          </p>
          <p class="auth-footer">
            <a href="#" onclick="showForgotPassword(event)">Hai dimenticato la password?</a>
          </p>

          <div id="forgot-panel" class="d-none mt-3 pt-3 border-top">
            <p class="form-label mb-2">Inserisci la tua email di iscrizione e ti invieremo le istruzioni per il recupero.</p>
            <div class="mb-3">
              <input type="email" id="forgot-email" class="form-control" placeholder="tua@email.com">
            </div>
            <button class="btn-auth" onclick="handleForgotPassword()">Recupero password</button>
            <div id="forgot-success" class="alert alert-success mt-3 d-none">
              Email inviata! Controlla la tua casella di posta.
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function showForgotPassword(event)
{
  event.preventDefault(); //blocca lo scroll causato da <a href="#">
  const panel = document.getElementById("forgot-panel");
  if (panel) panel.classList.toggle("d-none");
}

function handleForgotPassword()
{
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) return;
  document.getElementById("forgot-success").classList.remove("d-none");
  document.getElementById("forgot-email").disabled = true;//previene invii multipli
}

async function handleLogin(event)
{
  //gestisce il submit del form di accesso: coordina la lettura dei valori del form, la chiamata asincrona al backend e la navigazione (con visualizzazione dell'errore)
  event.preventDefault();
  //impedisce al browser di ricaricare la pagina al submit del form.Senza la SPA verrebbe resettata ad ogni tentativo di login

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorDiv = document.getElementById("login-error");

  const result = await loginUser(email, password);

  if (result.success)
  {
    navigate("/");
    //se login riuscito -> token è già salvato in localStorage, naviga alla home
  } else
  {
    errorDiv.textContent = result.error;
    //login fallito -> mostra messaggio errore
    errorDiv.classList.remove("d-none");
  }
}