import { randomUUID } from "node:crypto"; // gera ids unicos para usar na criação de novos registros
import { sql } from "./bd.js"; // importa sql

export class DatabasePostgres {

    async list(search){ 
        let usuarios;

        if(search) { // se for fornecido o "search" fara um busca pelo titulo que tenha o "search"
            usuarios = await sql`select * from usuarios where nome ilike ${"%" + search + "%"}`;
        } else {
            usuarios = await sql`select * from usuarios`;
        }
        return usuarios;

    }

    async create(usuario) {
        const usuarioId = randomUUID(); // gera um id unico
        const { nome, email, celular } = usuario;  // extrai os dados do usuario 
    
        await sql`insert into usuarios (id, nome, email, celular) VALUES (${usuarioId}, ${nome}, ${email}, ${celular})`;  // insere um novo usuario no banco de dados
      }

      async update(id, usuario) {
        const { nome, email, celular } = usuario;
      
        await sql`update usuarios set nome = ${nome}, email = ${email}, celular = ${celular} WHERE id = ${id}`; // atualiza os dados do usuario pelo id
      }
}