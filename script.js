// RepairPro - Sistema Profissional de Gestão de Consertos
class RepairProSystem {
    constructor() {
        this.produtos = this.carregarProdutos();
        this.currentPage = 'dashboard';
        this.sidebarCollapsed = false;
        this.inicializar();
    }

    inicializar() {
        this.configurarEventos();
        this.configurarNavegacao();
        this.carregarPreferencias();
        this.atualizarRelogio();
        this.carregarPagina('dashboard');
        this.iniciarAtualizacaoAutomatica();
        this.iniciarMonitoramentoAPI();
    }

    configurarEventos() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Mobile menu toggle
        document.getElementById('mobileMenuToggle').addEventListener('click', () => {
            this.toggleMobileSidebar();
        });

        // Theme toggle
        document.getElementById('btnTheme').addEventListener('click', () => {
            this.alternarTema();
        });

        // Notifications
        document.getElementById('btnNotifications').addEventListener('click', () => {
            this.toggleNotifications();
        });

        // Fullscreen
        document.getElementById('btnFullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Close notifications
        document.getElementById('closeNotifications').addEventListener('click', () => {
            this.fecharNotifications();
        });

        // Modal close
        document.getElementById('closeModalDetalhado').addEventListener('click', () => {
            this.fecharModalDetalhado();
        });

        // Overlay click
        document.getElementById('overlay').addEventListener('click', () => {
            this.fecharNotifications();
        });
    }

