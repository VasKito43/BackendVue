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

