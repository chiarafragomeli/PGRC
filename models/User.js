//////////////////////////////////////////////////////////////
////////////////Schema Mongoose per gli utenti////////////////
//////////////////////////////////////////////////////////////
//un documento User rappresenta l'utente registrato. Questo documento gestisce:
//    - struttura e validazione dei dati utente;
//    - hashing automatico della password con bcrypt;
//    - verifica della password al login.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  //questo campo non contiene mai la password in chiaro, ma solo l'hash.
  favoriteDishes: { type: [String], default: [] },
  //poiché nel form di registrazione il campo è opzionale, viene dichiarato un array di stringhe di default a lista vuota, così se il campo non è fornito alla creazione del documento viene creato vuoto in automatico.
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre("save", async function (next)
{
  //hook pre-save per l'hashing della password -> un hook è una funzione che viene eseguita prima o dopo operazioni specifiche, qui vogliamo che sia eseguita prima del salvataggio della password.
  if (!this.isModified("passwordHash")) return next();
  //isModified() viene usato quando l'utente entra nelle impostazioni per cambiare i dati di accesso. Per esempio, se viene cambiato solo il nome utente e non la password è inutile ricalcolare l'hash che già abbiamo.
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  //il campo passwordHash viene sovrascritto con il risultato dell'hash prima che venga salvato sul db, così la password non appare in chiaro da alcuna parte.
  next();
});

//per la verifica della password al momento dell'autenticazione si è implementato il metodo di istanza verifyPassword.
UserSchema.methods.verifyPassword = function (plainPassword)
{
  return bcrypt.compare(plainPassword, this.passwordHash);
  //per verificare la correttezza della password inserita non vengono confrontate le password hashate (quella inserita e quella salvata nel db), ma viene usata la funzione bcrypt.compare per ragioni di sicurezza.
};

module.exports = mongoose.model("User", UserSchema);