    configurarNavegacao() {
        // Menu items navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navegarPara(page);
            });
        });
    }

    navegarPara(page) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        // Update breadcrumb
        document.getElementById('currentPage').textContent = this.getPageTitle(page);
        
        // Load page content
        this.carregarPagina(page);
        this.currentPage = page;
    }

    getPageTitle(page) {
        const titles = {
            'dashboard': 'Dashboard',
            'produtos': 'Produtos',
            'cadastro': 'Novo Produto',
            'relatorios': 'Relatórios',
            'configuracoes': 'Configurações'
        };
        return titles[page] || 'Dashboard';
    }

    carregarPagina(page) {
        const container = document.getElementById('pageContainer');
        
        switch(page) {
            case 'dashboard':
                container.innerHTML = this.renderDashboard();
                this.atualizarEstatisticas();
                break;
            case 'produtos':
                container.innerHTML = this.renderProdutos();
                this.configurarEventosProdutos();
                this.atualizarListaProdutos();
                break;
            case 'cadastro':
                container.innerHTML = this.renderCadastro();
                this.definirDataAtual();
                this.configurarFormulario();
                break;
            case 'relatorios':
                container.innerHTML = this.renderRelatorios();
                this.gerarRelatorios();
                break;
            case 'configuracoes':
                container.innerHTML = this.renderConfiguracoes();
                break;
        }
    }

    renderDashboard() {
        return `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-title">Produtos em Reparo</span>
                        <div class="stat-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="totalProdutos">0</div>
                    <div class="stat-change neutral">
                        <i class="fas fa-minus"></i>
                        <span>Sem alteração</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-title">Produtos Urgentes</span>
                        <div class="stat-icon" style="background: var(--error-100); color: var(--error-500);">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="produtosUrgentes">0</div>
                    <div class="stat-change negative">
                        <i class="fas fa-arrow-up"></i>
                        <span>Mais de 7 dias</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-title">Concluídos Hoje</span>
                        <div class="stat-icon" style="background: var(--success-100); color: var(--success-500);">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="produtosConcluidos">0</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+12% hoje</span>
                    </div>
                </div>
            </div>
            
            <div class="products-grid" id="dashboardProdutos">
                <!-- Recent products will be loaded here -->
            </div>
        `;
    }

    renderProdutos() {
        return `
            <div class="products-header">
                <h1 class="page-title">Gestão de Produtos</h1>
                <div class="products-actions">
                    <button class="btn-secondary" onclick="sistema.exportarDados()">
                        <i class="fas fa-download"></i>
                        Exportar
                    </button>
                    <button class="btn-primary" onclick="sistema.navegarPara('cadastro')">
                        <i class="fas fa-plus"></i>
                        Novo Produto
                    </button>
                </div>
            </div>
            
            <div class="products-filters">
                <div class="filters-row">
                    <div class="filter-group">
                        <label class="filter-label">Buscar</label>
                        <div class="search-wrapper">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" class="search-input" id="campoBusca" placeholder="Buscar por cliente, produto ou problema...">
                        </div>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Prioridade</label>
                        <select class="filter-select" id="filtroPrioridade">
                            <option value="todas">Todas</option>
                            <option value="urgente">Urgente</option>
                            <option value="alta">Alta</option>
                            <option value="normal">Normal</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Período</label>
                        <select class="filter-select" id="filtroDias">
                            <option value="todos">Todos</option>
                            <option value="hoje">Hoje</option>
                            <option value="semana">Esta Semana</option>
                            <option value="urgentes">Mais de 7 Dias</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Ordenar</label>
                        <select class="filter-select" id="filtroOrdem">
                            <option value="data">Por Data</option>
                            <option value="prioridade">Por Prioridade</option>
                            <option value="dias">Por Dias</option>
                            <option value="cliente">Por Cliente</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="products-grid" id="listaProdutos">
                <!-- Products will be loaded here -->
            </div>
        `;
    }

    // Métodos de navegação e interface
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        this.sidebarCollapsed = !this.sidebarCollapsed;
        localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
    }

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
    }

    alternarTema() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        
        const btn = document.getElementById('btnTheme');
        const icon = btn.querySelector('i');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleNotifications() {
        const panel = document.getElementById('notificationPanel');
        const overlay = document.getElementById('overlay');
        panel.classList.toggle('active');
        overlay.classList.toggle('active');
        this.carregarNotificacoes();
    }

    fecharNotifications() {
        document.getElementById('notificationPanel').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    atualizarRelogio() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('currentTime').textContent = timeString;
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }

    carregarNotificacoes() {
        const produtosUrgentes = this.produtos.filter(p => 
            p.status === 'em_reparo' && this.calcularDias(p.dataEntrada) > 7
        );
        
        const notificationList = document.getElementById('notificationList');
        const notificationCount = document.getElementById('notificationCount');
        const notificationBadge = document.querySelector('.notification-badge');
        
        // Atualiza o contador - só mostra se houver notificações
        if (produtosUrgentes.length === 0) {
            notificationList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhuma notificação</p>';
            // Esconde o badge se não houver notificações
            if (notificationBadge) {
                notificationBadge.style.display = 'none';
            }
            return;
        }
        
        // Mostra o badge com o número real de notificações
        if (notificationBadge) {
            notificationBadge.style.display = 'block';
            notificationCount.textContent = produtosUrgentes.length;
        }
        
        notificationList.innerHTML = produtosUrgentes.map(produto => {
            const dias = this.calcularDias(produto.dataEntrada);
            const urgencia = dias > 10 ? 'crítico' : 'urgente';
            const cor = dias > 10 ? 'var(--error-600)' : 'var(--warning-500)';
            
            return `
                <div class="notification-item" style="padding: 1rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s;" 
                     onclick="sistema.abrirDetalhes('${produto.id}')"
                     onmouseover="this.style.background='var(--neutral-50)'"
                     onmouseout="this.style.background='transparent'">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 10px; height: 10px; background: ${cor}; border-radius: 50%; animation: pulse 2s infinite;"></div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                                ${produto.produto} 
                                <span style="background: ${cor}; color: white; font-size: 0.625rem; padding: 2px 6px; border-radius: 4px; margin-left: 0.5rem; text-transform: uppercase;">
                                    ${urgencia}
                                </span>
                            </div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                ${produto.nomeCliente} - ${dias} dias aguardando
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    definirDataAtual() {
        const dataInput = document.getElementById('dataEntrada');
        if (dataInput) {
            const hoje = new Date().toISOString().split('T')[0];
            dataInput.value = hoje;
        }
    }

    renderCadastro() {
        return `
            <div class="form-container">
                <div class="form-header">
                    <div class="form-header-icon">
                        <i class="fas fa-plus-circle"></i>
                    </div>
                    <div>
                        <h1 class="form-title">Cadastrar Novo Produto</h1>
                        <p class="form-description">Preencha as informações do produto para reparo</p>
                    </div>
                </div>
                
                <form id="produtoForm" class="premium-form">
                    <div class="form-grid">
                        <div class="form-field">
                            <label class="form-label" for="nomeCliente">
                                <i class="fas fa-user"></i>
                                Nome do Cliente
                            </label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="nomeCliente" 
                                placeholder="Digite o nome completo"
                                required
                                autocomplete="name">
                        </div>
                        
                        <div class="form-field">
                            <label class="form-label" for="telefone">
                                <i class="fas fa-phone"></i>
                                Telefone
                            </label>
                            <input 
                                type="tel" 
                                class="form-input" 
                                id="telefone" 
                                placeholder="(00) 00000-0000"
                                required
                                autocomplete="tel">
                        </div>
                        
                        <div class="form-field form-field-full">
                            <label class="form-label" for="produto">
                                <i class="fas fa-box"></i>
                                Produto
                            </label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="produto" 
                                placeholder="Ex: Micro-ondas Electrolux 30L"
                                required>
                        </div>
                        
                        <div class="form-field form-field-full">
                            <label class="form-label" for="problema">
                                <i class="fas fa-exclamation-circle"></i>
                                Problema Relatado
                            </label>
                            <textarea 
                                class="form-input form-textarea" 
                                id="problema" 
                                placeholder="Descreva o problema relatado pelo cliente..."
                                rows="3"
                                required></textarea>
                        </div>
                        
                        <div class="form-field">
                            <label class="form-label" for="dataEntrada">
                                <i class="fas fa-calendar"></i>
                                Data de Entrada
                            </label>
                            <input 
                                type="date" 
                                class="form-input" 
                                id="dataEntrada" 
                                required>
                        </div>
                        
                        <div class="form-field">
                            <label class="form-label" for="prioridade">
                                <i class="fas fa-flag"></i>
                                Prioridade
                            </label>
                            <select class="form-input" id="prioridade">
                                <option value="normal">🟢 Normal</option>
                                <option value="alta">🟡 Alta</option>
                                <option value="urgente">🔴 Urgente</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="sistema.navegarPara('produtos')">
                            <i class="fas fa-arrow-left"></i>
                            Voltar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-check-circle"></i>
                            Cadastrar Produto
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    configurarFormulario() {
        const form = document.getElementById('produtoForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.cadastrarProduto();
            });
            
            // Máscara de telefone
            const telefoneInput = document.getElementById('telefone');
            if (telefoneInput) {
                telefoneInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 11) {
                        value = value.replace(/(\d{2})(\d)/, '($1) $2');
                        value = value.replace(/(\d{5})(\d)/, '$1-$2');
                    }
                    e.target.value = value;
                });
            }
        }
    }

    configurarEventosProdutos() {
        // Eventos dos filtros
        const filtroOrdem = document.getElementById('filtroOrdem');
        const filtroPrioridade = document.getElementById('filtroPrioridade');
        const filtroDias = document.getElementById('filtroDias');
        const campoBusca = document.getElementById('campoBusca');

        if (filtroOrdem) {
            filtroOrdem.addEventListener('change', () => {
                this.atualizarListaProdutos();
            });
        }

        if (filtroPrioridade) {
            filtroPrioridade.addEventListener('change', () => {
                this.atualizarListaProdutos();
            });
        }

        if (filtroDias) {
            filtroDias.addEventListener('change', () => {
                this.atualizarListaProdutos();
            });
        }

        if (campoBusca) {
            campoBusca.addEventListener('input', () => {
                this.atualizarListaProdutos();
            });
        }
    }

    cadastrarProduto() {
        console.log('Iniciando cadastro de produto...');
        
        // Coleta os dados do formulário
        const nomeCliente = document.getElementById('nomeCliente');
        const telefone = document.getElementById('telefone');
        const produto = document.getElementById('produto');
        const problema = document.getElementById('problema');
        const dataEntrada = document.getElementById('dataEntrada');
        const prioridade = document.getElementById('prioridade');

        // Verifica se todos os elementos existem
        if (!nomeCliente || !telefone || !produto || !problema || !dataEntrada || !prioridade) {
            console.error('Campos não encontrados:', {
                nomeCliente: !!nomeCliente,
                telefone: !!telefone,
                produto: !!produto,
                problema: !!problema,
                dataEntrada: !!dataEntrada,
                prioridade: !!prioridade
            });
            this.mostrarNotificacao('Erro ao encontrar campos do formulário', 'error');
            return;
        }

        const dadosProduto = {
            id: this.gerarId(),
            nomeCliente: nomeCliente.value.trim(),
            telefone: telefone.value.trim(),
            produto: produto.value.trim(),
            problema: problema.value.trim(),
            dataEntrada: dataEntrada.value,
            prioridade: prioridade.value,
            status: 'em_reparo',
            dataCadastro: new Date().toISOString()
        };

        // Validação básica
        if (!this.validarProduto(dadosProduto)) {
            return;
        }

        // Adiciona o produto à lista
        this.produtos.push(dadosProduto);
        console.log('Produto adicionado:', dadosProduto);
        console.log('Total de produtos:', this.produtos.length);
        
        // Salva no localStorage
        this.salvarProdutos();
        
        // Atualiza a interface
        this.atualizarInterface();
        
        // Limpa o formulário
        this.limparFormulario();
        
        // Mostra mensagem de sucesso e navega para a lista
        this.mostrarNotificacao('Produto cadastrado com sucesso!', 'success');
        
        // Navega para a página de produtos após o cadastro
        setTimeout(() => {
            this.navegarPara('produtos');
        }, 1500);
    }

    validarProduto(produto) {
        const campos = ['nomeCliente', 'telefone', 'produto', 'problema', 'dataEntrada'];
        
        for (let campo of campos) {
            if (!produto[campo] || produto[campo].trim() === '') {
                this.mostrarNotificacao(`Por favor, preencha o campo ${this.getNomeCampo(campo)}`, 'error');
                return false;
            }
        }

        // Validação de telefone básica
        const telefoneRegex = /[\d\s\-\(\)]+/;
        if (!telefoneRegex.test(produto.telefone)) {
            this.mostrarNotificacao('Telefone inválido', 'error');
            return false;
        }

        // Validação de data
        const dataEntrada = new Date(produto.dataEntrada);
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999); // Fim do dia de hoje
        
        if (dataEntrada > hoje) {
            this.mostrarNotificacao('A data de entrada não pode ser futura', 'error');
            return false;
        }

        return true;
    }

    getNomeCampo(campo) {
        const nomes = {
            'nomeCliente': 'Nome do Cliente',
            'telefone': 'Telefone',
            'produto': 'Produto',
            'problema': 'Problema Relatado',
            'dataEntrada': 'Data de Entrada'
        };
        return nomes[campo] || campo;
    }

    limparFormulario() {
        const form = document.getElementById('produtoForm');
        if (form) {
            form.reset();
            this.definirDataAtual();
        }
    }

    calcularDias(dataEntrada) {
        const entrada = new Date(dataEntrada);
        const hoje = new Date();
        const diferenca = hoje - entrada;
        return Math.floor(diferenca / (1000 * 60 * 60 * 24));
    }

    atualizarInterface() {
        this.atualizarEstatisticas();
        this.atualizarListaProdutos();
    }

    atualizarEstatisticas() {
        const produtosAtivos = this.produtos.filter(p => p.status === 'em_reparo');
        const produtosUrgentes = produtosAtivos.filter(p => this.calcularDias(p.dataEntrada) > 7);
        const produtosConcluidos = this.produtos.filter(p => {
            if (p.status !== 'concluido') return false;
            const hoje = new Date().toDateString();
            const dataConclusao = new Date(p.dataConclusao || p.dataCadastro).toDateString();
            return hoje === dataConclusao;
        });

        document.getElementById('totalProdutos').textContent = produtosAtivos.length;
        document.getElementById('produtosUrgentes').textContent = produtosUrgentes.length;
        document.getElementById('produtosConcluidos').textContent = produtosConcluidos.length;
    }

    atualizarListaProdutos() {
        const container = document.getElementById('listaProdutos');
        const filtroOrdem = document.getElementById('filtroOrdem').value;
        const filtroPrioridade = document.getElementById('filtroPrioridade').value;
        const filtroDias = document.getElementById('filtroDias').value;
        const termoBusca = document.getElementById('campoBusca').value.toLowerCase().trim();
        
        // Filtra apenas produtos em reparo
        let produtosAtivos = this.produtos.filter(p => p.status === 'em_reparo');
        
        // Aplica filtros
        produtosAtivos = this.aplicarFiltros(produtosAtivos, filtroPrioridade, filtroDias, termoBusca);
        
        // Ordena os produtos
        produtosAtivos = this.ordenarProdutos(produtosAtivos, filtroOrdem);
        
        // Atualiza informações de resultados
        this.atualizarInfoResultados(produtosAtivos.length, this.produtos.filter(p => p.status === 'em_reparo').length);
        
        if (produtosAtivos.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = produtosAtivos.map(produto => this.criarCardProduto(produto)).join('');
    }

    aplicarFiltros(produtos, filtroPrioridade, filtroDias, termoBusca) {
        let produtosFiltrados = produtos;

        // Filtro por prioridade
        if (filtroPrioridade !== 'todas') {
            produtosFiltrados = produtosFiltrados.filter(p => p.prioridade === filtroPrioridade);
        }

        // Filtro por dias
        if (filtroDias !== 'todos') {
            const hoje = new Date();
            produtosFiltrados = produtosFiltrados.filter(p => {
                const dias = this.calcularDias(p.dataEntrada);
                switch (filtroDias) {
                    case 'hoje':
                        return dias === 0;
                    case 'semana':
                        return dias <= 7;
                    case 'urgentes':
                        return dias > 7;
                    default:
                        return true;
                }
            });
        }

        // Filtro por busca
        if (termoBusca) {
            produtosFiltrados = produtosFiltrados.filter(p => 
                p.nomeCliente.toLowerCase().includes(termoBusca) ||
                p.produto.toLowerCase().includes(termoBusca) ||
                p.problema.toLowerCase().includes(termoBusca) ||
                p.telefone.includes(termoBusca)
            );
        }

        return produtosFiltrados;
    }

    ordenarProdutos(produtos, filtro) {
        switch (filtro) {
            case 'data':
                return produtos.sort((a, b) => new Date(a.dataEntrada) - new Date(b.dataEntrada));
            case 'prioridade':
                const prioridades = { 'urgente': 3, 'alta': 2, 'normal': 1 };
                return produtos.sort((a, b) => {
                    const prioridadeA = prioridades[a.prioridade];
                    const prioridadeB = prioridades[b.prioridade];
                    if (prioridadeA !== prioridadeB) {
                        return prioridadeB - prioridadeA;
                    }
                    return new Date(a.dataEntrada) - new Date(b.dataEntrada);
                });
            case 'dias':
                return produtos.sort((a, b) => {
                    const diasA = this.calcularDias(a.dataEntrada);
                    const diasB = this.calcularDias(b.dataEntrada);
                    return diasB - diasA;
                });
            case 'cliente':
                return produtos.sort((a, b) => a.nomeCliente.localeCompare(b.nomeCliente));
            default:
                return produtos;
        }
    }

    criarCardProduto(produto) {
        const dias = this.calcularDias(produto.dataEntrada);
        const dataFormatada = this.formatarData(produto.dataEntrada);
        
        // Determina as classes CSS baseadas nos dias e prioridade
        let cardClass = 'product-card';
        let diasBadgeClass = 'days-badge';
        
        if (produto.prioridade !== 'normal') {
            cardClass += ` priority-${produto.prioridade}`;
        }
        
        if (dias > 10) {
            cardClass += ' days-danger';
            diasBadgeClass += ' danger';
        } else if (dias > 7) {
            cardClass += ' days-warning';
            diasBadgeClass += ' warning';
        }

        return `
            <div class="${cardClass}" data-id="${produto.id}" onclick="sistema.abrirModalDetalhado('${produto.id}')">
                <div class="product-header">
                    <div class="product-info">
                        <h3><i class="fas fa-box product-icon"></i> ${produto.produto}</h3>
                        <p><i class="fas fa-user"></i> ${produto.nomeCliente} <span class="separator">•</span> <i class="fas fa-phone"></i> ${produto.telefone}</p>
                    </div>
                    <div class="product-status">
                        <div class="${diasBadgeClass}">
                            <i class="fas fa-clock"></i> ${dias} ${dias === 1 ? 'dia' : 'dias'}
                        </div>
                        <div class="priority-badge priority-${produto.prioridade}">
                            ${this.getPrioridadeIcon(produto.prioridade)} ${produto.prioridade}
                        </div>
                    </div>
                </div>
                
                <div class="product-details">
                    <div class="detail-row">
                        <i class="fas fa-exclamation-circle detail-icon"></i>
                        <div class="detail-content">
                            <span class="detail-label">Problema</span>
                            <span class="detail-value">${produto.problema}</span>
                        </div>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-calendar detail-icon"></i>
                        <div class="detail-content">
                            <span class="detail-label">Data de Entrada</span>
                            <span class="detail-value">${dataFormatada}</span>
                        </div>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-list-ol detail-icon"></i>
                        <div class="detail-content">
                            <span class="detail-label">Posição na Fila</span>
                            <span class="detail-value">${this.calcularPosicaoFila(produto)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="product-actions" onclick="event.stopPropagation()">
                    <button class="btn-action btn-complete" onclick="sistema.concluirProduto('${produto.id}')">
                        <i class="fas fa-check-circle"></i> Concluir
                    </button>
                    <button class="btn-action btn-delete" onclick="sistema.excluirProduto('${produto.id}')">
                        <i class="fas fa-trash-alt"></i> Excluir
                    </button>
                </div>
            </div>
        `;
    }

    getPrioridadeIcon(prioridade) {
        const icons = {
            'urgente': '🔴',
            'alta': '🟡',
            'normal': '🟢'
        };
        return icons[prioridade] || '🟢';
    }

    calcularPosicaoFila(produto) {
        const produtosAtivos = this.produtos
            .filter(p => p.status === 'em_reparo')
            .sort((a, b) => new Date(a.dataEntrada) - new Date(b.dataEntrada));
        
        const posicao = produtosAtivos.findIndex(p => p.id === produto.id) + 1;
        return `${posicao}º na fila`;
    }

    formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhum produto em reparo</h3>
                <p>Cadastre o primeiro produto para começar o controle</p>
            </div>
        `;
    }

    concluirProduto(id) {
        if (confirm('Tem certeza que deseja marcar este produto como concluído?')) {
            const produto = this.produtos.find(p => p.id === id);
            if (produto) {
                produto.status = 'concluido';
                produto.dataConclusao = new Date().toISOString();
                this.salvarProdutos();
                this.atualizarInterface();
                this.mostrarNotificacao('✅ Produto marcado como concluído!', 'success');
            }
        }
    }

    excluirProduto(id) {
        if (confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
            this.produtos = this.produtos.filter(p => p.id !== id);
            this.salvarProdutos();
            this.atualizarInterface();
            this.mostrarNotificacao('✅ Produto excluído com sucesso!', 'success');
        }
    }

    abrirModalDetalhado(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (!produto) return;

        const dias = this.calcularDias(produto.dataEntrada);
        const dataFormatada = this.formatarData(produto.dataEntrada);
        const dataCadastro = new Date(produto.dataCadastro).toLocaleString('pt-BR');

        const modalHTML = `
            <div class="modal-overlay active" id="modalDetalhado" onclick="if(event.target === this) sistema.fecharModalDetalhado()">
                <div class="modal-container modal-detalhado">
                    <div class="modal-header">
                        <div class="modal-header-content">
                            <div class="modal-icon-badge priority-${produto.prioridade}">
                                <i class="fas fa-box-open"></i>
                            </div>
                            <div>
                                <h2 class="modal-title">${produto.produto}</h2>
                                <p class="modal-subtitle">Detalhes Completos do Produto</p>
                            </div>
                        </div>
                        <button class="modal-close-btn" onclick="sistema.fecharModalDetalhado()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="modal-body">
                        <div class="modal-section">
                            <h3 class="section-title"><i class="fas fa-user"></i> Informações do Cliente</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Nome</span>
                                    <span class="info-value">${produto.nomeCliente}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Telefone</span>
                                    <span class="info-value">${produto.telefone}</span>
                                </div>
                            </div>
                        </div>

                        <div class="modal-section">
                            <h3 class="section-title"><i class="fas fa-wrench"></i> Detalhes do Reparo</h3>
                            <div class="info-grid">
                                <div class="info-item info-full">
                                    <span class="info-label">Produto</span>
                                    <span class="info-value">${produto.produto}</span>
                                </div>
                                <div class="info-item info-full">
                                    <span class="info-label">Problema Relatado</span>
                                    <span class="info-value">${produto.problema}</span>
                                </div>
                            </div>
                        </div>

                        <div class="modal-section">
                            <h3 class="section-title"><i class="fas fa-calendar-alt"></i> Cronologia</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Data de Entrada</span>
                                    <span class="info-value">${dataFormatada}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Tempo em Reparo</span>
                                    <span class="info-value"><i class="fas fa-clock"></i> ${dias} ${dias === 1 ? 'dia' : 'dias'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Posição na Fila</span>
                                    <span class="info-value">${this.calcularPosicaoFila(produto)}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Prioridade</span>
                                    <span class="info-value priority-badge-inline priority-${produto.prioridade}">${this.getPrioridadeIcon(produto.prioridade)} ${produto.prioridade.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn-modal btn-modal-secondary" onclick="sistema.fecharModalDetalhado()">
                            <i class="fas fa-times"></i> Fechar
                        </button>
                        <button class="btn-modal btn-modal-success" onclick="sistema.concluirProduto('${produto.id}'); sistema.fecharModalDetalhado()">
                            <i class="fas fa-check-circle"></i> Concluir
                        </button>
                        <button class="btn-modal btn-modal-danger" onclick="if(confirm('Deseja realmente excluir?')) { sistema.excluirProduto('${produto.id}'); sistema.fecharModalDetalhado(); }">
                            <i class="fas fa-trash-alt"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modalExistente = document.getElementById('modalDetalhado');
        if (modalExistente) modalExistente.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    fecharModalDetalhado() {
        const modal = document.getElementById('modalDetalhado');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Remove notificações existentes
        const notificacoesExistentes = document.querySelectorAll('.toast-notification');
        notificacoesExistentes.forEach(n => n.remove());

        // Cria nova notificação toast premium
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${tipo}`;
        
        const iconMap = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };

        const colorMap = {
            'success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            'error': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            'warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            'info': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${iconMap[tipo]}"></i>
            </div>
            <div class="toast-content">
                <span class="toast-message">${mensagem}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        toast.style.background = colorMap[tipo];

        document.body.appendChild(toast);

        // Remove após 4 segundos com animação
        setTimeout(() => {
            toast.style.animation = 'slideOutDown 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    getIconeNotificacao(tipo) {
        const icones = {
            'success': 'check-circle',
            'error': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icones[tipo] || 'info-circle';
    }

    getCorNotificacao(tipo) {
        const cores = {
            'success': '#27ae60',
            'error': '#e74c3c',
            'warning': '#f39c12',
            'info': '#3498db'
        };
        return cores[tipo] || '#3498db';
    }

    iniciarAtualizacaoAutomatica() {
        // Atualiza a interface a cada minuto para manter os contadores de dias atualizados
        setInterval(() => {
            this.atualizarInterface();
        }, 60000); // 60 segundos
    }

    // Métodos de persistência
    salvarProdutos() {
        try {
            localStorage.setItem('sistemaConsertos_produtos', JSON.stringify(this.produtos));
        } catch (error) {
            console.error('Erro ao salvar produtos:', error);
            this.mostrarNotificacao('Erro ao salvar dados', 'error');
        }
    }

    carregarProdutos() {
        try {
            const dados = localStorage.getItem('sistemaConsertos_produtos');
            return dados ? JSON.parse(dados) : [];
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            return [];
        }
    }

    // Novas funcionalidades avançadas
    
    limparFiltros() {
        document.getElementById('filtroPrioridade').value = 'todas';
        document.getElementById('filtroDias').value = 'todos';
        document.getElementById('filtroOrdem').value = 'data';
        document.getElementById('campoBusca').value = '';
        this.atualizarListaProdutos();
        this.mostrarNotificacao('Filtros limpos', 'info');
    }

    atualizarInfoResultados(resultados, total) {
        const info = document.getElementById('resultadosInfo');
        if (resultados === total) {
            info.textContent = `Mostrando todos os ${total} produtos`;
        } else {
            info.textContent = `Mostrando ${resultados} de ${total} produtos`;
        }
    }

    abrirRelatorios() {
        this.gerarRelatorios();
        document.getElementById('modalRelatorios').style.display = 'block';
    }

    fecharModal() {
        document.getElementById('modalRelatorios').style.display = 'none';
    }

    gerarRelatorios() {
        const produtosAtivos = this.produtos.filter(p => p.status === 'em_reparo');
        const produtosConcluidos = this.produtos.filter(p => p.status === 'concluido');
        
        // Resumo Geral
        this.gerarResumoGeral(produtosAtivos, produtosConcluidos);
        
        // Relatório por Prioridade
        this.gerarRelatorioPrioridade(produtosAtivos);
        
        // Tempo Médio
        this.gerarRelatorioTempo(produtosConcluidos);
        
        // Histórico
        this.gerarRelatorioHistorico();
    }

    gerarResumoGeral(ativos, concluidos) {
        const urgentes = ativos.filter(p => this.calcularDias(p.dataEntrada) > 7);
        const tempoMedio = this.calcularTempoMedio(concluidos);
        
        const html = `
            <div class="stat-item">
                <span class="stat-label">Produtos em Reparo:</span>
                <span class="stat-value">${ativos.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Produtos Concluídos:</span>
                <span class="stat-value">${concluidos.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Produtos Urgentes:</span>
                <span class="stat-value">${urgentes.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Tempo Médio de Reparo:</span>
                <span class="stat-value">${tempoMedio} dias</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Taxa de Conclusão:</span>
                <span class="stat-value">${this.calcularTaxaConclusao()}%</span>
            </div>
        `;
        
        document.getElementById('resumoGeral').innerHTML = html;
    }

    gerarRelatorioPrioridade(produtos) {
        const prioridades = {
            'urgente': produtos.filter(p => p.prioridade === 'urgente').length,
            'alta': produtos.filter(p => p.prioridade === 'alta').length,
            'normal': produtos.filter(p => p.prioridade === 'normal').length
        };
        
        const total = produtos.length || 1;
        
        const html = `
            <div class="priority-chart">
                <div class="priority-bar priority-urgente">
                    <span class="priority-label">Urgente:</span>
                    <div class="priority-bar-fill" style="width: ${(prioridades.urgente / total) * 100}%"></div>
                    <span class="priority-count">${prioridades.urgente}</span>
                </div>
                <div class="priority-bar priority-alta">
                    <span class="priority-label">Alta:</span>
                    <div class="priority-bar-fill" style="width: ${(prioridades.alta / total) * 100}%"></div>
                    <span class="priority-count">${prioridades.alta}</span>
                </div>
                <div class="priority-bar priority-normal">
                    <span class="priority-label">Normal:</span>
                    <div class="priority-bar-fill" style="width: ${(prioridades.normal / total) * 100}%"></div>
                    <span class="priority-count">${prioridades.normal}</span>
                </div>
            </div>
        `;
        
        document.getElementById('relatorioPrioridade').innerHTML = html;
    }

    gerarRelatorioTempo(concluidos) {
        const tempoMedio = this.calcularTempoMedio(concluidos);
        const tempoMinimo = this.calcularTempoMinimo(concluidos);
        const tempoMaximo = this.calcularTempoMaximo(concluidos);
        
        const html = `
            <div class="stat-item">
                <span class="stat-label">Tempo Médio:</span>
                <span class="stat-value">${tempoMedio} dias</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Tempo Mínimo:</span>
                <span class="stat-value">${tempoMinimo} dias</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Tempo Máximo:</span>
                <span class="stat-value">${tempoMaximo} dias</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Produtos este Mês:</span>
                <span class="stat-value">${this.contarProdutosMes()}</span>
            </div>
        `;
        
        document.getElementById('relatorioTempo').innerHTML = html;
    }

    gerarRelatorioHistorico() {
        const recentes = this.produtos
            .filter(p => p.status === 'concluido')
            .sort((a, b) => new Date(b.dataConclusao || b.dataCadastro) - new Date(a.dataConclusao || a.dataCadastro))
            .slice(0, 5);
        
        if (recentes.length === 0) {
            document.getElementById('relatorioHistorico').innerHTML = '<p>Nenhum produto concluído ainda.</p>';
            return;
        }
        
        const html = recentes.map(produto => {
            const tempo = this.calcularTempoReparo(produto);
            return `
                <div class="historico-item">
                    <div class="historico-info">
                        <div class="historico-produto">${produto.produto}</div>
                        <div class="historico-cliente">${produto.nomeCliente}</div>
                    </div>
                    <div class="historico-tempo">${tempo} dias</div>
                </div>
            `;
        }).join('');
        
        document.getElementById('relatorioHistorico').innerHTML = html;
    }

    calcularTempoMedio(produtos) {
        if (produtos.length === 0) return 0;
        
        const tempos = produtos.map(p => this.calcularTempoReparo(p));
        const soma = tempos.reduce((acc, tempo) => acc + tempo, 0);
        return Math.round(soma / produtos.length);
    }

    calcularTempoMinimo(produtos) {
        if (produtos.length === 0) return 0;
        
        const tempos = produtos.map(p => this.calcularTempoReparo(p));
        return Math.min(...tempos);
    }

    calcularTempoMaximo(produtos) {
        if (produtos.length === 0) return 0;
        
        const tempos = produtos.map(p => this.calcularTempoReparo(p));
        return Math.max(...tempos);
    }

    calcularTempoReparo(produto) {
        const entrada = new Date(produto.dataEntrada);
        const conclusao = new Date(produto.dataConclusao || produto.dataCadastro);
        const diferenca = conclusao - entrada;
        return Math.max(0, Math.floor(diferenca / (1000 * 60 * 60 * 24)));
    }

    calcularTaxaConclusao() {
        if (this.produtos.length === 0) return 0;
        
        const concluidos = this.produtos.filter(p => p.status === 'concluido').length;
        return Math.round((concluidos / this.produtos.length) * 100);
    }

    contarProdutosMes() {
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        
        return this.produtos.filter(p => {
            const dataCadastro = new Date(p.dataCadastro);
            return dataCadastro >= inicioMes;
        }).length;
    }

    alternarModoEscuro() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        // Salva a preferência
        localStorage.setItem('modoEscuro', isDark);
        
        // Atualiza o ícone do botão
        const btn = document.getElementById('btnModoEscuro');
        const icon = btn.querySelector('i');
        
        if (isDark) {
            icon.className = 'fas fa-sun';
            btn.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
            this.mostrarNotificacao('Modo escuro ativado', 'info');
        } else {
            icon.className = 'fas fa-moon';
            btn.innerHTML = '<i class="fas fa-moon"></i> Modo Escuro';
            this.mostrarNotificacao('Modo claro ativado', 'info');
        }
    }

    carregarPreferencias() {
        // Carrega modo escuro
        const modoEscuro = localStorage.getItem('modoEscuro') === 'true';
        if (modoEscuro) {
            document.body.classList.add('dark-mode');
            const btn = document.getElementById('btnModoEscuro');
            btn.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
        }
    }

    importarDados(arquivo) {
        if (!arquivo) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                
                if (dados.produtos && Array.isArray(dados.produtos)) {
                    if (confirm(`Importar ${dados.produtos.length} produtos? Isso substituirá todos os dados atuais.`)) {
                        this.produtos = dados.produtos;
                        this.salvarProdutos();
                        this.atualizarInterface();
                        this.mostrarNotificacao('Dados importados com sucesso!', 'success');
                    }
                } else {
                    this.mostrarNotificacao('Arquivo inválido', 'error');
                }
            } catch (error) {
                this.mostrarNotificacao('Erro ao ler arquivo', 'error');
            }
        };
        
        reader.readAsText(arquivo);
        
        // Limpa o input
        document.getElementById('inputImportar').value = '';
    }

    exportarRelatorio() {
        const dados = this.gerarDadosRelatorio();
        const html = this.gerarHTMLRelatorio(dados);
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-consertos-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.mostrarNotificacao('Relatório exportado!', 'success');
    }

    imprimirRelatorio() {
        const dados = this.gerarDadosRelatorio();
        const html = this.gerarHTMLRelatorio(dados);
        
        const janela = window.open('', '_blank');
        janela.document.write(html);
        janela.document.close();
        janela.print();
    }

    gerarDadosRelatorio() {
        const produtosAtivos = this.produtos.filter(p => p.status === 'em_reparo');
        const produtosConcluidos = this.produtos.filter(p => p.status === 'concluido');
        
        return {
            data: new Date().toLocaleDateString('pt-BR'),
            produtosAtivos,
            produtosConcluidos,
            estatisticas: {
                total: this.produtos.length,
                ativos: produtosAtivos.length,
                concluidos: produtosConcluidos.length,
                urgentes: produtosAtivos.filter(p => this.calcularDias(p.dataEntrada) > 7).length,
                tempoMedio: this.calcularTempoMedio(produtosConcluidos)
            }
        };
    }

    gerarHTMLRelatorio(dados) {
        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Relatório de Consertos - ${dados.data}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
                    .produtos-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    .produtos-table th, .produtos-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .produtos-table th { background-color: #f2f2f2; }
                    .urgente { background-color: #ffebee; }
                    .alta { background-color: #fff3e0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Relatório de Consertos</h1>
                    <p>Gerado em: ${dados.data}</p>
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <h3>${dados.estatisticas.total}</h3>
                        <p>Total de Produtos</p>
                    </div>
                    <div class="stat-card">
                        <h3>${dados.estatisticas.ativos}</h3>
                        <p>Em Reparo</p>
                    </div>
                    <div class="stat-card">
                        <h3>${dados.estatisticas.concluidos}</h3>
                        <p>Concluídos</p>
                    </div>
                    <div class="stat-card">
                        <h3>${dados.estatisticas.urgentes}</h3>
                        <p>Urgentes</p>
                    </div>
                </div>
                
                <h2>Produtos em Reparo</h2>
                <table class="produtos-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Produto</th>
                            <th>Problema</th>
                            <th>Data Entrada</th>
                            <th>Dias</th>
                            <th>Prioridade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.produtosAtivos.map(p => `
                            <tr class="${p.prioridade}">
                                <td>${p.nomeCliente}</td>
                                <td>${p.produto}</td>
                                <td>${p.problema}</td>
                                <td>${this.formatarData(p.dataEntrada)}</td>
                                <td>${this.calcularDias(p.dataEntrada)}</td>
                                <td>${p.prioridade}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    // Método para exportar dados (funcionalidade extra)
    exportarDados() {
        const dados = {
            produtos: this.produtos,
            dataExportacao: new Date().toISOString(),
            versao: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-consertos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.mostrarNotificacao('Dados exportados com sucesso!', 'success');
    }

    // Métodos essenciais mantidos
    calcularDias(dataEntrada) {
        const entrada = new Date(dataEntrada);
        const hoje = new Date();
        const diferenca = hoje - entrada;
        return Math.floor(diferenca / (1000 * 60 * 60 * 24));
    }

    gerarId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    atualizarEstatisticas() {
        const produtosAtivos = this.produtos.filter(p => p.status === 'em_reparo');
        const produtosUrgentes = produtosAtivos.filter(p => this.calcularDias(p.dataEntrada) > 7);
        const produtosConcluidos = this.produtos.filter(p => {
            if (p.status !== 'concluido') return false;
            const hoje = new Date().toDateString();
            const dataConclusao = new Date(p.dataConclusao || p.dataCadastro).toDateString();
            return hoje === dataConclusao;
        });

        const totalElement = document.getElementById('totalProdutos');
        const urgentesElement = document.getElementById('produtosUrgentes');
        const concluidosElement = document.getElementById('produtosConcluidos');
        const badgeElement = document.getElementById('produtosBadge');

        if (totalElement) totalElement.textContent = produtosAtivos.length;
        if (urgentesElement) urgentesElement.textContent = produtosUrgentes.length;
        if (concluidosElement) concluidosElement.textContent = produtosConcluidos.length;
        if (badgeElement) badgeElement.textContent = produtosAtivos.length;
    }

    atualizarListaProdutos() {
        const container = document.getElementById('listaProdutos');
        if (!container) return;

        const produtosAtivos = this.produtos.filter(p => p.status === 'em_reparo');
        
        if (produtosAtivos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>Nenhum produto em reparo</h3>
                    <p>Cadastre o primeiro produto para começar</p>
                </div>
            `;
            return;
        }

        container.innerHTML = produtosAtivos.map(produto => this.criarCardProduto(produto)).join('');
    }

    criarCardProduto(produto) {
        const dias = this.calcularDias(produto.dataEntrada);
        const dataFormatada = new Date(produto.dataEntrada).toLocaleDateString('pt-BR');
        
        let cardClass = 'product-card';
        let diasBadgeClass = 'days-badge';
        
        if (produto.prioridade !== 'normal') {
            cardClass += ` priority-${produto.prioridade}`;
        }
        
        if (dias > 10) {
            diasBadgeClass += ' danger';
        } else if (dias > 7) {
            diasBadgeClass += ' warning';
        }

        return `
            <div class="${cardClass}" onclick="sistema.abrirDetalhes('${produto.id}')">
                <div class="product-header">
                    <div class="product-info">
                        <h3>${produto.produto}</h3>
                        <div class="product-client">${produto.nomeCliente} - ${produto.telefone}</div>
                    </div>
                    <div class="product-status">
                        <div class="${diasBadgeClass}">
                            ${dias} ${dias === 1 ? 'dia' : 'dias'}
                        </div>
                        <div class="priority-badge priority-${produto.prioridade}">
                            ${produto.prioridade}
                        </div>
                    </div>
                </div>
                
                <div class="product-details">
                    <div class="detail-row">
                        <i class="fas fa-exclamation-circle detail-icon"></i>
                        <div class="detail-content">
                            <div class="detail-label">Problema</div>
                            <div class="detail-value">${produto.problema}</div>
                        </div>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-calendar detail-icon"></i>
                        <div class="detail-content">
                            <div class="detail-label">Data de Entrada</div>
                            <div class="detail-value">${dataFormatada}</div>
                        </div>
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn-action btn-complete" onclick="event.stopPropagation(); sistema.concluirProduto('${produto.id}')">
                        <i class="fas fa-check"></i>
                        Concluir
                    </button>
                    <button class="btn-action btn-delete" onclick="event.stopPropagation(); sistema.excluirProduto('${produto.id}')">
                        <i class="fas fa-trash"></i>
                        Excluir
                    </button>
                </div>
            </div>
        `;
    }

    abrirDetalhes(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (!produto) return;

        const modal = document.getElementById('modalProdutoDetalhado');
        const titulo = document.getElementById('modalTitulo');
        const body = document.getElementById('modalBodyDetalhado');

        titulo.textContent = `${produto.produto} - ${produto.nomeCliente}`;
        
        const dias = this.calcularDias(produto.dataEntrada);
        const dataFormatada = new Date(produto.dataEntrada).toLocaleDateString('pt-BR');

        body.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Informações do Cliente</h3>
                    <div style="background: var(--neutral-50); padding: 1.5rem; border-radius: var(--radius-lg);">
                        <div style="margin-bottom: 1rem;">
                            <strong>Nome:</strong> ${produto.nomeCliente}
                        </div>
                        <div>
                            <strong>Telefone:</strong> ${produto.telefone}
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Detalhes do Produto</h3>
                    <div style="background: var(--neutral-50); padding: 1.5rem; border-radius: var(--radius-lg);">
                        <div style="margin-bottom: 1rem;">
                            <strong>Produto:</strong> ${produto.produto}
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <strong>Problema:</strong> ${produto.problema}
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <strong>Prioridade:</strong> <span class="priority-badge priority-${produto.prioridade}">${produto.prioridade}</span>
                        </div>
                        <div>
                            <strong>Data de Entrada:</strong> ${dataFormatada}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; padding: 2rem; background: var(--primary-50); border-radius: var(--radius-lg); margin-bottom: 2rem;">
                <div style="font-size: 3rem; font-weight: 800; color: var(--primary-600); margin-bottom: 0.5rem;">
                    ${dias}
                </div>
                <div style="color: var(--text-secondary); font-weight: 600;">
                    ${dias === 1 ? 'dia' : 'dias'} na loja
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn-primary" onclick="sistema.concluirProduto('${produto.id}'); sistema.fecharModalDetalhado();">
                    <i class="fas fa-check"></i>
                    Marcar como Concluído
                </button>
                <button class="btn-secondary" onclick="sistema.excluirProduto('${produto.id}'); sistema.fecharModalDetalhado();">
                    <i class="fas fa-trash"></i>
                    Excluir Produto
                </button>
            </div>
        `;

        modal.classList.add('active');
    }

    fecharModalDetalhado() {
        document.getElementById('modalProdutoDetalhado').classList.remove('active');
    }

    concluirProduto(id) {
        if (confirm('Tem certeza que deseja marcar este produto como concluído?')) {
            const produto = this.produtos.find(p => p.id === id);
            if (produto) {
                produto.status = 'concluido';
                produto.dataConclusao = new Date().toISOString();
                this.salvarProdutos();
                this.atualizarInterface();
                this.mostrarNotificacao('Produto marcado como concluído!', 'success');
            }
        }
    }

    excluirProduto(id) {
        if (confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
            this.produtos = this.produtos.filter(p => p.id !== id);
            this.salvarProdutos();
            this.atualizarInterface();
            this.mostrarNotificacao('Produto excluído com sucesso!', 'success');
        }
    }

    atualizarInterface() {
        this.atualizarEstatisticas();
        this.atualizarListaProdutos();
        this.carregarNotificacoes();
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Remove notificação existente se houver
        const notificacaoExistente = document.querySelector('.toast-notification');
        if (notificacaoExistente) {
            notificacaoExistente.remove();
        }

        // Cria nova notificação
        const notificacao = document.createElement('div');
        notificacao.className = 'toast-notification';
        
        // Define cor baseada no tipo
        const cores = {
            'success': 'linear-gradient(135deg, #10b981, #059669)',
            'error': 'linear-gradient(135deg, #ef4444, #dc2626)',
            'warning': 'linear-gradient(135deg, #f59e0b, #d97706)',
            'info': 'linear-gradient(135deg, #0ea5e9, #0284c7)'
        };
        
        const icones = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        notificacao.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${cores[tipo] || cores.info};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            animation: slideInUp 0.3s ease;
            font-family: 'Inter', sans-serif;
        `;
        
        notificacao.innerHTML = `
            <i class="fas ${icones[tipo] || icones.info}" style="font-size: 1.25rem;"></i>
            <span style="font-weight: 500;">${mensagem}</span>
        `;
        
        document.body.appendChild(notificacao);
        
        // Remove após 3 segundos
        setTimeout(() => {
            notificacao.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => {
                if (notificacao.parentNode) {
                    notificacao.remove();
                }
            }, 300);
        }, 3000);
    }

    carregarPreferencias() {
        // Carrega tema
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            const btn = document.getElementById('btnTheme');
            if (btn) btn.querySelector('i').className = 'fas fa-sun';
        }

        // Carrega sidebar
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (sidebarCollapsed) {
            document.getElementById('sidebar').classList.add('collapsed');
            this.sidebarCollapsed = true;
        }
    }

    salvarProdutos() {
        try {
            localStorage.setItem('repairpro_produtos', JSON.stringify(this.produtos));
        } catch (error) {
            console.error('Erro ao salvar produtos:', error);
        }
    }

    carregarProdutos() {
        try {
            const dados = localStorage.getItem('repairpro_produtos');
            return dados ? JSON.parse(dados) : [];
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            return [];
        }
    }

    exportarDados() {
        const dados = {
            produtos: this.produtos,
            dataExportacao: new Date().toISOString(),
            versao: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `repairpro-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.mostrarNotificacao('Dados exportados com sucesso!', 'success');
    }

    iniciarAtualizacaoAutomatica() {
        setInterval(() => {
            this.atualizarInterface();
        }, 60000);
    }

    // Sistema de API de Notificações
    iniciarMonitoramentoAPI() {
        // Simula checagem de API a cada 30 segundos
        this.verificarNotificacoesAPI();
        
        setInterval(() => {
            this.verificarNotificacoesAPI();
        }, 30000); // Verifica a cada 30 segundos
    }

    async verificarNotificacoesAPI() {
        try {
            // Simula uma chamada de API
            // Em produção, substituir por uma chamada real à API
            const notificacoes = await this.buscarNotificacoesAPI();
            
            if (notificacoes && notificacoes.length > 0) {
                this.processarNotificacoesAPI(notificacoes);
            }
            
            // Atualiza as notificações baseadas nos produtos urgentes
            this.carregarNotificacoes();
            
        } catch (error) {
            console.error('Erro ao verificar notificações:', error);
        }
    }

    async buscarNotificacoesAPI() {
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simula resposta da API com produtos urgentes
        const produtosUrgentes = this.produtos.filter(p => {
            if (p.status !== 'em_reparo') return false;
            const dias = this.calcularDias(p.dataEntrada);
            return dias > 7;
        });
        
        // Retorna formato de API simulado
        return produtosUrgentes.map(p => ({
            id: p.id,
            tipo: this.calcularDias(p.dataEntrada) > 10 ? 'critico' : 'urgente',
            titulo: `${p.produto} aguardando há ${this.calcularDias(p.dataEntrada)} dias`,
            mensagem: `Cliente: ${p.nomeCliente}`,
            timestamp: new Date().toISOString()
        }));
    }

    processarNotificacoesAPI(notificacoes) {
        // Verifica se há notificações críticas (mais de 10 dias)
        const criticas = notificacoes.filter(n => n.tipo === 'critico');
        
        if (criticas.length > 0) {
            // Anima o ícone do sino para chamar atenção
            const btnNotifications = document.getElementById('btnNotifications');
            if (btnNotifications) {
                btnNotifications.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    btnNotifications.style.animation = '';
                }, 500);
            }
            
            // Se houver produtos muito urgentes, mostra alerta
            if (criticas.length >= 3) {
                this.mostrarNotificacao(
                    `⚠️ Atenção! ${criticas.length} produtos aguardando há mais de 10 dias!`,
                    'warning'
                );
            }
        }
    }

    renderRelatorios() {
        return `
            <div class="form-container">
                <div class="form-header">
                    <div class="form-header-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div>
                        <h1 class="form-title">Relatórios</h1>
                        <p class="form-description">Visualize estatísticas e relatórios do sistema</p>
                    </div>
                </div>
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-chart-line" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>Relatórios em Desenvolvimento</h3>
                    <p>Esta funcionalidade estará disponível em breve.</p>
                </div>
            </div>
        `;
    }

    renderConfiguracoes() {
        return `
            <div class="form-container">
                <div class="form-header">
                    <div class="form-header-icon">
                        <i class="fas fa-cog"></i>
                    </div>
                    <div>
                        <h1 class="form-title">Configurações</h1>
                        <p class="form-description">Personalize o sistema conforme suas necessidades</p>
                    </div>
                </div>
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-tools" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>Configurações em Desenvolvimento</h3>
                    <p>Esta funcionalidade estará disponível em breve.</p>
                </div>
            </div>
        `;
    }

    gerarRelatorios() {
        // Método vazio por enquanto
        console.log('Gerando relatórios...');
    }

    // Método para testar o cadastro de forma rápida
    testarCadastro() {
        // Navega para a página de cadastro
        this.navegarPara('cadastro');
        
        // Preenche o formulário automaticamente após um pequeno delay
        setTimeout(() => {
            const nomeCliente = document.getElementById('nomeCliente');
            const telefone = document.getElementById('telefone');
            const produto = document.getElementById('produto');
            const problema = document.getElementById('problema');
            const dataEntrada = document.getElementById('dataEntrada');
            const prioridade = document.getElementById('prioridade');
            
            if (nomeCliente) nomeCliente.value = 'Cliente Teste ' + Date.now().toString().slice(-4);
            if (telefone) telefone.value = '(11) 9' + Math.floor(Math.random() * 10000000).toString().padStart(8, '0');
            if (produto) produto.value = 'Produto Teste - ' + new Date().toLocaleTimeString();
            if (problema) problema.value = 'Problema de teste';
            if (dataEntrada) dataEntrada.value = new Date().toISOString().split('T')[0];
            if (prioridade) prioridade.value = ['normal', 'alta', 'urgente'][Math.floor(Math.random() * 3)];
            
            console.log('Formulário preenchido automaticamente para teste');
            this.mostrarNotificacao('Formulário preenchido para teste. Clique em Cadastrar!', 'info');
        }, 500);
    }
    
    // Método para criar produtos de exemplo (para testes)
    criarProdutosExemplo() {
        const exemplos = [
            {
                id: this.gerarId(),
                nomeCliente: "João Silva",
                telefone: "(11) 98765-4321",
                dataEntrada: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                prioridade: "urgente",
                status: "em_reparo",
                dataCadastro: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: this.gerarId(),
                nomeCliente: "Maria Santos",
                telefone: "(11) 95555-5555",
                produto: "Fogão Consul",
                problem: "Forno não funciona",
                dataEntrada: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                prioridade: "normal",
                dataCadastro: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: this.gerarId(),
                nomeCliente: "Ana Costa",
                telefone: "(11) 99999-8888",
                produto: "Máquina de Lavar Brastemp",
                problema: "Não centrifuga",
                dataEntrada: new Date().toISOString().split('T')[0],
                prioridade: "alta",
                status: "em_reparo",
                dataCadastro: new Date().toISOString()
            }
        ];

        this.produtos = [...this.produtos, ...exemplos];
        this.salvarProdutos();
        this.atualizarInterface();
        this.mostrarNotificacao('Produtos de exemplo criados!', 'success');
    }
}

// Inicializa o sistema quando a página carregar
let sistema;
document.addEventListener('DOMContentLoaded', () => {
    sistema = new RepairProSystem();
    
    // Se não há produtos, criar alguns de exemplo
    if (sistema.produtos.length === 0) {
        console.log('Sistema carregado. Para criar produtos de exemplo, execute: sistema.criarProdutosExemplo()');
    }
});

// Torna o sistema disponível globalmente
window.sistema = sistema;
