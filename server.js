import { fastify } from "fastify"; // framework para criar o servidore
import cors from '@fastify/cors'; // Importa o plugin CORS para permitir requisições de diferentes origens
import 'dotenv/config'; // importa e carrega as variaveis do .env
import { DatabasePostgres } from "./database-postgres.js";

// Instancia do servidor
const server = fastify();

// Instancia do Banco de Dados
const database = new DatabasePostgres();

await server.register(cors, {
  origin: '*', // Permite requisições de qualquer origem
});

server.get("/usuarios", async (request, reply) => {                                    
  const {search} = request.query
  const usuarios = await database.list(search);
  return usuarios;
});


server.post("/usuarios", async (request, reply) => {
  const { nome, email, celular } = request.body;

  // Validação básica para garantir que todos os campos estão presentes
  if (!nome || !email || !celular) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    // Chama o método 'create' para adicionar o novo usuário
    await database.create({ nome, email, celular });
    return reply.status(201).send({ message: "Usuário criado com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao cadastrar o usuário." });
  }
});

// USUARIOS ------------------------------------------------------------------------------

server.listen({
  host: "0.0.0.0", // Configuração para render (pode ser ajustado para localhost)
  port: process.env.PORT ?? 3333, // Usando a porta configurada no arquivo .env
});

server.delete("/usuarios/:id", async (request, reply) => {
  const { id } = request.params;

  if (!id) {
    return reply.status(400).send({ error: "ID do usuário é obrigatório." });
  }

  try {
    await database.delete(id); // Chama o método delete no banco de dados
    return reply.status(200).send({ message: "Usuário deletado com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao deletar o usuário." });
  }
});

server.put("/usuarios/:id", async (request, reply) => {
  const { id } = request.params;
  const { nome, email, celular } = request.body;

  if (!id || !nome || !email || !celular) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.update(id, { nome, email, celular });
    return reply.status(200).send({ message: "Usuário atualizado com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao atualizar o usuário." });
  }
});

// ESTOQUE ------------------------------------------------------------------------------

// Listar produtos do estoque
server.get("/estoque", async (request, reply) => {
  const { search } = request.query;
  try {
    const produtos = await database.listEstoque(search);
    return produtos;
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao listar os produtos." });
  }
});

// Criar um novo produto no estoque
server.post("/estoque", async (request, reply) => {
  const { nome, quantidade, imagem, valor } = request.body;

  if (!nome || !quantidade || !imagem || !valor) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.createEstoque({ nome, quantidade, imagem, valor });
    return reply.status(201).send({ message: "Produto adicionado ao estoque!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao adicionar o produto." });
  }
});

// Atualizar um produto no estoque
server.put("/estoque/:id", async (request, reply) => {
  const { id } = request.params;
  const { nome, quantidade, imagem, valor } = request.body;

  if (!id || !nome || !quantidade || !imagem || !valor) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.updateEstoque(id, { nome, quantidade, imagem, valor });
    return reply.status(200).send({ message: "Produto atualizado com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao atualizar o produto." });
  }
});

// Deletar um produto do estoque
server.delete("/estoque/:id", async (request, reply) => {
  const { id } = request.params;

  if (!id) {
    return reply.status(400).send({ error: "ID do produto é obrigatório." });
  }

  try {
    await database.deleteEstoque(id);
    return reply.status(200).send({ message: "Produto removido do estoque!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao remover o produto." });
  }
});

// VENDAS -----------------------------------------------------------------------

// Listar vendas 
server.get("/vendas", async (request, reply) => {
  const { search } = request.query;
  try {
    const vendas = await database.listVendas(search);
    return vendas;
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao listar as vendas" });
  }
});

// Criar uma nova venda
server.post("/vendas", async (request, reply) => {
  const { clienteId, estoqueId, quantidade, valorTotal, pedidoId } = request.body;

  if (!clienteId || !estoqueId || !quantidade || !valorTotal || !pedidoId) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.createVendas({ clienteId, estoqueId, quantidade, valorTotal, pedidoId });
    return reply.status(201).send({ message: "Venda Criada!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao adicionar o venda." });
  }
});

// Atualizar uma venda
server.put("/vendas", async (request, reply) => {
  const { estoqueId, quantidade, valorTotal, pedidoId } = request.body;

  if ( !estoqueId || !quantidade || !valorTotal || !pedidoId ) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.updateVendas({ estoqueId, quantidade, valorTotal, pedidoId });
    return reply.status(200).send({ message: "Venda atualizada com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao atualizar venda." });
  }
});

