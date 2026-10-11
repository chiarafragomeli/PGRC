//////////////////////////////////////////////////////////////
/////////////////Middleware di autenticazione/////////////////
//////////////////////////////////////////////////////////////
//questo middleware implementa il bearer token su HTTP: il client include un JWT nell'header authorization di ogni richiesta protetta e il middleware lo verifica prima di passare il controllo alla route successiva.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function requireAuth(req, res, next)
{
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
  {
    return res.status(401).json({ error: "Non autenticato." });
    //verifico che l'header esiste e che inizia con "Bearer " -> se non esiste interrompo tutto
  }

  const token = header.slice(7);
  //rimuove il prefisso "Bearer " per estrarre solo il token
  let payload;
  try
  {
    payload = jwt.verify(token, process.env.JWT_SECRET);
    //questa funzione verifica la firma hmac con jwt_secret e controlla la scadenza
  } catch
  {
    //jsonwebtoken error: firma non valida (token falsificato o corrotto)
    //token expired error: token scaduto (l'utente deve rifare il login)
    return res.status(401).json({ error: "Token non valido o scaduto." });
  }

  let user;
  try
  {
    user = await User.findById(payload.userId).select("-passwordHash");
    //verifico che l'utente esista ancora nel database e non sia stato eliminato dopo l'emissione del token -> uso select("-passwordHash") con proiezione negativa in mongodb perché non voglio che l'hash giri
  } catch
  {
    return res.status(500).json({ error: "Errore del server." });
  }
  if (!user) return res.status(401).json({ error: "Utente non trovato." });

  req.user = user;
  //convenzione di express per rendere l'utente autenticato disponibile a tutti i middleware e route handler successivi
  next();
  //il controllo passa al prossimo middleware/route handler
};