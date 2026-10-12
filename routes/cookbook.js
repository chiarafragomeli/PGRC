//////////////////////////////////////////////////////////////
///////////////////Route per il ricettario////////////////////
//////////////////////////////////////////////////////////////
//gestisce gli endpoint per le ricette salvate dagli utenti (/api/cookbook). Tutte le rotte sono protette dal middleware requireAuth, garantendo che ogni utente possa leggere o modificare solo il proprio ricettario (tramite req.user._id).

const express = require("express");
const Cookbook = require("../models/Cookbook");
const requireAuth = require("../middleware/auth");

const router = express.Router();

///////////////////////////
///Elenco ricette salvate//
///////////////////////////

/**
 * GET /api/cookbook
 * Restituisce tutte le ricette salvate dall'utente loggato.
 * Vengono ordinate per data di aggiunta decrescente (le più recenti in cima).
 */
router.get("/", requireAuth, async (req, res) =>
{
  try
  {
    const entries = await Cookbook.find({ userId: req.user._id }).sort({ addedAt: -1 });
    res.json(entries);
  } catch (err)
  {
    res.status(500).json({ error: "Errore del server." });
  }
});

/////////////////////////////
///Aggiunta al ricettario////
/////////////////////////////

/**
 * POST /api/cookbook
 * Salva una nuova ricetta nel ricettario personale dell'utente.
 * Salva i metadati denormalizzati (nome, categoria, cucina, thumb) per evitare
 * di dover richiamare l'API esterna ogni volta che si apre la pagina del ricettario.
 */
router.post("/", requireAuth, async (req, res) =>
{
  try
  {
    const { recipeId, mealName, category, area, thumb, note } = req.body;

    if (!recipeId || !mealName)
    {
      return res.status(400).json({ error: "recipeId e mealName obbligatori." });
    }

    const entry = await Cookbook.create({
      userId: req.user._id,
      recipeId,
      mealName,
      category: category || "",
      area: area || "",
      thumb: thumb || "",
      note: note || ""
    });

    res.status(201).json(entry);
  } catch (err)
  {
    //l'indice composto { userId: 1, recipeId: 1 } impedisce duplicati: se violato restituisce 11000
    if (err.code === 11000)
    {
      return res.status(409).json({ error: "Ricetta già nel ricettario." });
    }
    res.status(500).json({ error: "Errore del server." });
  }
});

/////////////////////////////
///Modifica nota personale///
/////////////////////////////

/**
 * PATCH /api/cookbook/:recipeId
 * Aggiorna parzialmente la voce del ricettario (ad esempio la nota personale).
 * Si usa PATCH per aggiornare solo i campi forniti senza sovrascrivere l'intero documento.
 */
router.patch("/:recipeId", requireAuth, async (req, res) =>
{
  try
  {
    //consento solo l'aggiornamento di questi campi per sicurezza
    const allowed = ["note", "category", "area", "thumb", "mealName"];
    const update = {};

    for (let i = 0; i < allowed.length; i++)
    {
      const field = allowed[i];
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    //cerco la ricetta usando sia il recipeId sia lo userId per evitare che un utente modifichi i dati di altri
    const entry = await Cookbook.findOneAndUpdate(
      { userId: req.user._id, recipeId: req.params.recipeId },
      update,
      { new: true }
    );

    if (!entry) return res.status(404).json({ error: "Ricetta non trovata nel ricettario." });
    res.json(entry);
  } catch (err)
  {
    res.status(500).json({ error: "Errore del server." });
  }
});

/////////////////////////////
///Rimozione dal ricettario//
/////////////////////////////

/**
 * DELETE /api/cookbook/:recipeId
 * Rimuove una ricetta salvata dal ricettario dell'utente corrente.
 */
router.delete("/:recipeId", requireAuth, async (req, res) =>
{
  try
  {
    //filtro per userId e recipeId così solo il proprietario può cancellare la voce
    const result = await Cookbook.findOneAndDelete({
      userId: req.user._id,
      recipeId: req.params.recipeId
    });

    if (!result) return res.status(404).json({ error: "Ricetta non trovata nel ricettario." });
    res.json({ message: "Ricetta rimossa." });
  } catch (err)
  {
    res.status(500).json({ error: "Errore del server." });
  }
});

module.exports = router;