// Deletar uma venda
server.delete("/vendas", async (request, reply) => {
  const { estoqueId, quantidade, pedidoId } = request.body;

  if (!estoqueId || !quantidade || !pedidoId) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.deleteVendas({estoqueId, quantidade, pedidoId});
    return reply.status(200).send({ message: "venda excluida!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao remover venda." });
  }
});

//PEDIDO -------------------------------------------------------------------------

// Listar pedido 
server.get("/pedidos", async (request, reply) => {
  const { search } = request.query;
  try {
    const pedidos = await database.listPedidos(search);
    return pedidos;
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao listar de pedidos" });
  }
});

// Criar um novo pedido
server.post("/pedidos", async ( request,reply) => {
  const id = request.body;

  if (!id) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.createPedidos( id );
    return reply.status(201).send({ message: "Pedido Criado!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao adicionar pedido." });
  }
});

// Atualizar um pedido
server.put("/pedidos/:id", async (request, reply) => {
  const { id } = request.params;
  const { valor, estatus, formaPagamento } = request.body;

  if (!id || !valor || !estatus || !formaPagamento ) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.updatePedidos(id, { valor, estatus, formaPagamento });
    return reply.status(200).send({ message: "Pedido atualizada com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao atualizar pedido." });
  }
});

// Deletar um pedido
server.delete("/pedidos/:id", async (request, reply) => {
  const { id } = request.params;

  if (!id) {
    return reply.status(400).send({ error: "ID do pedido é obrigatório." });
  }

  try {
    await database.deletePedido(id);
    return reply.status(200).send({ message: "pedido excluido!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao remover o pedido." });
  }
});

//FUNCIONARIO -------------------------------------------------------------------------

// Listar funcionario
server.post("/validaFuncionarios", async (request, reply) => {
  const { cpf, senha } = request.body;

  if (!cpf || !senha ){
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }
  try {
    const funcionario = await database.listValidaFuncionarios(cpf, senha);
    return reply.send(funcionario);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao procurar funcionario" });
  }
});

server.get("/funcionarios", async (reply) => {
  try {
    const funcionarios = await database.listFuncionarios();
    return funcionarios;
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao listar funcionarios." });
  }
});


// Criar um novo funcionario
server.post("/funcionarios", async (request, reply) => {
  const { nome, telefone, cpf, senha } = request.body;

  if (!nome || !telefone || !cpf || !senha) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.createFuncionarios({ nome, telefone, cpf, senha });
    return reply.status(201).send({ message: "Funcionário criado!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao criar funcionario" });
  }
});

// Atualizar um funcionario
server.put("/funcionarios/:id", async (request, reply) => {
  const { id } = request.params;
  const {  nome, telefone, senha  } = request.body;

  if (!id || !nome || !telefone || !senha) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.updateFuncionarios(id, { nome, telefone, senha });
    return reply.status(200).send({ message: "funcionario atualizado" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao atualizar ofuncionario." });
  }
});

// Deletar um funcionario
server.delete("/funcionario/:id", async (request, reply) => {
  const { id } = request.params;

  if (!id) {
    return reply.status(400).send({ error: "ID não encontrado" });
  }

  try {
    await database.deleteFuncionarios(id);
    return reply.status(200).send({ message: "Funcionario excluido!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao excluir funcionario." });
  }
});


//novo

server.post("/validaUsuario", async (request, reply) => {
  const { cpf, senha } = request.body;

  if (!cpf || !senha ){
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }
  try {
    const usuario = await database.listValidaUsuario(cpf, senha);
    return reply.send(usuario);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao procurar usuario" });
  }
});


server.get("/produtos", async (request, reply) => {
  const { search } = request.query;
  try {
    const produtos = await database.listProduto(search);
    return produtos;
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao listar os produtos." });
  }
});

server.get("/recebeEntradas", async (request, reply) => {
  // espera search no formato 'YYYY-MM-DD'
  const { search } = request.query;
  try {
    const produtos = await database.recebeEntradas(search);
    return produtos;
  } catch (error) {
    console.error(error);
    return reply
      .status(500)
      .send({ error: "Erro ao listar os produtos." });
  }
});

server.get('/recebeSaidas', async (request, reply) => {
  const { search } = request.query;
  try {
    const registros = await database.recebeSaidas(search);
    reply.send(registros);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Erro ao listar as saídas.' });
  }
});


server.get("/vendedores", async (request, reply) => {
  const { search } = request.query;
  try {
    const vendedores = await database.listVendedor(search);
    return vendedores;
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao listar os vendedores." });
  }
});

server.get("/clientes", async (request, reply) => {
  const { search } = request.query;
  try {
    const clientes = await database.listClientes(search);
    return clientes;
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao listar os clientes." });
  }
});

server.get("/formas_pagamentos", async (request, reply) => {
  const { search } = request.query;
  try {
    const formas_pagamentos = await database.listFormasPagamentos(search);
    return formas_pagamentos;
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao listar os formas_pagamentos." });
  }
});

// Criar um novo produto no estoque
server.post("/realizarEntrada", async (request, reply) => {
  const { produtoId, quantidade, usuarioId } = request.body;

  if (!produtoId || !quantidade || !usuarioId ) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.createEntrada({ produtoId, quantidade, usuarioId });
    return reply.status(201).send({ message: "Entrada realizado com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao realizar entrada" });
  }
});

