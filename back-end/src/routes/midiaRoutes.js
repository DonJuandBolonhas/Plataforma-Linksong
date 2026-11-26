const express = require("express");

const router = express.Router();

const {
  listarmidias,
  cadastrarmidia,
  buscarmidia,
  excluirmidia,
} = require("../controllers/midia");

router.get("/", listarmidias);

router.post("/", cadastrarmidia);

router.get("/:id", buscarmidia);

router.delete("/:id", excluirmidia);

module.exports = router;
