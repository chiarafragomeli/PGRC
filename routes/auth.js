//////////////////////////////////////////////////////////////
////////////////Route di autenticazione e profilo/////////////
//////////////////////////////////////////////////////////////
//gestisce gli endpoint per la registrazione, il login e il profilo utente (/api/auth) Utilizza JWT per rilasciare il token di autenticazione e bcrypt per cifrare le password.

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();

/**
 * Genera un token JWT firmato per un determinato utente.
 * Viene impostata una scadenza a 7 giorni (7d).
 * @param {string} userId - ID dell'utente da includere nel payload
 * @returns {string} Token firmato con la chiave segreta
 */
function makeToken(userId)
{
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

///////////////////
///Registrazione///
///////////////////

/**
 * POST /api/auth/register
 * Crea un nuovo account nel database.
 * Riceve username, email, password e piatti/categorie preferite opzionali.
 * Prima controlla se l'email è già in uso per restituire un errore chiaro,
 * poi salva l'utente (l'hash della password viene gestito automaticamente dall'hook in User.js)
 * ed emette subito il token JWT per completare l'accesso.
 */
router.post("/register", async (req, res) =>
{
  try
  {
    const { username, email, password, favoriteDishes } = req.body;

    if (!username || !email || !password)
    {
      return res.status(400).json({ error: "Campi obbligatori mancanti." });
    }
    if (password.length < 6)
    {
      return res.status(400).json({ error: "La password deve essere di almeno 6 caratteri." });
    }

    //normalizzo l'email per evitare duplicati con maiuscole/minuscole
    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists)
    {
      return res.status(409).json({ error: "Esiste già un account con questa email." });
    }

    const user = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      passwordHash: password,
      favoriteDishes: favoriteDishes || []
    });

    res.status(201).json({
      token: makeToken(user._id),
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err)
  {
    //se c'è una collisione sull'indice unique di mongodb restituisco 409
    if (err.code === 11000)
    {
      return res.status(409).json({ error: "Esiste già un account con questa email." });
    }
    res.status(500).json({ error: "Errore del server." });
  }
});

//////////////////////
////////Login/////////
//////////////////////

/**
 * POST /api/auth/login
 * Autentica l'utente tramite email e password.
 * Se le credenziali sono corrette restituisce un token JWT e i dati del profilo.
 */
router.post("/login", async (req, res) =>
{
  try
  {
    const { email, password } = req.body;
    if (!email || !password)
    {
      return res.status(400).json({ error: "Email e password obbligatorie." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    //uso un controllo unico con verifyPassword (bcrypt.compare) e restituisco un messaggio generico
    if (!user || !(await user.verifyPassword(password)))
    {
      return res.status(401).json({ error: "Credenziali non valide." });
    }

    res.json({
      token: makeToken(user._id),
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err)
  {
    res.status(500).json({ error: "Errore del server." });
  }
});

//////////////////////
////Profilo utente////
//////////////////////

/**
 * GET /api/auth/me
 * Restituisce le informazioni dell'utente autenticato per ripristinare la sessione lato client.
 * Richiede il token (middleware requireAuth).
 */
router.get("/me", requireAuth, (req, res) =>
{
  //req.user è già stato valorizzato da requireAuth dopo aver verificato il JWT
  res.json({ id: req.user._id, username: req.user.username, email: req.user.email });
});

/**
 * PUT /api/auth/me
 * Modifica username o password dell'utente.
 * Invia solo i campi che sono stati compilati. Se l'utente aggiorna la password,
 * viene hashata manualmente con bcrypt prima di aggiornare il documento.
 */
router.put("/me", requireAuth, async (req, res) =>
{
  try
  {
    const { username, password } = req.body;
    const update = {};

    if (username) update.username = username.trim();

    if (password)
    {
      if (password.length < 6)
      {
        return res.status(400).json({ error: "La password deve essere di almeno 6 caratteri." });
      }
      //poiché findByIdAndUpdate salta l'hook pre('save'), calcolo l'hash direttamente qui con bcrypt
      const bcrypt = require("bcryptjs");
      update.passwordHash = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    if (!user) return res.status(404).json({ error: "Utente non trovato." });

    res.json({ id: user._id, username: user.username, email: user.email });
  } catch (err)
  {
    res.status(500).json({ error: "Errore del server." });
  }
});

/**
 * DELETE /api/auth/me
 * Elimina definitivamente l'account dell'utente corrente.
 * Per non lasciare dati orfani nel database effettuo l'eliminazione a cascata
 * rimuovendo sia il suo ricettario sia le sue recensioni tramite Promise.all.
 */
router.delete("/me", requireAuth, async (req, res) =>
{
  try
  {
    const userId = req.user._id;

    const Cookbook = require("../models/Cookbook");
    const Review = require("../models/Review");

    //elimino in parallelo tutte le risorse collegate all'utente prima di cancellare l'account
    await Promise.all([
      Cookbook.deleteMany({ userId }),
      Review.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    res.json({ message: "Account eliminato." });
  } catch (err)
  {
    res.status(500).json({ error: "Errore del server." });
  }
});

module.exports = router;