require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Cookbook = require("./models/Cookbook");
const Review = require("./models/Review");

const RECIPES = [
  { id: "52982", name: "Spaghetti Bolognese" },
  { id: "52960", name: "Pancakes" },
  { id: "52772", name: "Teriyaki Chicken Casserole" },
  { id: "52963", name: "Clam Chowder" },
  { id: "52959", name: "Bakewell Tart" },
  { id: "52864", name: "Smothered Chicken" },
  { id: "52771", name: "Spicy Arrabiata Penne" },
  { id: "52844", name: "Beef and Mustard Pie" },
  { id: "52940", name: "Brown Stew Chicken" },
  { id: "52885", name: "Grilled Mac and Cheese" },
  { id: "52907", name: "Honey Teriyaki Salmon" },
  { id: "52804", name: "Dal fry" },
  { id: "52834", name: "Chicken Hotpot" },
  { id: "52978", name: "Chicken Couscous" },
  { id: "52795", name: "Chicken Handi" },
];

const USER_DATA = [
  { username: "Marco Ferretti", email: "marco@example.com", favoriteDishes: ["Pasta", "Chicken"] },
  { username: "Giulia Ricci", email: "giulia@example.com", favoriteDishes: ["Dessert", "Seafood"] },
  { username: "Luca Bianchi", email: "luca@example.com", favoriteDishes: ["Beef", "Chicken"] },
  { username: "Sofia Esposito", email: "sofia@example.com", favoriteDishes: ["Seafood", "Pasta"] },
  { username: "Pietro Romano", email: "pietro@example.com", favoriteDishes: ["Beef", "Lamb"] },
  { username: "Anna Conti", email: "anna@example.com", favoriteDishes: ["Dessert", "Vegetarian"] },
  { username: "Carlo Mancini", email: "carlo@example.com", favoriteDishes: ["Chicken", "Pasta"] },
  { username: "Elena Lombardi", email: "elena@example.com", favoriteDishes: ["Seafood", "Salad"] },
  { username: "Davide Ferrari", email: "davide@example.com", favoriteDishes: ["Pasta", "Beef"] },
  { username: "Martina Russo", email: "martina@example.com", favoriteDishes: ["Dessert", "Pasta"] },
  { username: "Filippo Gallo", email: "filippo@example.com", favoriteDishes: ["Chicken", "Beef"] },
  { username: "Chiara Moretti", email: "chiara@example.com", favoriteDishes: ["Vegetarian", "Seafood"] },
  { username: "Alessandro Costa", email: "ale@example.com", favoriteDishes: ["Pasta", "Chicken"] },
  { username: "Valentina Bruno", email: "valentina@example.com", favoriteDishes: ["Dessert", "Salad"] },
  { username: "Simone Fontana", email: "simone@example.com", favoriteDishes: ["Beef", "Pasta"] },
  { username: "Francesca Rizzo", email: "francesca@example.com", favoriteDishes: ["Seafood", "Dessert"] },
  { username: "Matteo Greco", email: "matteo@example.com", favoriteDishes: ["Chicken", "Lamb"] },
  { username: "Laura De Luca", email: "laura@example.com", favoriteDishes: ["Pasta", "Vegetarian"] },
  { username: "Riccardo Marino", email: "riccardo@example.com", favoriteDishes: ["Beef", "Chicken"] },
  { username: "Federica Barbieri", email: "federica@example.com", favoriteDishes: ["Dessert", "Pasta"] },
];

