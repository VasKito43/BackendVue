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