// --- routes.js (ou server.js) ---
server.post("/realizarSaida", async (request, reply) => {
  const {
    usuarioId,
    produtoId,
    quantidade,
    vendedorId,
    descricao,
    valor_custo,
    valor_venda,
    id_cliente,
    id_forma_pagamento
  } = request.body;

  // validação básica de todos os campos
  if (
    usuarioId == null ||
    produtoId == null ||
    quantidade == null ||
    vendedorId == null ||
    valor_custo == null ||
    valor_venda == null ||
    id_cliente == null ||
    id_forma_pagamento == null
  ) {
    return reply
      .status(400)
      .send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.createSaida({
      usuarioId,
      produtoId,
      quantidade,
      vendedorId,
      descricao,
      valor_custo,
      valor_venda,
      id_cliente,
      id_forma_pagamento
    });
    return reply
      .status(201)
      .send({ message: "Saída realizada com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply
      .status(500)
      .send({ error: "Erro ao realizar saída" });
  }
});


// Atualizar um produto no estoque
server.put("/produtos/:id", async (request, reply) => {
  const { id } = request.params;
  const { nome, quantidade } = request.body;

  if (!id || !nome || !quantidade) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.updateProdutos(id, { nome, quantidade });
    return reply.status(200).send({ message: "Produto atualizado com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao atualizar o produto." });
  }
});

// Deletar um produto do estoque
server.delete("/produtos/:id", async (request, reply) => {
  const { id } = request.params;

  if (!id) {
    return reply.status(400).send({ error: "ID do produto é obrigatório." });
  }

  try {
    await database.deleteProdutos(id);
    return reply.status(200).send({ message: "Produto removido do estoque!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao remover o produto." });
  }
});

// Criar um novo produto no estoque
server.post("/produto", async (request, reply) => {
  const { nome, quantidade } = request.body;

  if (!nome || !quantidade) {
    return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
  }

  try {
    await database.createProduto({ nome, quantidade });
    return reply.status(201).send({ message: "Produto adicionado ao estoque!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao adicionar o produto." });
  }
});

server.post("/clientes", async (request, reply) => {
  const { nome } = request.body;

  if (!nome || nome.trim() === "") {
    return reply.status(400).send({ error: "O nome é obrigatório." });
  }

  try {
    await database.createCliente({ nome });
    return reply.status(201).send({ message: "Cliente cadastrado com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao cadastrar o cliente." });
  }
});

// server.js

server.get('/lucros', async (request, reply) => {
  const {
    periodType,
    periodValue,
    vendedor: vendedorId,
    produto: produtoId,
    cliente: clienteId,
    pagamento: formaPagamentoId
  } = request.query;

  let dataMin, dataMax;
  if (periodType === 'month') {
    const [y, m] = periodValue.split('-').map(Number);
    dataMin = new Date(y, m - 1, 1);
    dataMax = new Date(y, m, 0, 23, 59, 59);
  } else {
    const y = Number(periodValue);
    dataMin = new Date(y, 0, 1);
    dataMax = new Date(y, 11, 31, 23, 59, 59);
  }

  try {
    const metrics = await database.getLucrosTotais({
      vendedorId,
      produtoId,
      clienteId: clienteId ? Number(clienteId) : null,
      formaPagamentoId: formaPagamentoId ? Number(formaPagamentoId) : null,
      dataMin,
      dataMax
    });
    return reply.send(metrics);
  } catch (err) {
    // log completo no servidor
    request.log.error(err);
    // retorna detalhe para o front (remova em produção)
    return reply
      .status(500)
      .send({ error: 'Erro ao calcular lucros', details: err.message });
  }
});
