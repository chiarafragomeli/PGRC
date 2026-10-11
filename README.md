# PGRC 2026 — Piattaforma per la gestione di ricette di cucina

Applicazione web full-stack: frontend SPA (HTML/CSS/JS vanilla) + backend Node.js/Express + MongoDB.

---

## Requisiti di sistema

Prima di procedere, assicurarsi di avere installato:

| Software | Versione minima | Download |
|---|---|---|
| **Node.js** | 18 o superiore | https://nodejs.org |
| **MongoDB Community** | 6 o superiore | https://www.mongodb.com/try/download/community |

---

## Istruzioni di avvio

### 1. Estrarre lo zip

Estrarre la cartella del progetto in una posizione a scelta.

---

### 2. Avviare MongoDB

MongoDB deve essere in esecuzione prima di avviare il server.

**Su macOS (con Homebrew):**
```bash
brew services start mongodb-community
```

**Su Windows:**

Aprire i *Servizi di Windows* (tasto destro su "Questo PC" → Gestisci → Servizi) e avviare il servizio **MongoDB**.

Oppure da terminale (PowerShell come Amministratore):
```powershell
net start MongoDB
```

**Su Linux (Ubuntu/Debian):**
```bash
sudo systemctl start mongod
```

---

### 3. Aprire il terminale nella cartella del progetto

Navigare nella cartella estratta. Su tutti i sistemi operativi si può fare tasto destro → "Apri nel Terminale" (o equivalente).

---

### 4. Installare le dipendenze

```bash
npm install
```

Questo comando scarica automaticamente tutte le librerie necessarie (Express, Mongoose, bcryptjs, ecc.).

---

### 5. Configurazione del file `.env`

Se si clona il repository da GitHub, creare il file `.env` a partire dal template:

```bash
cp .env.example .env
```

Il file include i seguenti valori predefiniti:

```
MONGO_URI=mongodb://localhost:27017/pgrc
JWT_SECRET=pgrc_super_secret_key_2026
PORT=3000
```

Non è necessario modificarlo a meno che non si desideri personalizzare la porta o l'URI di MongoDB.

> ⚠️ **Nota sulla porta:** su macOS, la porta 5000 è occupata dal sistema (AirPlay Receiver). Per questo motivo è preconfigurata la porta **3000**. Su Windows e Linux si può usare liberamente anche `PORT=5000`.

---

### 6. Popolare il database con i dati di esempio

```bash
npm run seed
```

Questo comando crea nel database:
- **20 utenti** di esempio
- **70 voci** nel ricettario
- **70 recensioni**

---

### 7. Avviare il server

```bash
npm start
```

Il terminale mostrerà:
```
MongoDB connesso.
Server avviato su http://localhost:3000
```

---

### 8. Aprire l'applicazione nel browser

Aprire il browser e andare all'indirizzo:

```
http://localhost:3000
```

> ⚠️ **Importante:** aprire **sempre** l'applicazione tramite questo URL e non aprendo direttamente il file `index.html`.

---

## Credenziali di accesso

Tutti gli utenti di esempio hanno la stessa password:

| Email | Password |
|---|---|
| `marco@example.com` | `password123` |
| `giulia@example.com` | `password123` |
| `luca@example.com` | `password123` |
| `sofia@example.com` | `password123` |
| *(e altri 16 utenti)* | `password123` |

È possibile anche registrare un nuovo account tramite la pagina **Accedi → Registrati**.

---

## Riepilogo comandi

```bash
npm install       # installa le dipendenze (solo la prima volta)
npm run seed      # popola il database (solo la prima volta)
npm start         # avvia il server → http://localhost:3000
```

---

## Struttura del progetto

```
PGRC_2026/
├── server.js              # Entry point del server Express
├── .env                   # Configurazione ambiente (preconfigurato)
├── package.json           # Dipendenze Node.js
├── seed-mongo.js          # Script di popolamento database
│
├── routes/                # Endpoint API REST
│   ├── auth.js            # /api/auth  (login, registrazione, profilo)
│   ├── cookbook.js        # /api/cookbook  (ricettario personale)
│   └── reviews.js         # /api/reviews  (recensioni)
│
├── models/                # Schemi Mongoose (MongoDB)
│   ├── User.js
│   ├── Cookbook.js
│   └── Review.js
│
├── middleware/
│   └── auth.js            # Verifica token JWT
│
├── js/                    # JavaScript lato browser (SPA)
│   ├── api-client.js      # Chiamate al backend
│   ├── api.js             # Chiamate a TheMealDB (API esterna)
│   ├── router.js          # Router client-side (hash-based)
│   └── views/             # Viste della SPA
│
├── index.html             # Applicazione principale
├── landing.html           # Pagina di presentazione statica
└── style.css              # Stili globali
```

---

*Chiara Fragomeli — Programmazione Web e Mobile — Università degli Studi di Milano*
