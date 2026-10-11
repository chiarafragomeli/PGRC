///////////////////////////////////////////////
//view delle recensioni personali dell'utente//
///////////////////////////////////////////////

function reviewsView()
{
  return `
    <div class="mt-2">
      <h2 class="section-title mb-4">Le mie recensioni</h2>
      <!-- Container con spinner: reviewsInit() sostituirà questo contenuto
           con la lista delle recensioni o un messaggio vuoto. -->
      <div id="my-reviews-container">
        <div class="text-center py-4"><div class="spinner-border" role="status"></div></div>
      </div>
    </div>`;
}

async function reviewsInit()
{
  const reviews = await getMyReviews();
  const container = document.getElementById("my-reviews-container");
  if (!container) return;

  if (reviews.length === 0)
  {
    container.innerHTML = '<p class="text-muted">Non hai ancora lasciato nessuna recensione. <a href="#/search">Cerca una ricetta</a> e lascia il tuo voto!</p>';
    return;
  }

  //clono l'array per non mutare i dati originali e ordino per data decrescente
  const sorted = reviews.slice();
  sorted.sort(function(a, b)
  {
    return new Date(b.date) - new Date(a.date);
  });

  let html = "";
  for (let i = 0; i < sorted.length; i++)
  {
    const r = sorted[i];
    html += `
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title mb-1">
              <a href="#/recipe/${r.recipeId}" class="text-decoration-none" style="color:var(--brown-dark)">
                ${escapeHTML(r.mealName || r.recipeId)}
              </a>
            </h5>
            <div class="text-muted small mb-2">${escapeHTML(r.date)}</div>
            <div class="d-flex gap-3">
              <span>Difficoltà: ${renderStars(r.difficulty)}</span>
              <span>Gusto: ${renderStars(r.taste)}</span>
            </div>
          </div>
        </div>`;
  }
  container.innerHTML = html;
}