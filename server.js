const express = require('express');
const cors = require('cors')
const cookieParser = require("cookie-parser");
const path = require('path');

require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(cookieParser())
// Statics
// app.use(express.static('static'))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const users = require('./routes/Users');
const conference = require('./routes/Conference');
const score = require('./routes/Score');
// const pageCharge = require('./routes/PageCharge');
const kris = require('./routes/Research_KRIS');
const form = require('./routes/Form');
const pdf = require('./routes/File_pdf');
const opinionPC = require('./routes/Officers_opinion_pc');
const opinionConf = require('./routes/Officers_opinion_conf');
const budget = require('./routes/Budget');

const PCall = require('./routes/PageCharge_all');

const google = require('./routes/google');


app.use(users.router)
app.use(conference.router)
app.use(score.router)
// app.use(pageCharge.router)
app.use(kris.router)
app.use(form.router)
app.use(pdf.router)
app.use(opinionPC.router)
app.use(opinionConf.router)
app.use(budget.router)

app.use(PCall.router)

app.use(google.router)

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Hello from Node.js Backend! wine');
});

app.post('/api/data', (req, res) => {
    const data = req.body;
    res.json({ message: 'Data received!', data });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
