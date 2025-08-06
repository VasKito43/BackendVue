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

    async updateVendas( venda) {
      const { estoqueId, quantidade, valorTotal, pedidoId } = venda;

      await sql.begin(async (transaction) => {
        const vendaAntiga = (await transaction`SELECT * FROM vendas WHERE estoque_id = ${estoqueId} AND pedido_id = ${pedidoId}`)[0];
        if (!vendaAntiga) {
          throw new Error(`Venda  não encontrada.`);
        }

        const diferençaQuantidade = vendaAntiga.quantidade - quantidade;

        await transaction`UPDATE vendas SET quantidade = ${quantidade}, valor_total = ${valorTotal} WHERE estoque_id = ${estoqueId} AND pedido_id = ${pedidoId}`;

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

    async deleteVendas(venda) {
      const { estoqueId, quantidade, pedidoId } = venda;

      await sql.begin(async (transaction) => {
        const vendaAntiga = (await transaction`SELECT * FROM vendas WHERE estoque_id = ${estoqueId} AND pedido_id = ${pedidoId}`)[0];
        if (!vendaAntiga) {
          throw new Error(`Venda  não encontrada.`);
        }

        await transaction`DELETE FROM vendas WHERE estoque_id = ${estoqueId} AND pedido_id = ${pedidoId}`;

        const produto = (await transaction`SELECT * FROM estoque WHERE id = ${estoqueId}`)[0];
        if (!produto) {
          throw new Error(`Produto com ID ${estoqueId} não encontrado.`);
        }
        
        const novaQuantidadeEstoque = produto.quantidade + quantidade;
        if (novaQuantidadeEstoque < 0) {
          throw new Error('Quantidade insuficiente no estoque.');
        }

        await transaction`UPDATE estoque SET quantidade = ${novaQuantidadeEstoque} WHERE id = ${estoqueId}`;

        await this.atualizaValorTotalPedido(vendaAntiga.pedido_id, transaction);

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
  
      if (!valoresPedido) {
          throw new Error(`Pedido com ID ${pedidoId} não encontrado.`);
      }
      
      if (valoresPedido.length !== 0){
        const valorTotalPedido = valoresPedido
            .map(item => parseFloat(item.valor_total) || 0) 
            .reduce((acumulador, valorAtual) => acumulador + valorAtual, 0); 
    
        await transaction`
            UPDATE pedidos SET valor = ${valorTotalPedido} WHERE id = ${pedidoId}
        `;
        
      }
  }

  async deletePedido(id) {
    await sql`DELETE FROM pedidos WHERE id = ${id}`;
  }

  // tabela funcionarios
  async listValidaFuncionarios(cpf, senha) {
    const [funcionario] = await sql`
    SELECT * FROM funcionarios WHERE cpf = ${cpf}
  `;
  
  if (!funcionario) {
    return { error: "Funcionário não encontrado" };
  }

  if (funcionario.senha !== senha) {
    return { error: "Senha incorreta" };
  }

  return funcionario;
  }

  async listFuncionarios() {
    const funcionario = await sql`SELECT * FROM funcionarios`
    return funcionario;
  }

  
  async createFuncionarios(funcionario) {
    const funcionarioId = randomUUID(); 
    const { nome, telefone, cpf, senha } = funcionario;  
    await sql`insert into funcionarios (id, nome, telefone, senha, cpf) VALUES (${funcionarioId}, ${nome}, ${telefone}, ${senha}, ${cpf})`;  
  }

  async updateFuncionarios(id, funcionario) {
    const { nome, telefone, senha } = funcionario;
  
    await sql`update funcionarios set nome = ${nome}, telefone = ${telefone}, senha = ${senha} WHERE id = ${id}`; 
  }

  async deleteFuncionarios(id) {
    await sql`delete from funcionarios where id = ${id}`;
  }





//novo

  async listValidaUsuario(cpf, senha) {
  const [usuario] = await sql`
  SELECT * FROM usuarios WHERE cpf = ${cpf}
  `;

  if (!usuario) {
    return { error: "Funcionário não encontrado" };
  }

  if (usuario.senha !== senha) {
    return { error: "Senha incorreta" };
  }

  return usuario;
  }

  async listProduto(search) {
    let produtos;
    if (search) {
      produtos = await sql`SELECT * FROM produtos WHERE nome ILIKE ${'%' + search + '%'}`;
    } else {
      produtos = await sql`SELECT * FROM produtos`;
    }
    return produtos;
  }

  async recebeEntradas(search) {
  let entradas;
  if (search) {
    // busca por data exata
    entradas = await sql`
      SELECT
        e.id,
        e.quantidade,
        e.data,
        u.id   AS usuario_id,
        u.nome AS usuario_nome,
        p.id   AS produto_id,
        p.nome AS produto_nome,
        p.unidade
      FROM entradas e
      JOIN usuarios u ON e.usuario_id = u.id
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.data = ${search}
      ORDER BY e.data DESC
    `;
  } else {
    // retorna todas as entradas
    entradas = await sql`
      SELECT
        e.id,
        e.quantidade,
        e.data,
        u.id   AS usuario_id,
        u.nome AS usuario_nome,
        p.id   AS produto_id,
        p.nome AS produto_nome,
        p.unidade
      FROM entradas e
      JOIN usuarios u ON e.usuario_id = u.id
      JOIN produtos p ON e.produto_id = p.id
      ORDER BY e.data DESC
    `;
  }
  return entradas;
}

  async listVendedor(search) {
    let vendedores;
    if (search) {
      vendedores = await sql`SELECT * FROM vendedores WHERE nome ILIKE ${'%' + search + '%'}`;
    } else {
      vendedores = await sql`SELECT * FROM vendedores`;
    }
    return vendedores;
  }

  async listClientes(search) {
    let clientes;
    if (search) {
      clientes = await sql`SELECT * FROM clientes WHERE nome ILIKE ${'%' + search + '%'}`;
    } else {
      clientes = await sql`SELECT * FROM clientes`;
    }
    return clientes;
  }

  async listFormasPagamentos(search) {
    let formas_pagamentos;
    if (search) {
      formas_pagamentos = await sql`SELECT * FROM formas_pagamentos WHERE nome ILIKE ${'%' + search + '%'}`;
    } else {
      formas_pagamentos = await sql`SELECT * FROM formas_pagamentos`;
    }
    return formas_pagamentos;
  }

  async createEntrada(entrada) {
  return await sql.begin(async (tx) => {
    const data = new Date();
    const { produtoId, quantidade, usuarioId, valor } = entrada;

    // 1) Busca o produto
    const [produto] = await tx`SELECT * FROM produtos WHERE id = ${produtoId}`;
    if (!produto) throw new Error('Produto não encontrado');

    // 2) Atualiza quantidade no produtos
    const novaQuantidade = produto.quantidade + quantidade;
    await tx`
      UPDATE produtos
      SET quantidade = ${novaQuantidade}
      WHERE id = ${produtoId}
    `;

    // ─── Novo passo: atualiza também o valor unitário no produto ───
    await tx`
      UPDATE produtos
      SET valor = ${valor}
      WHERE id = ${produtoId}
    `;

    // 3) Insere na tabela de entradas (valor unitário incluído)
    await tx`
      INSERT INTO entradas (
        usuario_id,
        produto_id,
        quantidade,
        data,
        valor
      ) VALUES (
        ${usuarioId},
        ${produtoId},
        ${quantidade},
        ${data},
        ${valor}
      )
    `;
  });
}


  async recebeSaidas(search) {
  let saidas;
  if (search) {
    // filtrar por data exata
    saidas = await sql`
      SELECT
        s.id,
        s.quantidade,
        s.data,
        u.id   AS usuario_id,
        u.nome AS usuario_nome,
        p.id   AS produto_id,
        p.nome AS produto_nome,
        p.local          AS produto_local,
        v.id   AS vendedor_id,
        v.nome AS vendedor_nome,
        c.id   AS cliente_id,
        c.nome AS cliente_nome,
        f.id   AS forma_pagamento_id,
        f.nome AS forma_pagamento_nome,
        s.valor_custo,
        s.valor_venda,
        s.descrição
      FROM saidas s
      JOIN usuarios u               ON s.usuario_id = u.id
      JOIN produtos p               ON s.produto_id = p.id
      JOIN vendedores v             ON s.vendedor_id = v.id
      JOIN clientes c               ON s.id_cliente = c.id
      JOIN formas_pagamentos f      ON s.id_forma_pagamento = f.id
      WHERE s.data = ${search}
      ORDER BY s.data DESC
    `;
  } else {
    // todas as saídas
    saidas = await sql`
      SELECT
        s.id,
        s.quantidade,
        s.data,
        u.id   AS usuario_id,
        u.nome AS usuario_nome,
        p.id   AS produto_id,
        p.nome AS produto_nome,
        p.local          AS produto_local,
        v.id   AS vendedor_id,
        v.nome AS vendedor_nome,
        c.id   AS cliente_id,
        c.nome AS cliente_nome,
        f.id   AS forma_pagamento_id,
        f.nome AS forma_pagamento_nome,
        s.valor_custo,
        s.valor_venda,
        s.descrição
      FROM saidas s
      JOIN usuarios u               ON s.usuario_id = u.id
      JOIN produtos p               ON s.produto_id = p.id
      JOIN vendedores v             ON s.vendedor_id = v.id
      JOIN clientes c               ON s.id_cliente = c.id
      JOIN formas_pagamentos f      ON s.id_forma_pagamento = f.id
      ORDER BY s.data DESC
    `;
  }
  return saidas;
}

  
  // --- database.js ---
async createSaida(saida) {
  return await sql.begin(async (tx) => {
    const {
      usuarioId,
      produtoId,
      quantidade,
      data,
      vendedorId,
      descricao,
      valor_custo,
      valor_venda,
      id_cliente,
      id_forma_pagamento
    } = saida;

    // 1) Busca o produto atual
    const [produto] = await tx`SELECT * FROM produtos WHERE id = ${produtoId}`;
    if (!produto) throw new Error("Produto não encontrado");

    // 2) Atualiza quantidade no estoque
    const novaQuantidade = produto.quantidade - quantidade;
    if (novaQuantidade < 0) throw new Error("Estoque insuficiente");
    await tx`
      UPDATE produtos
      SET quantidade = ${novaQuantidade}
      WHERE id = ${produtoId}
    `;

    // 3) Insere na tabela de saídas com todos os campos
    await tx`
      INSERT INTO saidas (
        usuario_id,
        produto_id,
        quantidade,
        data,
        vendedor_id,
        descrição,
        valor_custo,
        valor_venda,
        id_cliente,
        id_forma_pagamento
      ) VALUES (
        ${usuarioId},
        ${produtoId},
        ${quantidade},
        ${data},
        ${vendedorId},
        ${descricao},
        ${valor_custo},
        ${valor_venda},
        ${id_cliente},
        ${id_forma_pagamento}
      )
    `;
    // commit automático
  });
}

  async updateProdutos(id, venda) {
      const { nome, quantidade } = venda;
      await sql`
        UPDATE produtos
        SET nome       = ${nome},
            quantidade = ${quantidade},
            valor      = ${venda.valor}            -- ← novo
        WHERE id = ${id}
      `;
      
    }
  
  async deleteProdutos(id) {
      await sql`DELETE FROM produtos WHERE id = ${id}`;
    }

  async createProduto(produto) {
  const produtoId = randomUUID();
  const { nome, quantidade, valor, local } = produto;
  await sql`
    INSERT INTO produtos (
      id,
      nome,
      quantidade,
      valor,
      local
    ) VALUES (
      ${produtoId},
      ${nome},
      ${quantidade},
      ${valor},
      ${local}
    )
  `;
}


    async createCliente(cliente) {
  const { nome } = cliente;
  await sql`
    INSERT INTO clientes (nome)
    VALUES (${nome.toUpperCase()})
  `;
}

async getLucrosTotais(opts) {
  const {
    vendedorId,
    produtoId,
    clienteId,
    formaPagamentoId,
    dataMin,
    dataMax
  } = opts;

  // Monta o WHERE sem usar sql.join
  const q = sql`
    SELECT
      COUNT(*)::int                                            AS num_vendas,
      COALESCE(SUM(s.valor_venda * s.quantidade), 0)::numeric AS receita,
      COALESCE(SUM(s.valor_custo  * s.quantidade), 0)::numeric AS custo
    FROM saidas s
    WHERE 1 = 1
      ${vendedorId         ? sql` AND s.vendedor_id       = ${vendedorId}`         : sql``}
      ${produtoId          ? sql` AND s.produto_id        = ${produtoId}`          : sql``}
      ${clienteId != null  ? sql` AND s.id_cliente        = ${clienteId}`          : sql``}
      ${formaPagamentoId!= null ? sql` AND s.id_forma_pagamento = ${formaPagamentoId}` : sql``}
      ${dataMin            ? sql` AND s.data              >= ${dataMin}`            : sql``}
      ${dataMax            ? sql` AND s.data              <= ${dataMax}`            : sql``}
  `;

  const row = (await q)[0] || {};
  const receita = parseFloat(row.receita) || 0;
  const custo   = parseFloat(row.custo)   || 0;

  return {
    numVendas: Number(row.num_vendas),
    receita,
    custo,
    lucro: receita - custo
  };
}


async listEntradas(search) {
  // se tiver filtro de texto, monta WHERE; aqui simplifico sem search
  const rows = await sql`
    SELECT
      e.id,
      e.usuario_id,
      u.nome AS usuario_nome,
      e.produto_id,
      p.nome AS produto_nome,
      e.quantidade,
      e.data,
      p.local,
      e.valor        AS valor,               -- valor unitário
      (e.quantidade * e.valor) AS total_entrada  -- total calculado
    FROM entradas e
    JOIN usuarios u    ON u.id = e.usuario_id
    JOIN produtos p    ON p.id = e.produto_id
    ORDER BY e.data DESC
  `
  return rows
}

 // Função de acesso ao banco
// database-postgres.js (ou onde estiver seu método)
async fechamentoCaixa({ periodType, periodValue, vendedorId }) {
  // 1) Garante que os parâmetros estejam corretos
  if (!['day','month','year'].includes(periodType)) {
    throw new Error(`periodType inválido: ${periodType}`)
  }
  if (typeof periodValue !== 'string' || !periodValue) {
    throw new Error('periodValue deve ser uma string não vazia')
  }

  // 2) Monta o filtro de data dinamicamente
  let dateFilter
  if (periodType === 'day') {
    dateFilter = sql`s.data = ${periodValue}`
  } else if (periodType === 'month') {
    dateFilter = sql`to_char(s.data, 'YYYY-MM') = ${periodValue}`
  } else { // year
    dateFilter = sql`to_char(s.data, 'YYYY') = ${periodValue}`
  }

  // 3) Executa a query usando o dateFilter
  const rows = await sql`
    SELECT
      fp.nome AS forma,
      SUM(s.valor_venda * s.quantidade)                AS total,
      SUM((s.valor_venda - s.valor_custo) * s.quantidade) AS lucro
    FROM saidas s
    JOIN formas_pagamentos fp ON s.id_forma_pagamento = fp.id
    WHERE ${dateFilter}
      AND s.vendedor_id = ${vendedorId}
    GROUP BY fp.nome
  `

  // 4) Acumula totais gerais
  const totalGeral = rows.reduce((sum, r) => sum + parseFloat(r.total), 0)
  const lucroGeral = rows.reduce((sum, r) => sum + parseFloat(r.lucro), 0)

  // 5) Converte para objeto { forma: { total, lucro } }
  const valoresPorForma = {}
  for (const r of rows) {
    valoresPorForma[r.forma] = {
      total: parseFloat(r.total),
      lucro: parseFloat(r.lucro),
    }
  }

  return { valoresPorForma, totalGeral, lucroGeral }
}


// dentro de class DatabasePostgres

async atualizarEstoque({ produtoId_antigo, produtoId_novo, quantidade_antiga, quantidade_nova }) {
  return await sql.begin(async tx => {
    if (produtoId_antigo !== produtoId_novo) {
      // repõe do antigo e debita no novo
      await tx`
        UPDATE produtos
        SET quantidade = quantidade + ${quantidade_antiga}
        WHERE id = ${produtoId_antigo}
      `
      await tx`
        UPDATE produtos
        SET quantidade = quantidade - ${quantidade_nova}
        WHERE id = ${produtoId_novo}
      `
    } else {
      // mesma linha, ajusta pela diferença
      const diff = quantidade_nova - quantidade_antiga
      await tx`
        UPDATE produtos
        SET quantidade = quantidade - ${diff}
        WHERE id = ${produtoId_novo}
      `
    }
  })
}

async atualizarSaida({ idSaida, produtoId, quantidade, valor_custo, valor_venda, data, id_forma_pagamento }) {
  // aqui não precisa de tx, basta executar o UPDATE
  return await sql`
    UPDATE saidas SET
      produto_id         = ${produtoId},
      quantidade         = ${quantidade},
      valor_custo        = ${valor_custo},
      valor_venda        = ${valor_venda},
      data               = ${data},
      id_forma_pagamento = ${id_forma_pagamento}
    WHERE id = ${idSaida}
  `
}


// em database-postgres.js

// database-postgres.js


async atualizarSaidaComEstoque(opts) {
  return await sql.begin(async tx => {
    const {
      idSaida,
      produtoId_antigo,
      produtoId_novo,
      quantidade_antiga,
      quantidade_nova,
      valor_custo,
      valor_venda,
      data,
      id_forma_pagamento
    } = opts;

    // 1) REPOR antigo / DEBITAR novo
    if (produtoId_antigo !== produtoId_novo) {
      // repor quantidade antiga
      await tx`
        UPDATE produtos
        SET quantidade = quantidade + ${quantidade_antiga}
        WHERE id = ${produtoId_antigo}
      `;
      // debitar nova quantidade
      await tx`
        UPDATE produtos
        SET quantidade = quantidade - ${quantidade_nova}
        WHERE id = ${produtoId_novo}
      `;
    } else {
      // mesmo produto, ajusta pela diferença
      const diff = quantidade_nova - quantidade_antiga;
      await tx`
        UPDATE produtos
        SET quantidade = quantidade - ${diff}
        WHERE id = ${produtoId_novo}
      `;
    }

    // 2) AGORA atualiza a própria saída (FK para produtos.id já existe)
    await tx`
      UPDATE saidas
      SET
        produto_id          = ${produtoId_novo},
        quantidade          = ${quantidade_nova},
        valor_custo         = ${valor_custo},
        valor_venda         = ${valor_venda},
        data                = ${data},
        id_forma_pagamento  = ${id_forma_pagamento}
      WHERE id = ${idSaida}
    `;
  });
}



}

