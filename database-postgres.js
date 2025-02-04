import { randomUUID } from "node:crypto"; // gera ids unicos para usar na criação de novos registros
import { sql } from "./bd.js"; // importa sql

export class DatabasePostgres {

    // tabela usuarios
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

    async delete(id) {
      await sql`delete from usuarios where id = ${id}`;
    }

    // tabela estoque

    async listEstoque(search) {
      let vendas;
      if (search) {
        vendas = await sql`SELECT * FROM estoque WHERE nome ILIKE ${'%' + search + '%'}`;
      } else {
        vendas = await sql`SELECT * FROM estoque`;
      }
      return vendas;
    }
  
    async createEstoque(venda) {
      const vendaId = randomUUID();
      const { nome, quantidade, imagem, valor } = venda;
      await sql`INSERT INTO estoque (id, nome, quantidade, imagem, valor) VALUES (${vendaId}, ${nome}, ${quantidade}, ${imagem}, ${valor})`;
    }
  
    async updateEstoque(id, venda) {
      const { nome, quantidade, valor } = venda;
      await sql`UPDATE estoque SET nome = ${nome}, quantidade = ${quantidade}, valor = ${valor} WHERE id = ${id}`;
    }
  
    async deleteEstoque(id) {
      await sql`DELETE FROM estoque WHERE id = ${id}`;
    }



    // Tabela vendas


    async listVendas(search) {
      let vendas;
      if (search) {
        vendas = await sql`SELECT * FROM vendas WHERE nome ILIKE ${'%' + search + '%'}`;
      } else {
        vendas = await sql`SELECT * FROM vendas`;
      }
      return vendas;
    }

    async createVendas(venda) {
      const vendaId = randomUUID();
      const { clienteId, estoqueId, quantidade, valorTotal, pedidoId } = venda;
      await sql.begin(async transaction => {  
        await transaction`
            INSERT INTO vendas (id, cliente_id, estoque_id, quantidade, valor_total, pedido_id) 
            VALUES (${vendaId}, ${clienteId}, ${estoqueId}, ${quantidade}, ${valorTotal}, ${pedidoId})
        `;

        const produto = (await transaction`SELECT * FROM estoque WHERE id = ${estoqueId}`)[0];
        if (!produto) {
          throw new Error(`Produto com ID ${estoqueId} não encontrado.`);
        }

        const novaQuantidadeEstoque = produto.quantidade - quantidade;
        if (novaQuantidadeEstoque < 0) {
          throw new Error('Quantidade insuficiente no estoque.');
        }

        await transaction`UPDATE estoque SET quantidade = ${novaQuantidadeEstoque} WHERE id = ${estoqueId}`;

        await this.atualizaValorTotalPedido(pedidoId, transaction);  
    });
    }

    async updateVendas(id, venda) {
      const { estoqueId, quantidade, valorTotal } = venda;

      await sql.begin(async (transaction) => {
        const vendaAntiga = (await transaction`SELECT * FROM vendas WHERE id = ${id}`)[0];
        if (!vendaAntiga) {
          throw new Error(`Venda com ID ${id} não encontrada.`);
        }

        const diferençaQuantidade = vendaAntiga.quantidade - quantidade;

        await transaction`UPDATE vendas SET quantidade = ${quantidade}, valor_total = ${valorTotal} WHERE id = ${id}`;

        const produto = (await transaction`SELECT * FROM estoque WHERE id = ${estoqueId}`)[0];
        if (!produto) {
          throw new Error(`Produto com ID ${estoqueId} não encontrado.`);
        }

        const novaQuantidadeEstoque = produto.quantidade + diferençaQuantidade;
        if (novaQuantidadeEstoque < 0) {
          throw new Error('Quantidade insuficiente no estoque.');
        }

        await transaction`UPDATE estoque SET quantidade = ${novaQuantidadeEstoque} WHERE id = ${estoqueId}`;

        await this.atualizaValorTotalPedido(vendaAntiga.pedido_id, transaction);

      })
    }

    async deleteVendas(id) {
      await sql.begin(async (transaction) => {
        const venda = (await transaction`SELECT * FROM vendas WHERE id = ${id}`)[0];
        if (!venda) {
          throw new Error(`Venda com ID ${id} não encontrada.`);
        }
        await transaction`DELETE FROM vendas WHERE id = ${id}`;
        await this.atualizaValorTotalPedido(venda.pedido_id, transaction);
      })
    }


    // tabela pedidos

    async listPedidos(search) {
      let pedidos;
      if (search) {
        pedidos = await sql`SELECT * FROM pedidos WHERE nome ILIKE ${'%' + search + '%'}`;
      } else {
        pedidos = await sql`SELECT * FROM pedidos`;
      }
      return pedidos;
    }
  
    async createPedidos(id) {
      const pedidoId = id;
      const estatus = "pendente";
      const valor  = 0;
      await sql`INSERT INTO pedidos (id, valor, estatus, forma_pagamento) VALUES (${pedidoId}, ${valor}, ${estatus}, ${estatus})`;
    }
  
    async updatePedidos(id, pedido) {
      const { valor, estatus, formaPagamento } = pedido;
      await sql`UPDATE pedidos SET valor = ${valor}, estatus = ${estatus}, forma_pagamento = ${formaPagamento} WHERE id = ${id}`;
    }
  
    

    async atualizaValorTotalPedido(pedidoId, transaction) {
      const valoresPedido = await transaction`
          SELECT valor_total FROM vendas WHERE pedido_id = ${pedidoId}
      `;
  
      if (!valoresPedido || valoresPedido.length === 0) {
          throw new Error(`Pedido com ID ${pedidoId} não encontrado.`);
      }
  
      const valorTotalPedido = valoresPedido
          .map(item => parseFloat(item.valor_total) || 0) 
          .reduce((acumulador, valorAtual) => acumulador + valorAtual, 0); 
  
      await transaction`
          UPDATE pedidos SET valor = ${valorTotalPedido} WHERE id = ${pedidoId}
      `;
  }
  

    

}