const REVIEW_PLAN = [
  [0, 0, "2025-09-02", 2, 5], [0, 2, "2025-09-04", 3, 4], [0, 9, "2025-09-15", 1, 5],
  [0, 10, "2025-09-18", 3, 4], [0, 6, "2025-09-22", 2, 4],
  [1, 0, "2025-09-08", 3, 4], [1, 3, "2025-09-06", 2, 3], [1, 4, "2025-09-07", 4, 5],
  [1, 7, "2025-09-19", 4, 5], [1, 12, "2025-09-28", 3, 4],
  [2, 1, "2025-09-11", 1, 4], [2, 2, "2025-09-12", 4, 5], [2, 4, "2025-09-13", 4, 5],
  [2, 6, "2025-09-17", 2, 5], [2, 7, "2025-09-20", 5, 4],
  [3, 0, "2026-01-05", 2, 5], [3, 7, "2026-01-08", 4, 4], [3, 1, "2026-01-12", 1, 3],
  [3, 8, "2026-01-15", 3, 4], [3, 13, "2026-01-20", 2, 5],
  [4, 1, "2026-01-06", 1, 5], [4, 6, "2026-01-09", 2, 4], [4, 8, "2026-01-14", 3, 5],
  [4, 3, "2026-01-17", 2, 3], [4, 9, "2026-01-21", 1, 5],
  [5, 2, "2026-01-07", 3, 5], [5, 4, "2026-01-10", 4, 4], [5, 9, "2026-01-15", 1, 5],
  [5, 5, "2026-01-20", 3, 4], [5, 14, "2026-01-25", 4, 3],
  [6, 0, "2026-01-08", 2, 4], [6, 10, "2026-01-11", 3, 5], [6, 11, "2026-01-16", 2, 3],
  [6, 6, "2026-01-19", 2, 5], [6, 12, "2026-01-23", 3, 4],
  [7, 2, "2026-01-09", 3, 4], [7, 5, "2026-01-13", 2, 5], [7, 8, "2026-01-18", 3, 3],
  [7, 13, "2026-01-22", 1, 4], [7, 0, "2026-01-26", 2, 5],
  [8, 0, "2026-01-10", 2, 5], [8, 1, "2026-01-14", 1, 4], [8, 7, "2026-01-19", 5, 3],
  [8, 9, "2026-01-24", 1, 5], [8, 14, "2026-01-28", 3, 4],
  [9, 3, "2026-01-11", 2, 4], [9, 6, "2026-01-16", 2, 5], [9, 9, "2026-01-20", 1, 5],
  [9, 11, "2026-01-25", 3, 3], [9, 4, "2026-01-29", 4, 4],
  [10, 1, "2026-02-01", 1, 5], [10, 5, "2026-02-05", 3, 4], [10, 8, "2026-02-09", 2, 4],
  [10, 12, "2026-02-13", 3, 5],
  [11, 0, "2026-02-02", 3, 4], [11, 2, "2026-02-06", 4, 5], [11, 10, "2026-02-11", 2, 3],
  [11, 13, "2026-02-15", 1, 5],
  [12, 4, "2026-02-03", 5, 3], [12, 7, "2026-02-07", 4, 4], [12, 9, "2026-02-12", 1, 5],
  [12, 14, "2026-02-16", 3, 4],
  [13, 1, "2026-02-04", 1, 5], [13, 6, "2026-02-08", 2, 4], [13, 11, "2026-02-14", 3, 5],
  [14, 0, "2026-02-05", 2, 4], [14, 3, "2026-02-10", 2, 5], [14, 8, "2026-02-17", 3, 3],
  [15, 0, "2026-02-06", 3, 5], [15, 5, "2026-02-11", 2, 4],
];

async function seed()
{
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connesso.");

  await Promise.all([User.deleteMany(), Cookbook.deleteMany(), Review.deleteMany()]);
  console.log("Collezioni svuotate.");

  const users = await User.create(
    USER_DATA.map(u => ({ ...u, passwordHash: "password123" }))
  );
  console.log(`${users.length} utenti creati (password hashate con bcrypt).`);

  const cookbookDocs = [];
  REVIEW_PLAN.forEach(([ui, ri]) =>
  {
    const r = RECIPES[ri];
    cookbookDocs.push({ userId: users[ui]._id, recipeId: r.id, mealName: r.name });
  });

  const seen = new Set();
  const uniqueCookbooks = cookbookDocs.filter(d =>
  {
    const key = `${d.userId}-${d.recipeId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  await Cookbook.create(uniqueCookbooks);
  console.log(`${uniqueCookbooks.length} entry nel ricettario create.`);

  const reviewDocs = REVIEW_PLAN.map(([ui, ri, date, difficulty, taste]) => ({
    userId: users[ui]._id,
    recipeId: RECIPES[ri].id,
    mealName: RECIPES[ri].name,
    date, difficulty, taste
  }));
  await Review.create(reviewDocs);
  console.log(`${reviewDocs.length} recensioni create.`);

  await mongoose.disconnect();
  console.log("Seed completato.");
}

seed().catch(err => { console.error(err); process.exit(1); });