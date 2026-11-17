const supabase = require("../config/supabase");

// LISTAR TODOS OS SINGLES
async function listarSingles(req, res) {
  const { data, error } = await supabase.from("single").select("*");

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  res.json(data);
}

// CADASTRAR UM SINGLE
async function cadastrarSingle(req, res) {
  const { nome } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({
      erro: "O nome é obrigatório!",
    });
  }

  const { data, error } = await supabase
    .from("single")
    .insert([{ nome: nome.trim() }])
    .select();

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  res.status(201).json(data);
}

// BUSCAR SINGLE PELO ID
async function buscarSingle(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("single")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  if (!data) {
    return res.status(404).json({
      erro: "Single não encontrado!",
    });
  }

  res.json(data);
}

// EXCLUIR SINGLE
async function excluirSingle(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("single")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({
      erro: "Single não encontrado!",
    });
  }

  res.json({ mensagem: "Single excluído com sucesso!" });
}

module.exports = {
  listarSingles,
  cadastrarSingle,
  buscarSingle,
  excluirSingle,
};
