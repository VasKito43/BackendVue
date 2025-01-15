import 'dotenv/config' // importa e carrega as variaveis do .env
import postgres from 'postgres' // biblioteca para interagir PostgreSQL com js

export const sql = postgres ( // instancia para conectar a um banco de dados
    process.env.URL, // URL do banco de dados
    { ssl: 'require' } // garantir conexao segura
)