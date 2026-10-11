//////////////////////////////////////////////////////////////
///////////////////Schema per le recensioni///////////////////
//////////////////////////////////////////////////////////////
//un documento Review rappresenta la recensione che un utente lascia a una ricetta. Il vincolo fondamentale è che un utente può recensire la stessa ricetta al massimo una volta, perciò si è implementato un indice composto univoco.

const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipeId: { type: String, required: true },
  mealName: { type: String, required: true },
  date: { type: String, required: true },
  difficulty: { type: Number, min: 1, max: 5, required: true },
  taste: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now }
});

ReviewSchema.index({ userId: 1, recipeId: 1 }, { unique: true });
//questo indice serve a garantire che l'utente possa recensire solo una ricetta alla volta. è costruito su due campi, userId: 1 e recipeId: 1 che vengono indicizzati come un'unica chiave. unique: true impone il vincolo, cioè che non possano esistere due documenti con la stessa coppia userId, recipeId.

module.exports = mongoose.model("Review", ReviewSchema);