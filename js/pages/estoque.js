import { requireAuth, goBack, showToast, formatBRL } from '../app.js';
import { ProductService } from '../../client/services/ProdutoService.js';
import { NotificationService } from '../../client/services/notificationService.js';
import { openInspect } from '../components/InspectModal.js';

window.NotificationService = NotificationService;

const CATEGORIAS = [
  { key: 'CELULAR', label: 'Celulares', icon: '📱' },
  { key: 'ACESSORIO', label: 'Acessórios', icon: '🎧' },
  { key: 'PECA', label: 'Peças', icon: '🔧' },
  { key: 'OUTRO', label: 'Outros', icon: '📦' },
];

async function init() {
  if (!requireAuth()) return;

  document.getElementById('btn-back').onclick = () => goBack();

  let produtos = [];
  let categoriaAtual = null;
  let listaAtual = [];

  // Controle de Tabs
  document.querySelectorAll('#est-tabs .tab').forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll('#est-tabs .tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      
      const isProdutos = tab.dataset.tab === 'produtos';
      document.getElementById('tab-produtos').classList.toggle('hidden', !isProdutos);
      document.getElementById('tab-entrada').classList.toggle('hidden', isProdutos);

      // Se voltar para a aba de produtos manualmente, cancela a edição
      if (isProdutos) modoCriacao();
    };
  });

  function navegarParaAba(tabName) {
    document.querySelector(`[data-tab="${tabName}"]`).click();
  }

  // ===== CATEGORIAS E LISTAS =====
  function atualizarContadores() {
    const counts = { CELULAR: 0, ACESSORIO: 0, PECA: 0, OUTRO: 0 };
    produtos.forEach((p) => {
      if (counts[p.categoria] !== undefined) counts[p.categoria]++;
    });
    Object.keys(counts).forEach((cat) => {
      const el = document.getElementById(`count-${cat}`);
      if (el) el.textContent = `${counts[cat]} item${counts[cat] !== 1 ? 's' : ''}`;
    });
  }

  function mostrarCategorias() {
    categoriaAtual = null;
    listaAtual = [];
    document.getElementById('cat-grid').style.display = 'grid';
    document.getElementById('est-list-header').style.display = 'none';
    document.getElementById('est-list').innerHTML =
      `<div class="empty-state"><div class="icon">📦</div><p>Selecione uma categoria acima.</p></div>`;
  }

  function abrirInspectProduto(p) {
    const criado = p.criado_em ? new Date(p.criado_em).toLocaleString('pt-BR') : '—';
    const atualizado = p.atualizado_em ? new Date(p.atualizado_em).toLocaleString('pt-BR') : '—';

    openInspect({
      title: 'Produto',
      subtitle: 'IDroid Virtual',
      fields: [
        { label: 'ID', value: `#${p.id}` },
        { label: 'Nome', value: p.nome || '—' },
        { label: 'Categoria', value: p.categoria || '—' },
        { label: 'Preço', value: formatBRL(p.preco), highlight: true },
        { label: 'Estoque', value: String(p.estoque ?? 0) },
        { label: 'Cadastrado em', value: criado },
        { label: 'Atualizado em', value: atualizado },
      ],
      footer: 'IDroid Virtual · Gestão',
    });
  }

  // ===== LÓGICA DE FORMULÁRIO (CRIAÇÃO / EDIÇÃO) =====
  const formEntrada = document.getElementById('form-entrada');
  const btnSalvar = document.getElementById('btn-salvar-ent');
  const tituloForm = document.getElementById('form-titulo');
  const editActions = document.getElementById('edit-actions');
  const inputId = document.getElementById('ent-id');

  function modoCriacao() {
    formEntrada.reset();
    inputId.value = '';
    tituloForm.textContent = 'Nova Entrada';
    btnSalvar.textContent = 'Registrar Entrada';
    document.getElementById('tab-btn-entrada').textContent = 'Entrada';
    editActions.style.display = 'none';
  }

  function modoEdicao(p) {
    inputId.value = p.id;
    document.getElementById('ent-nome').value = p.nome || '';
    document.getElementById('ent-categoria').value = p.categoria || 'OUTRO';
    document.getElementById('ent-preco').value = p.preco || 0;
    document.getElementById('ent-qtd').value = p.estoque ?? 0;
    
    tituloForm.textContent = 'Editar Produto';
    btnSalvar.textContent = 'Salvar Alterações';
    document.getElementById('tab-btn-entrada').textContent = 'Editar';
    editActions.style.display = 'flex';
    
    navegarParaAba('entrada');
  }

  document.getElementById('btn-cancelar-edicao').onclick = () => {
    modoCriacao();
    navegarParaAba('produtos');
  };

  // Submit do Formulário (Trata Criação E Edição)
  formEntrada.onsubmit = async (e) => {
    e.preventDefault();
    const id = inputId.value; // Se tem ID, é Edição. Se vazio, é Criação.
    const nome = document.getElementById('ent-nome').value.trim();
    const categoria = document.getElementById('ent-categoria').value;
    const preco = parseFloat(document.getElementById('ent-preco').value) || 0;
    const estoque = parseInt(document.getElementById('ent-qtd').value) || 0;

    if (!nome) {
      showToast('Nome é obrigatório', 'error');
      return;
    }

    try {
      let response;
      if (id) {
        // Modo Edição
        response = await ProductService.update({ id: Number(id), nome, categoria, preco, estoque });
      } else {
        // Modo Criação
        response = await ProductService.create({ nome, categoria, preco, estoque });
      }

      if (response.success) {
        showToast(id ? 'Produto atualizado!' : 'Entrada registrada!', 'success');
        modoCriacao();
        navegarParaAba('produtos');
        await carregarProdutos();
        if (categoriaAtual) recarregarListaDaCategoria();
      } else {
        showToast(response.message || 'Erro ao salvar produto', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erro de conexão', 'error');
    }
  };

  // Excluir Produto
  document.getElementById('btn-excluir-produto').onclick = async () => {
    const id = Number(inputId.value);
    const nome = document.getElementById('ent-nome').value;
    
    if (!confirm(`TEM CERTEZA que deseja excluir o produto "${nome}"?\nEsta ação não pode ser desfeita.`)) return;

    try {
      const response = await ProductService.remove(id);
      if (response.success) {
        showToast('Produto excluído com sucesso', 'success');
        modoCriacao();
        navegarParaAba('produtos');
        await carregarProdutos();
        if (categoriaAtual) recarregarListaDaCategoria();
      } else {
        showToast(response.message || 'Erro ao excluir', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erro de conexão', 'error');
    }
  };

  // ===== ATUALIZAR ESTOQUE RÁPIDO (+ e -) =====
  async function aplicarEstoque(produto, novoValor, inputEl) {
    const atual = Number(produto.estoque) || 0;
    const num = Number(novoValor);

    if (Number.isNaN(num) || num < 0) {
      showToast('Valor inválido', 'error');
      if (inputEl) inputEl.value = atual;
      return;
    }

    if (num === atual) return;

    try {
      const response = await ProductService.setStock(produto.id, num);
      if (response.success) {
        const novoEstoque = response.data?.estoque != null ? Number(response.data.estoque) : num;
        produto.estoque = novoEstoque;
        
        const idxGlobal = produtos.findIndex((x) => Number(x.id) === Number(produto.id));
        if (idxGlobal >= 0) produtos[idxGlobal].estoque = novoEstoque;

        const card = document.querySelector(`.list-item[data-id="${produto.id}"]`);
        if (card) {
          const sub = card.querySelector('.sub');
          if (sub) sub.textContent = `Estoque: ${novoEstoque}`;
          const input = card.querySelector('.stock-input');
          if (input) input.value = novoEstoque;
        }
        showToast(`Estoque atualizado`, 'success');
      } else {
        showToast(response.message || 'Erro ao atualizar', 'error');
        if (inputEl) inputEl.value = atual;
      }
    } catch (err) {
      showToast('Erro de conexão', 'error');
      if (inputEl) inputEl.value = atual;
    }
  }

  // ===== RENDERIZAR LISTA =====
  function renderLista(lista, titulo) {
    const el = document.getElementById('est-list');
    document.getElementById('cat-title').textContent = titulo;
    document.getElementById('est-list-header').style.display = 'flex';
    document.getElementById('cat-grid').style.display = 'none';
    listaAtual = lista || [];

    if (!lista.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📦</div><p>Nenhum produto nesta categoria.</p></div>`;
      return;
    }

    el.innerHTML = lista
      .map(
        (p) => `
      <div class="card list-item" data-id="${p.id}" style="cursor:pointer; display:flex; align-items:center;">
        <div class="info" style="flex:1; min-width:0; padding-right:8px;">
          <div class="title" title="${(p.nome || '').replace(/"/g, '&quot;')}">${p.nome || '—'}</div>
          <div class="sub">Estoque: ${p.estoque ?? 0}</div>
        </div>
        
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="fw-bold text-primary">${formatBRL(p.preco)}</div>
          <button type="button" class="btn btn-outline btn-sm action-edit" data-id="${p.id}" style="padding:4px 8px;" title="Editar">✏️</button>
        </div>

        <div class="stock-controls" style="display:flex;align-items:center;gap:4px;flex-shrink:0; margin-left: 8px;" onclick="event.stopPropagation()">
          <button type="button" class="btn btn-outline btn-sm stock-btn-minus" data-id="${p.id}" style="padding:4px 10px;min-width:32px" aria-label="Diminuir">−</button>
          <input type="number" class="stock-input" data-id="${p.id}" value="${p.estoque ?? 0}" min="0" inputmode="numeric" style="width:56px;padding:6px 4px;text-align:center;font-size:0.9rem" />
          <button type="button" class="btn btn-outline btn-sm stock-btn-plus" data-id="${p.id}" style="padding:4px 10px;min-width:32px" aria-label="Aumentar">+</button>
        </div>
      </div>
      `
      )
      .join('');

    // Clicar em Editar na lista
    el.querySelectorAll('.action-edit').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const produto = listaAtual.find((x) => Number(x.id) === id) || produtos.find((x) => Number(x.id) === id);
        if (produto) modoEdicao(produto);
      };
    });

    // Clicar no card para Inspecionar
    el.querySelectorAll('.list-item').forEach((card) => {
      card.onclick = (e) => {
        if (e.target.closest('.stock-controls') || e.target.closest('.action-edit')) return;
        const id = Number(card.dataset.id);
        const produto = listaAtual.find((x) => Number(x.id) === id) || produtos.find((x) => Number(x.id) === id);
        if (produto) abrirInspectProduto(produto);
      };
    });

    // Controles de Estoque (+ / -)
    el.querySelectorAll('.stock-btn-plus').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const produto = listaAtual.find((x) => Number(x.id) === id);
        if (!produto) return;
        const input = el.querySelector(`.stock-input[data-id="${id}"]`);
        aplicarEstoque(produto, Number(input.value) + 1, input);
      };
    });

    el.querySelectorAll('.stock-btn-minus').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const produto = listaAtual.find((x) => Number(x.id) === id);
        if (!produto) return;
        const input = el.querySelector(`.stock-input[data-id="${id}"]`);
        aplicarEstoque(produto, Math.max(0, Number(input.value) - 1), input);
      };
    });

    el.querySelectorAll('.stock-input').forEach((input) => {
      input.onclick = (e) => e.stopPropagation();
      input.onchange = (e) => {
        e.stopPropagation();
        const id = Number(input.dataset.id);
        const produto = listaAtual.find((x) => Number(x.id) === id);
        if (produto) aplicarEstoque(produto, input.value, input);
      };
    });
  }

  // Clicar nas categorias
  document.querySelectorAll('#cat-grid .grid-card').forEach((card) => {
    card.onclick = async () => {
      const cat = card.dataset.categoria;
      categoriaAtual = cat;
      recarregarListaDaCategoria();
    };
  });

  async function recarregarListaDaCategoria() {
    if (!categoriaAtual) return;
    const meta = CATEGORIAS.find((c) => c.key === categoriaAtual);
    try {
      const response = await ProductService.listByCategory(categoriaAtual);
      renderLista(response.success ? response.data : [], meta ? meta.label : categoriaAtual);
    } catch (err) {
      renderLista([], meta ? meta.label : categoriaAtual);
    }
  }

  document.getElementById('btn-voltar-cats').onclick = () => mostrarCategorias();

  // Load Inicial
  async function carregarProdutos() {
    try {
      const response = await ProductService.listAll();
      produtos = response.success && Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      produtos = [];
    } finally {
      atualizarContadores();
    }
  }

  await carregarProdutos();
  mostrarCategorias();
}

init();