const supabase = require("../config/supabase");

// LISTAR TODOS OS midiaS
async function listarmidias(req, res) {
  const { data, error } = await supabase.from("midia").select("*");

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  res.json(data);
}

// CADASTRAR UM midia
async function cadastrarmidia(req, res) {
  const { nome } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({
      erro: "O nome é obrigatório!",
    });
  }

  const { data, error } = await supabase
    .from("midia")
    .insert([{ nome: nome.trim() }])
    .select();

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  res.status(201).json(data);
}

// BUSCAR midia PELO ID
async function buscarmidia(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("midia")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  if (!data) {
    return res.status(404).json({
      erro: "midia não encontrado!",
    });
  }

  res.json(data);
}

// EXCLUIR midia
async function excluirmidia(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("midia")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({
      erro: "midia não encontrado!",
    });
  }

  res.json({ mensagem: "midia excluído com sucesso!" });
}

module.exports = {
  listarmidias,
  cadastrarmidia,
  buscarmidia,
  excluirmidia,
};
