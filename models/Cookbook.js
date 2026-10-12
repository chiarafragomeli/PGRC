//////////////////////////////////////////////////////////////
//////////////Schema per il ricettario personale//////////////
//////////////////////////////////////////////////////////////
//un documento Cookbook rappresenta una ricetta salvata da un utente nel proprio ricettario personale. I dati della ricetta (nome, categoria, ecc.) sono denormalizzati, cioè copiati dall'API TheMealDB direttamente nel documento, invece di essere recuperati ogni volta.

const mongoose = require("mongoose");

const CookbookSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipeId: { type: String, required: true },
  mealName: { type: String, required: true },
  category: { type: String, default: "" },
  area: { type: String, default: "" },
  thumb: { type: String, default: "" },
  note: { type: String, default: "" },
  addedAt: { type: Date, default: Date.now }
});

CookbookSchema.index({ userId: 1, recipeId: 1 }, { unique: true });
//questo indice serve per non permettere che un utente salvi due volte la stessa ricetta -> in caso di inserimento duplicato MongoDB restituisce 11000 e l'handler risponde con 409 Conflict

module.exports = mongoose.model("Cookbook", CookbookSchema);