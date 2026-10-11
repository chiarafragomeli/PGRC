//////////////////////////////////////////////////////////////
///////////////////Route per le recensioni////////////////////
//////////////////////////////////////////////////////////////
//gestisce gli endpoint per la consultazione e la pubblicazione delle recensioni (/api/reviews). Permette la lettura pubblica delle recensioni e protegge le operazioni di scrittura/cancellazione.

const express = require("express");
const Review = require("../models/Review");
const requireAuth = require("../middleware/auth");

const router = express.Router();

/**
 * Funzione helper per formattare il documento della recensione.
 * Dopo aver fatto .populate('userId', 'username'), estrae lo username al primo livello
 * e mantiene l'id come stringa così il frontend può leggerlo direttamente.
 * @param {Object} r - Documento Mongoose della recensione
 * @returns {Object} Oggetto recensione formattato
 */
function flatten(r)
{
  const obj = r.toObject();
  let userId = "";
  let username = "Utente";

  if (r.userId && r.userId._id)
  {
    userId = r.userId._id.toString();
    username = r.userId.username || "Utente";
  } else if (r.userId)
  {
    userId = r.userId.toString();
  }

  obj.id = r._id.toString();
  obj.userId = userId;
  obj.username = username;

  return obj;
}

////////////////////////////////////
///Lettura recensioni (pubblica)////
////////////////////////////////////

/**
 * GET /api/reviews
 * Restituisce le recensioni salvate.
 * Se viene passato il parametro ?recipeId=... filtra solo per quella ricetta,
 * altrimenti restituisce tutte le recensioni della community.
 * Usa .populate('userId', 'username') per recuperare il nome dell'autore dalla collezione Users.
 */
router.get("/", async (req, res) =>
{
  try
  {
    const filter = {};
    if (req.query.recipeId) filter.recipeId = req.query.recipeId;

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "username");

    res.json(reviews.map(flatten));
  } catch (err)
  {
    res.status(500).json({ error: "Errore del server." });
  }
});

////////////////////////////////////
///Recensioni personali utente//////
////////////////////////////////////

/**
 * GET /api/reviews/mine
 * Restituisce esclusivamente le recensioni lasciate dall'utente autenticato.
 * Richiede il token per estrarre req.user._id.
 */
router.get("/mine", requireAuth, async (req, res) =>
{
  try
  {
    const reviews = await Review.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "username");

    res.json(reviews.map(flatten));
  } catch (err)
  {
    res.status(500).json({ error: "Errore del server." });
  }
});

////////////////////////////////////
///Pubblicazione nuova recensione///
////////////////////////////////////

/**
 * POST /api/reviews
 * Crea una nuova recensione legandola all'utente autenticato.
 * Valida i campi obbligatori (recipeId, mealName, data, difficoltà e gusto tra 1 e 5).
 */
router.post("/", requireAuth, async (req, res) =>
{
  try
  {
    const { recipeId, mealName, date, difficulty, taste } = req.body;

    if (!recipeId || !mealName || !date || !difficulty || !taste)
    {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori." });
    }

    const created = await Review.create({
      userId: req.user._id,
      recipeId,
      mealName,
      date,
      difficulty: Number(difficulty),
      taste: Number(taste)
    });

    //faccio una seconda query con populate per restituire subito la recensione con il nome dell'autore
    const review = await Review.findById(created._id).populate("userId", "username");
    res.status(201).json(flatten(review));
  } catch (err)
  {
    //se c'è errore 11000 significa che l'utente ha già recensito questa ricetta (indice composto)
    if (err.code === 11000)
    {
      return res.status(409).json({ error: "Hai già recensito questa ricetta." });
    }
    res.status(500).json({ error: "Errore del server." });
  }
});

////////////////////////////////////
////////Elimina recensione//////////
////////////////////////////////////

/**
 * DELETE /api/reviews/:id
 * Elimina una recensione specifica dell'utente autenticato.
 * Filtra sia per _id sia per userId in modo che solo l'autore possa cancellarla.
 */
router.delete("/:id", requireAuth, async (req, res) =>
{
  try
  {
    const result = await Review.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!result) return res.status(404).json({ error: "Recensione non trovata." });
    res.json({ message: "Recensione eliminata." });
  } catch (err)
  {
    res.status(500).json({ error: "Errore del server." });
  }
});

module.exports = router;