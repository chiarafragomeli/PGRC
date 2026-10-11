//////////////////////////////////////////////////////////////
//////////////Ingresso dell'applicazione backend//////////////
//////////////////////////////////////////////////////////////
//configurazione Express con i middleware globali;
// servire il frontend come file statici;
//registrazione delle route dell'api rest;
//implementazione dello SPA fallback;
//connessione a mongodb e avvio del server

require("dotenv").config();
//lettura del file .env per iniettare le variabili in process.env
//NB! Prima operazione da fare per mettere a disposizione le variabili d'ambiente nel processo
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

////////////////////////
///Middleware globali///
////////////////////////

app.use(cors());
app.use(express.json());
//questi due middleware devono precedere le route api perché queste devono già trovare le intestazioni cors req.body popolato

////////////////////////////////////////////
///Gestione dei file statici del frontend///
////////////////////////////////////////////

app.get("/index.html", function(req, res) {
  res.redirect(301, "/");
});
//redirect che evita che la spa sia raggiungibile da / e /index.html insieme per evitare problemi di instradamento e cache

app.use(express.static(path.join(__dirname)));

////////////////////
///Route api rest///
////////////////////

app.use("/api/auth", require("./routes/auth"));
app.use("/api/cookbook", require("./routes/cookbook"));
app.use("/api/reviews", require("./routes/reviews"));
//tutte le richieste che iniziano con il dato prefisso vengono incaricate al router corrispondente che gestisce i metodi http specifici

//////////////////
///SPA fallback///
//////////////////
//qui viene gestito il caso in cui l'utente ricarica la pagina o copia e incolla il link in una nuova scheda
app.use('/api/*', function(req, res) {
    res.status(404).json({ error: "Endpoint API non trovato" });
});

app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname,'index.html'));
});

////////////////////////////////////////////
///Connessione MongoDB e avvio del server///
////////////////////////////////////////////

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
  {
    console.log("MongoDB connesso.");
    app.listen(PORT, () => console.log(`Server avviato su http://localhost:${PORT}`));
  })
  .catch(err =>
  {
    console.error("Errore connessione MongoDB:", err.message);
    process.exit(1);
  });