export class DetalhePagamento {
  /**
   * @param {Object} data
   */
  constructor(data = {}) {
    this.forma_pagamento = data.formaPagamento || data.forma_pagamento || '';
    this.total = Number(data.total || 0);
  }
}

export class ResumoFinanceiro {
  /**
   * @param {Object} data
   */
  constructor(data = {}) {
    const inicio = data.periodoInicio || data.periodo_inicio;
    const fim = data.periodoFim || data.periodo_fim;

    this.periodo_inicio = inicio ? new Date(inicio) : null;
    this.periodo_fim = fim ? new Date(fim) : null;

    // Vendas de Produtos
    this.total_vendas = Number(data.totalVendas ?? data.total_vendas ?? 0);
    this.valor_trocas_cedidas = Number(data.valorTrocasCedidas ?? data.valor_trocas_cedidas ?? 0);
    this.receita_liquida_vendas = Number(data.receitaLiquidaVendas ?? data.receita_liquida_vendas ?? 0);
    this.quantidade_vendas = Number(data.quantidadeVendas ?? data.quantidade_vendas ?? 0);
    this.ticket_medio_venda = Number(data.ticketMedioVenda ?? data.ticket_medio_venda ?? 0);
    this.descontos_totais = Number(data.descontosTotais ?? data.descontos_totais ?? 0);

    // Ordens de Serviço
    this.total_servicos = Number(data.totalServicos ?? data.total_servicos ?? 0);
    this.custo_servicos = Number(data.custoServicos ?? data.custo_servicos ?? 0);
    this.lucro_servicos = Number(data.lucroServicos ?? data.lucro_servicos ?? 0);
    this.quantidade_os = Number(data.quantidadeOS ?? data.quantidade_os ?? 0);
    this.ticket_medio_servico = Number(data.ticketMedioServico ?? data.ticket_medio_servico ?? 0);

    // Ativo em estoque (trocas recebidas)
    this.valor_trocas_recebidas = Number(data.valorTrocasRecebidas ?? data.valor_trocas_recebidas ?? 0);
    this.quantidade_trocas = Number(data.quantidadeTrocas ?? data.quantidade_trocas ?? 0);

    // Faturamento e Formas de Pagamento
    this.faturamento_bruto = Number(data.faturamentoBruto ?? data.faturamento_bruto ?? 0);

    const fpList = data.formasPagamento || data.formas_pagamento;
    this.formas_pagamento = Array.isArray(fpList)
      ? fpList.map(fp => new DetalhePagamento(fp))
      : [];

    // Despesas e Perdas
    this.total_despesas = Number(data.totalDespesas ?? data.total_despesas ?? 0);
    this.valor_estoque_perdido = Number(data.valorEstoquePerdido ?? data.valor_estoque_perdido ?? 0);
    this.quantidade_perdas = Number(data.quantidadePerdas ?? data.quantidade_perdas ?? 0);

    // Resultado final
    this.lucro_bruto = Number(data.lucroBruto ?? data.lucro_bruto ?? 0);
    this.lucro_liquido = Number(data.lucroLiquido ?? data.lucro_liquido ?? 0);
    this.margem_lucro = Number(data.margemLucro ?? data.margem_lucro ?? 0);
  }
}
