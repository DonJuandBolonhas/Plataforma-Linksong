
const express = require('express');

const router = express.Router();

const {
    listarSingles,
    cadastrarSingle,
    buscarSingle,
    excluirSingle
} = require('../controllers/singleController');

router.get('/', listarSingles);

router.post('/', cadastrarSingle);

router.get('/:id', buscarSingle);

router.delete('/:id', excluirSingle);

module.exports = router;
