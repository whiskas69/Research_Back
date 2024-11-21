const express = require('express');
const app = express();
const PORT = 3000;

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
