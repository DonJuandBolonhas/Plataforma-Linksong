require("dotenv").config();

console.log("URL:", process.env.SUPABASE_URL);
console.log("Chave carregada:", !!process.env.SUPABASE_SECRET_KEY);
console.log(
  "Início da chave:",
  process.env.SUPABASE_SECRET_KEY?.substring(0, 10),
);
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const midiaRoutes = require("./routes/midiaRoutes");

app.use("/api/midia", midiaRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando!");
});

