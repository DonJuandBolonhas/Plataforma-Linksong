require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const singleRoutes = require('./routes/singleRoutes');

app.use('/api/singles', singleRoutes);

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor rodando!');
});