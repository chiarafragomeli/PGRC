////////////////////////////////////////////////////////////
/////////////////////View del modulo di contatto/////////////////////
////////////////////////////////////////////////////////////
//questo è un modulo fittizio, al submit, simula un invio nascondendo il form e mostrando un messaggio di conferma.

function contactView() {
    return `
    <div class="row justify-content-center my-5">
      <div class="col-md-6 col-lg-5">
        <h2 class="page-title">Contatti</h2>
        <p class="mb-4" style="color:var(--brown-mid); font-size:.95rem; line-height:1.6;">
          Hai domande, suggerimenti o vuoi segnalare un problema? Scrivici.
        </p>
        <div class="card card-auth p-5">
          <div id="contact-success" class="alert alert-success d-none">
            Messaggio inviato! Ti risponderemo al più presto.
          </div>
          <form id="contact-form" onsubmit="handleContact(event)">
            <div class="mb-3">
              <label class="form-label">Nome <span class="text-danger">*</span></label>
              <input type="text" id="contact-name" class="form-control" placeholder="Il tuo nome" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Email <span class="text-danger">*</span></label>
              <input type="email" id="contact-email" class="form-control" placeholder="tua@email.com" required>
            </div>
            <div class="mb-4">
              <label class="form-label">Messaggio <span class="text-danger">*</span></label>
              <textarea id="contact-message" class="form-control" rows="5"
                placeholder="Scrivi qui il tuo messaggio..." required></textarea>
            </div>
            <button type="submit" class="btn-auth">Invia messaggio</button>
          </form>
        </div>
      </div>
    </div>`;
}

function handleContact(event) {
    event.preventDefault(); 
    //blocca il submit nativo del browser
    document.getElementById("contact-form").style.display = "none";
    document.getElementById("contact-success").classList.remove("d-none");
}