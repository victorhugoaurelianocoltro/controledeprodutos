// RepairPro - Sistema Profissional de Gestão de Consertos
class RepairProSystem {
    constructor() {
        // Configuração da API
        this.API_URL = 'http://localhost:3000/api/produtos';
        this.apiConnected = false;
        
        this.produtos = [];
        this.currentPage = 'dashboard';
        this.sidebarCollapsed = false;
        
        // Filtros ativos (usado para navegação do dashboard)
        this.filtrosAtivos = {
            prioridade: 'todas',
            dias: 'todos',
            status: 'todos'
        };
        
        this.inicializar();
    }

    async inicializar() {
        this.configurarEventos();
        this.configurarNavegacao();
        this.carregarPreferencias();
        this.atualizarRelogio();
        this.iniciarAtualizacaoAutomatica();
        this.iniciarMonitoramentoAPI();
        // Carrega produtos da API e depois carrega a página
        await this.carregarProdutos();
        const params = new URLSearchParams(window.location.search);
        const filtro = params.get('filtro');
        const isProdutosPage = window.location.pathname.endsWith('produtos.html');

        if (isProdutosPage) {
            // Em produtos.html, abrir a página de produtos aplicando filtro pela API quando possível
            if (filtro) {
                const statusAPI = this.mapearFiltroURLParaStatusAPI(filtro);
                if (statusAPI) {
                    await this.carregarProdutos({ status: statusAPI });
                    this.navegarPara('produtos', this.mapearFiltroURL(filtro));
                    return;
                }
            }
            // Sem filtro ou não mapeado, carrega normal e abre produtos
            await this.carregarProdutos();
            this.navegarPara('produtos', this.mapearFiltroURL(filtro || 'todos'));
            return;
        }

        // No index.html, se houver filtro, abrir produtos filtrado; senão, dashboard
        if (filtro) {
            const statusAPI = this.mapearFiltroURLParaStatusAPI(filtro);
            await this.carregarProdutos(statusAPI ? { status: statusAPI } : null);
            const m = this.mapearFiltroURL(filtro);
            this.navegarPara('produtos', m);
        } else {
            this.carregarPagina('dashboard');
        }
    }

    /**
     * Conecta os cards do dashboard com navegação baseada em URL (?filtro=)
     */
    configurarClicksDashboard() {
        const elReparo = document.getElementById('card-em-reparo');
        const elUrgentes = document.getElementById('card-urgentes');
        const elConcluidos = document.getElementById('card-concluidos');
        if (elReparo) elReparo.addEventListener('click', () => {
            window.location.href = `categoria.html?filtro=reparo`;
        });
        if (elUrgentes) elUrgentes.addEventListener('click', () => {
            window.location.href = `categoria.html?filtro=urgente`;
        });
        if (elConcluidos) elConcluidos.addEventListener('click', () => {
            window.location.href = `categoria.html?filtro=concluido-hoje`;
        });
    }

    /**
     * Mapeia o valor de ?filtro= da URL para filtrosAtivos
     */
    mapearFiltroURL(filtro) {
        // Define apenas como a UI deve se apresentar; a API já retorna filtrado
        switch ((filtro || '').toLowerCase()) {
            case 'em_reparo':
            case 'reparo':
                // Reparo inclui múltiplos status na API (Em andamento, Aguardando peça)
                // Para não esconder pelo frontend, não impomos status aqui
                return { prioridade: 'todas', dias: 'todos', status: 'todos' };
            case 'concluido':
                return { prioridade: 'todas', dias: 'todos', status: 'concluido' };
            case 'concluido-hoje':
                // Mostra concluídos; a restrição "hoje" já vem da API
                return { prioridade: 'todas', dias: 'hoje', status: 'concluido' };
            case 'urgentes':
            case 'urgente':
                // Urgente é por prioridade Alta; não filtrar adicionalmente no frontend
                return { prioridade: 'todas', dias: 'todos', status: 'todos' };
            case 'pendente':
                return { prioridade: 'todas', dias: 'todos', status: 'aguardando_orcamento' };
            case 'todos':
            default:
                return { prioridade: 'todas', dias: 'todos', status: 'todos' };
        }
    }

    /**
     * Mapeia ?filtro= para o valor esperado pelo backend em status
     */
    mapearFiltroURLParaStatusAPI(filtro) {
        const f = (filtro || '').toLowerCase();
        if (f === 'reparo' || f === 'em_reparo') return 'reparo';
        if (f === 'concluido') return 'concluido';
        if (f === 'concluido-hoje') return 'concluido-hoje';
        if (f === 'urgente' || f === 'urgentes') return 'urgente';
        if (f === 'pendente') return 'pendente';
        return null;
    }

    /**
     * Carrega produtos da API aplicando filtro direto na API
     */
    async carregarProdutosAPIComFiltro(filtroStatus) {
        console.log('[API] Carregando com filtro de status na API:', filtroStatus);
        const produtosAPI = await this.listarProdutosAPI({ status: filtroStatus });
        this.produtos = produtosAPI.map(p => this.mapearDaAPI(p));
        this.salvarProdutosLocal();
        // Não aplicar filtros adicionais no frontend por padrão
        this.filtrosAtivos = { prioridade: 'todas', dias: 'todos', status: 'todos' };
        this.navegarPara('produtos', this.filtrosAtivos);
        this.atualizarListaProdutos();
    }

    // =====================================================
    // MÉTODOS DE SERVIÇO DA API
    // =====================================================

    /**
     * Atualiza o indicador visual de status da API
     */
    atualizarIndicadorAPI() {
        const indicador = document.getElementById('apiStatus');
        if (!indicador) return;
        
        const dot = indicador.querySelector('.api-status-dot');
        const text = indicador.querySelector('.api-status-text');
        
        if (this.apiConnected) {
            indicador.className = 'api-status connected';
            text.textContent = 'API Conectada';
        } else {
            indicador.className = 'api-status disconnected';
            text.textContent = 'API Offline';
        }
    }

    /**
     * Listar todos os produtos da API
     */
    async listarProdutosAPI(params = {}) {
        try {
            let url = this.API_URL;
            const query = new URLSearchParams();
            // Suporte a filtros via querystring, exemplo: ?status=urgente
            if (params.status) query.set('status', params.status);
            if (params.prioridade) query.set('prioridade', params.prioridade);
            if (params.dias) query.set('dias', params.dias);
            const qs = query.toString();
            if (qs) url += `?${qs}`;

            const response = await fetch(url);
            const data = await response.json();
            
            if (data.sucesso) {
                this.apiConnected = true;
                this.atualizarIndicadorAPI();
                return data.dados;
            } else {
                throw new Error(data.erro || 'Erro ao listar produtos');
            }
        } catch (error) {
            console.error('Erro ao conectar com a API:', error);
            this.apiConnected = false;
            this.atualizarIndicadorAPI();
            this.mostrarNotificacao('Erro ao conectar com o servidor. Usando dados locais.', 'warning');
            return this.carregarProdutosLocal();
        }
    }

    /**
     * Criar novo produto na API
     */
    async criarProdutoAPI(produto) {
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produto)
            });
            
            const data = await response.json();
            
            if (data.sucesso) {
                this.apiConnected = true;
                return data.dados;
            } else {
                throw new Error(data.erro || 'Erro ao criar produto');
            }
        } catch (error) {
            console.error('Erro ao criar produto na API:', error);
            this.apiConnected = false;
            throw error;
        }
    }

    /**
     * Atualizar produto na API
     */
    async atualizarProdutoAPI(id, dados) {
        try {
            const response = await fetch(`${this.API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });
            
            const data = await response.json();
            
            if (data.sucesso) {
                this.apiConnected = true;
                return data.dados;
            } else {
                throw new Error(data.erro || 'Erro ao atualizar produto');
            }
        } catch (error) {
            console.error('Erro ao atualizar produto na API:', error);
            this.apiConnected = false;
            throw error;
        }
    }

    /**
     * Deletar produto na API
     */
    async deletarProdutoAPI(id) {
        try {
            const response = await fetch(`${this.API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.sucesso) {
                this.apiConnected = true;
                return true;
            } else {
                throw new Error(data.erro || 'Erro ao deletar produto');
            }
        } catch (error) {
            console.error('Erro ao deletar produto na API:', error);
            this.apiConnected = false;
            throw error;
        }
    }

    /**
     * Mapeia dados do frontend para o formato da API
     */
    mapearParaAPI(produtoFrontend) {
        return {
            cliente: produtoFrontend.nomeCliente,
            telefone: produtoFrontend.telefone,
            produto: produtoFrontend.produto,
            defeito: produtoFrontend.problema,
            valor: produtoFrontend.valor || 0,
            entrada: produtoFrontend.dataEntrada,
            entrega: produtoFrontend.dataEntrega || '',
            status: this.mapearStatusParaAPI(produtoFrontend.status),
            prioridade: this.mapearPrioridadeParaAPI(produtoFrontend.prioridade),
            observacoes: produtoFrontend.observacoes || ''
        };
    }

    /**
     * Mapeia dados da API para o formato do frontend
     */
    mapearDaAPI(produtoAPI) {
        return {
            id: produtoAPI.id,
            nomeCliente: produtoAPI.cliente,
            telefone: produtoAPI.telefone,
            produto: produtoAPI.produto,
            problema: produtoAPI.defeito,
            valor: produtoAPI.valor,
            dataEntrada: produtoAPI.entrada,
            dataEntrega: produtoAPI.entrega,
            status: this.mapearStatusDaAPI(produtoAPI.status),
            prioridade: this.mapearPrioridadeDaAPI(produtoAPI.prioridade),
            observacoes: produtoAPI.observacoes,
            dataCadastro: produtoAPI.criado_em
        };
    }

    /**
     * Mapeia status do frontend para API
     */
    mapearStatusParaAPI(statusFrontend) {
        const mapa = {
            'aguardando_orcamento': 'Aguardando Orçamento',
            'orcamento_enviado': 'Orçamento Enviado',
            'aguardando_aprovacao': 'Aguardando Aprovação',
            'em_reparo': 'Em Reparo',
            'aguardando_peca': 'Aguardando Peça',
            'teste_qualidade': 'Teste de Qualidade',
            'pronto_retirada': 'Pronto para Retirada',
            'concluido': 'Concluído',
            'cancelado': 'Cancelado'
        };
        return mapa[statusFrontend] || 'Em Reparo';
    }

    /**
     * Mapeia status da API para frontend
     */
    mapearStatusDaAPI(statusAPI) {
        if (!statusAPI) return 'em_reparo';
        // Normaliza acentos e caixa para comparação robusta
        const s = String(statusAPI)
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().trim();

        const mapa = {
            'aguardando orcamento': 'aguardando_orcamento',
            'orcamento enviado': 'orcamento_enviado',
            'aguardando aprovacao': 'aguardando_aprovacao',
            'em reparo': 'em_reparo',
            'aguardando peca': 'aguardando_peca',
            'teste de qualidade': 'teste_qualidade',
            'pronto para retirada': 'pronto_retirada',
            'concluido': 'concluido',
            'cancelado': 'cancelado',
            // Fallbacks comuns
            'em andamento': 'em_reparo',
            'pendente': 'aguardando_orcamento'
        };
        return mapa[s] || 'em_reparo';
    }

    /**
     * Mapeia prioridade do frontend para API
     */
    mapearPrioridadeParaAPI(prioridadeFrontend) {
        const mapa = {
            'urgente': 'Urgente',
            'alta': 'Alta',
            'normal': 'Normal',
            'baixa': 'Baixa'
        };
        return mapa[prioridadeFrontend] || 'Normal';
    }

    /**
     * Mapeia prioridade da API para frontend
     */
    mapearPrioridadeDaAPI(prioridadeAPI) {
        const mapa = {
            'Urgente': 'urgente',
            'Alta': 'alta',
            'Normal': 'normal',
            'Baixa': 'baixa'
        };
        return mapa[prioridadeAPI] || 'normal';
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

    navegarPara(page, filtros = null) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const menuItem = document.querySelector(`[data-page="${page}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
        }
        
        // Update breadcrumb
        document.getElementById('currentPage').textContent = this.getPageTitle(page);
        
        // Se filtros foram passados, armazena para aplicar
        if (filtros) {
            this.filtrosAtivos = { ...this.filtrosAtivos, ...filtros };
        } else {
            // Reseta filtros se não foram passados
            this.filtrosAtivos = {
                prioridade: 'todas',
                dias: 'todos',
                status: 'todos'
            };
        }
        
        // Load page content
        this.carregarPagina(page);
        this.currentPage = page;
    }

    /**
     * Navega para produtos aplicando um filtro específico
     */
    navegarParaProdutosComFiltro(filtroTipo, filtroValor) {
        const filtros = {
            prioridade: 'todas',
            dias: 'todos',
            status: 'todos'
        };
        
        // Aplica o filtro específico
        filtros[filtroTipo] = filtroValor;
        
        // Navega para produtos com o filtro
        this.navegarPara('produtos', filtros);
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
                this.configurarClicksDashboard();
                break;
            case 'produtos':
                container.innerHTML = this.renderProdutos();
                this.configurarEventosProdutos();
                // Aplica os filtros ativos nos selects da interface
                this.aplicarFiltrosAtivosNaInterface();
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
                <div class="stat-card stat-card-clickable" id="card-em-reparo" title="Clique para ver todos os produtos em reparo">
                    <div class="stat-header">
                        <span class="stat-title">Produtos em Reparo</span>
                        <div class="stat-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="totalProdutos">0</div>
                    <div class="stat-change neutral">
                        <i class="fas fa-mouse-pointer"></i>
                        <span>Clique para ver</span>
                    </div>
                </div>
                
                <div class="stat-card stat-card-clickable" id="card-urgentes" title="Clique para ver produtos urgentes">
                    <div class="stat-header">
                        <span class="stat-title">Produtos Urgentes</span>
                        <div class="stat-icon" style="background: var(--error-100); color: var(--error-500);">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="produtosUrgentes">0</div>
                    <div class="stat-change negative">
                        <i class="fas fa-mouse-pointer"></i>
                        <span>Mais de 7 dias - Clique para ver</span>
                    </div>
                </div>
                
                <div class="stat-card stat-card-clickable" id="card-concluidos" title="Clique para ver produtos concluídos">
                    <div class="stat-header">
                        <span class="stat-title">Concluídos Hoje</span>
                        <div class="stat-icon" style="background: var(--success-100); color: var(--success-500);">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="produtosConcluidos">0</div>
                    <div class="stat-change positive">
                        <i class="fas fa-mouse-pointer"></i>
                        <span>Clique para ver</span>
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
            
            <div class="quick-filters">
                <button class="chip-filter" id="chipTodos"><i class="fas fa-list"></i> Todos</button>
                <button class="chip-filter" id="chipEmReparo"><i class="fas fa-tools"></i> Em Reparo</button>
                <button class="chip-filter" id="chipUrgentes"><i class="fas fa-exclamation-triangle"></i> Urgentes</button>
                <button class="chip-filter" id="chipConcluidos"><i class="fas fa-check-circle"></i> Concluídos</button>
            </div>
            
            <div class="filter-active-info" id="filtroAtivoInfo" style="margin: 0 0 0.5rem 0; display:flex; align-items:center; gap:.5rem; color: var(--text-secondary);">
                <i class="fas fa-filter"></i>
                <span>Filtro: carregando...</span>
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
        const chipTodos = document.getElementById('chipTodos');
        const chipEmReparo = document.getElementById('chipEmReparo');
        const chipUrgentes = document.getElementById('chipUrgentes');
        const chipConcluidos = document.getElementById('chipConcluidos');

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

        // Filtros rápidos
        const ativarChip = (chipAtivo) => {
            [chipTodos, chipEmReparo, chipUrgentes, chipConcluidos].forEach(chip => {
                if (!chip) return;
                chip.classList.toggle('active', chip === chipAtivo);
            });
        };
        
        if (chipTodos) {
            chipTodos.addEventListener('click', () => {
                this.filtrosAtivos = { prioridade: 'todas', dias: 'todos', status: 'todos' };
                this.aplicarFiltrosAtivosNaInterface();
                ativarChip(chipTodos);
                this.atualizarListaProdutos();
            });
        }
        if (chipEmReparo) {
            chipEmReparo.addEventListener('click', () => {
                this.filtrosAtivos = { prioridade: 'todas', dias: 'todos', status: 'em_reparo' };
                this.aplicarFiltrosAtivosNaInterface();
                ativarChip(chipEmReparo);
                this.atualizarListaProdutos();
            });
        }
        if (chipUrgentes) {
            chipUrgentes.addEventListener('click', () => {
                this.filtrosAtivos = { prioridade: 'todas', dias: 'urgentes', status: 'todos' };
                this.aplicarFiltrosAtivosNaInterface();
                ativarChip(chipUrgentes);
                this.atualizarListaProdutos();
            });
        }
        if (chipConcluidos) {
            chipConcluidos.addEventListener('click', () => {
                this.filtrosAtivos = { prioridade: 'todas', dias: 'todos', status: 'concluido' };
                this.aplicarFiltrosAtivosNaInterface();
                ativarChip(chipConcluidos);
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
            nomeCliente: nomeCliente.value.trim(),
            telefone: telefone.value.trim(),
            produto: produto.value.trim(),
            problema: problema.value.trim(),
            dataEntrada: dataEntrada.value,
            prioridade: prioridade.value,
            status: 'em_reparo',
            valor: 0,
            dataEntrega: '',
            observacoes: ''
        };

        // Validação básica
        if (!this.validarProduto(dadosProduto)) {
            return;
        }

        // Cadastrar produto via API
        this.cadastrarProdutoAPI(dadosProduto);
    }

    async cadastrarProdutoAPI(dadosProduto) {
        try {
            // Mostra loading
            this.mostrarNotificacao('Cadastrando produto...', 'info');
            
            // Mapeia para o formato da API
            const produtoAPI = this.mapearParaAPI(dadosProduto);
            
            // Envia para a API
            const novoProduto = await this.criarProdutoAPI(produtoAPI);
            
            // Adiciona o produto mapeado à lista local
            const produtoMapeado = this.mapearDaAPI(novoProduto);
            this.produtos.push(produtoMapeado);
            
            console.log('Produto cadastrado na API:', novoProduto);
            console.log('Total de produtos:', this.produtos.length);
            
            // Salva backup local
            this.salvarProdutosLocal();
            
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
            
        } catch (error) {
            console.error('Erro ao cadastrar produto:', error);
            this.mostrarNotificacao('Erro ao cadastrar produto. Tente novamente.', 'error');
        }
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
        console.log('[Produtos] Atualizando lista com filtrosAtivos:', this.filtrosAtivos);
        const container = document.getElementById('listaProdutos');
        const filtroOrdem = document.getElementById('filtroOrdem').value;
        const filtroPrioridade = document.getElementById('filtroPrioridade').value;
        const filtroDias = document.getElementById('filtroDias').value;
        const termoBusca = document.getElementById('campoBusca').value.toLowerCase().trim();
        
        // Inicia com todos os produtos retornados (já podem estar filtrados pela API)
        let produtosAtivos = [...this.produtos];
        
        // Se o filtro de status está ativo no frontend, aplica
        if (this.filtrosAtivos.status !== 'todos') {
            produtosAtivos = produtosAtivos.filter(p => p.status === this.filtrosAtivos.status);
        }
        
        // Aplica filtros
        produtosAtivos = this.aplicarFiltros(produtosAtivos, filtroPrioridade, filtroDias, termoBusca);
        
        // Ordena os produtos
        produtosAtivos = this.ordenarProdutos(produtosAtivos, filtroOrdem);
        
        // Atualiza informações de resultados
        const totalSemFiltro = this.filtrosAtivos.status !== 'todos'
            ? this.produtos.filter(p => p.status === this.filtrosAtivos.status).length
            : this.produtos.length;
        this.atualizarInfoResultados(produtosAtivos.length, totalSemFiltro);
        
        if (produtosAtivos.length === 0) {
            console.log('[Produtos] Nenhum produto após filtros. Total sem filtro base:', totalSemFiltro);
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = produtosAtivos.map(produto => this.criarCardProduto(produto)).join('');
        // Atualiza texto do filtro ativo
        this.atualizarTextoFiltroAtivo();
    }

    atualizarTextoFiltroAtivo() {
        const el = document.getElementById('filtroAtivoInfo');
        if (!el) return;
        const partes = [];
        if (this.filtrosAtivos.status !== 'todos') {
            partes.push(`Status: ${this.filtrosAtivos.status.replace('_', ' ')}`);
        }
        if (this.filtrosAtivos.dias !== 'todos') {
            const mapDias = { urgentes: 'Mais de 7 dias', semana: 'Esta semana', hoje: 'Hoje' };
            partes.push(`Período: ${mapDias[this.filtrosAtivos.dias] || this.filtrosAtivos.dias}`);
        }
        if (this.filtrosAtivos.prioridade !== 'todas') {
            partes.push(`Prioridade: ${this.filtrosAtivos.prioridade}`);
        }
        el.querySelector('span').textContent = partes.length ? `Filtro: ${partes.join(' • ')}` : 'Filtro: Todos';
    }

    /**
     * Aplica os filtros ativos nos selects da interface
     */
    aplicarFiltrosAtivosNaInterface() {
        // Aguarda um momento para garantir que os elementos foram renderizados
        setTimeout(() => {
            const filtroPrioridade = document.getElementById('filtroPrioridade');
            const filtroDias = document.getElementById('filtroDias');
            const chipTodos = document.getElementById('chipTodos');
            const chipEmReparo = document.getElementById('chipEmReparo');
            const chipUrgentes = document.getElementById('chipUrgentes');
            const chipConcluidos = document.getElementById('chipConcluidos');
            
            if (filtroPrioridade && this.filtrosAtivos.prioridade !== 'todas') {
                filtroPrioridade.value = this.filtrosAtivos.prioridade;
            }
            
            if (filtroDias && this.filtrosAtivos.dias !== 'todos') {
                filtroDias.value = this.filtrosAtivos.dias;
            }

            // Ativa o chip apropriado
            const ativarChip = (chipAtivo) => {
                [chipTodos, chipEmReparo, chipUrgentes, chipConcluidos].forEach(chip => {
                    if (!chip) return;
                    chip.classList.toggle('active', chip === chipAtivo);
                });
            };
            if (this.filtrosAtivos.status === 'concluido') {
                ativarChip(chipConcluidos);
            } else if (this.filtrosAtivos.status === 'em_reparo') {
                ativarChip(chipEmReparo);
            } else if (this.filtrosAtivos.dias === 'urgentes') {
                ativarChip(chipUrgentes);
            } else {
                ativarChip(chipTodos);
            }
        }, 100);
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
                // Atualiza via API e localmente pelo fluxo já existente
                this.atualizarStatusAPI(id, 'concluido')
                    .then(() => {
                        // Após concluir, oferece atalho para ver concluídos
                        this.filtrosAtivos = { prioridade: 'todas', dias: 'todos', status: 'concluido' };
                        this.navegarPara('produtos', this.filtrosAtivos);
                    })
                    .catch(() => {});
            }
        }
    }

    excluirProduto(id) {
        if (confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
            this.excluirProdutoAPI(id);
        }
    }

    async excluirProdutoAPI(id) {
        try {
            // Mostra loading
            this.mostrarNotificacao('Excluindo produto...', 'info');
            
            // Deleta na API
            await this.deletarProdutoAPI(id);
            
            // Remove da lista local
            this.produtos = this.produtos.filter(p => p.id !== id);
            
            // Salva backup local
            this.salvarProdutosLocal();
            
            // Atualiza interface
            this.atualizarInterface();
            
            this.mostrarNotificacao('✅ Produto excluído com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            this.mostrarNotificacao('Erro ao excluir produto. Tente novamente.', 'error');
        }
    }

    abrirModalDetalhado(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (!produto) return;

        const dias = this.calcularDias(produto.dataEntrada);
        const dataFormatada = this.formatarData(produto.dataEntrada);
        const dataCadastro = new Date(produto.dataCadastro).toLocaleString('pt-BR');
        const statusInfo = this.getStatusInfo(produto.status || 'em_reparo');

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
                        <!-- Status Section -->
                        <div class="modal-section modal-status-section">
                            <h3 class="section-title"><i class="${statusInfo.icon}"></i> Status do Produto</h3>
                            <div class="status-selector-container">
                                <div class="current-status-display">
                                    <div class="status-display-header">
                                        <i class="${statusInfo.icon} status-display-icon"></i>
                                        <div>
                                            <span class="status-display-label">Status Atual</span>
                                            <span class="status-display-value status-${produto.status || 'em_reparo'}">${statusInfo.label}</span>
                                        </div>
                                    </div>
                                    <div class="status-display-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill status-${produto.status || 'em_reparo'}" style="width: ${statusInfo.progress}%"></div>
                                        </div>
                                        <span class="progress-text">${statusInfo.progress}%</span>
                                    </div>
                                    <p class="status-display-description">${statusInfo.description}</p>
                                </div>
                                <div class="status-selector-wrapper">
                                    <label class="status-selector-label">
                                        <i class="fas fa-edit"></i> Alterar Status
                                    </label>
                                    <select class="status-selector" id="statusSelector-${produto.id}" onchange="sistema.atualizarStatus('${produto.id}', this.value)">
                                        <option value="aguardando_orcamento" ${produto.status === 'aguardando_orcamento' ? 'selected' : ''}>Aguardando Orçamento</option>
                                        <option value="orcamento_enviado" ${produto.status === 'orcamento_enviado' ? 'selected' : ''}>Orçamento Enviado</option>
                                        <option value="aguardando_aprovacao" ${produto.status === 'aguardando_aprovacao' ? 'selected' : ''}>Aguardando Aprovação</option>
                                        <option value="em_reparo" ${(produto.status === 'em_reparo' || !produto.status) ? 'selected' : ''}>Em Reparo</option>
                                        <option value="aguardando_peca" ${produto.status === 'aguardando_peca' ? 'selected' : ''}>Aguardando Peça</option>
                                        <option value="teste_qualidade" ${produto.status === 'teste_qualidade' ? 'selected' : ''}>Teste de Qualidade</option>
                                        <option value="pronto_retirada" ${produto.status === 'pronto_retirada' ? 'selected' : ''}>Pronto para Retirada</option>
                                        <option value="concluido" ${produto.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                                        <option value="cancelado" ${produto.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                                    </select>
                                </div>
                            </div>
                        </div>

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

        // Remove modal anterior se existir
        const modalExistente = document.getElementById('modalDetalhado');
        if (modalExistente) {
            modalExistente.remove();
        }

        // Adiciona o novo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    getStatusInfo(status) {
        const statusInfo = {
            'aguardando_orcamento': {
                icon: 'fas fa-file-invoice',
                label: 'Aguardando Orçamento',
                progress: 10,
                description: 'O orçamento está sendo preparado.'
            },
            'orcamento_enviado': {
                icon: 'fas fa-paper-plane',
                label: 'Orçamento Enviado',
                progress: 20,
                description: 'O orçamento foi enviado para o cliente.'
            },
            'aguardando_aprovacao': {
                icon: 'fas fa-clock',
                label: 'Aguardando Aprovação',
                progress: 30,
                description: 'Aguardando a aprovação do cliente.'
            },
            'em_reparo': {
                icon: 'fas fa-wrench',
                label: 'Em Reparo',
                progress: 50,
                description: 'O produto está em reparo.'
            },
            'aguardando_peca': {
                icon: 'fas fa-box',
                label: 'Aguardando Peça',
                progress: 60,
                description: 'Aguardando a chegada da peça.'
            },
            'teste_qualidade': {
                icon: 'fas fa-check-circle',
                label: 'Teste de Qualidade',
                progress: 80,
                description: 'Realizando o teste de qualidade.'
            },
            'pronto_retirada': {
                icon: 'fas fa-check',
                label: 'Pronto para Retirada',
                progress: 90,
                description: 'O produto está pronto para ser retirado.'
            },
            'concluido': {
                icon: 'fas fa-check-circle',
                label: 'Concluído',
                progress: 100,
                description: 'O produto foi concluído com sucesso.'
            },
            'cancelado': {
                icon: 'fas fa-times-circle',
                label: 'Cancelado',
                progress: 0,
                description: 'O produto foi cancelado.'
            }
        };

        return statusInfo[status] || statusInfo['em_reparo'];
    }

    fecharModalDetalhado() {
        document.getElementById('modalDetalhado').classList.remove('active');
    }

    atualizarStatus(id, status) {
        const produto = this.produtos.find(p => p.id === id);
        if (produto) {
            this.atualizarStatusAPI(id, status);
        }
    }

    async atualizarStatusAPI(id, status) {
        try {
            // Mostra loading
            const statusInfo = this.getStatusInfo(status);
            this.mostrarNotificacao(`Atualizando status...`, 'info');
            
            // Prepara dados para enviar à API
            const dadosAtualizacao = {
                status: this.mapearStatusParaAPI(status)
            };
            
            // Atualiza na API
            await this.atualizarProdutoAPI(id, dadosAtualizacao);
            
            // Atualiza localmente
            const produto = this.produtos.find(p => p.id === id);
            if (produto) {
                produto.status = status;
            }
            
            // Salva backup local
            this.salvarProdutosLocal();
            
            // Atualiza interface
            this.atualizarInterface();
            
            this.mostrarNotificacao(`✅ Status atualizado: ${statusInfo.label}`, 'success');
            
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            this.mostrarNotificacao('Erro ao atualizar status. Tente novamente.', 'error');
        }
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

    async carregarProdutos(params = null) {
        try {
            console.log('Carregando produtos da API...');
            const produtosAPI = await this.listarProdutosAPI(params || {});
            
            // Mapeia os produtos da API para o formato do frontend
            this.produtos = produtosAPI.map(p => this.mapearDaAPI(p));
            
            console.log(`${this.produtos.length} produtos carregados com sucesso`);
            
            // Salva no localStorage como backup
            this.salvarProdutosLocal();
            
            // Atualiza a interface se já estiver carregada
            if (this.currentPage) {
                this.atualizarInterface();
            }
            
            return this.produtos;
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            // Em caso de erro, tenta carregar do localStorage
            this.produtos = this.carregarProdutosLocal();
            return this.produtos;
        }
    }

    carregarProdutosLocal() {
        try {
            const dados = localStorage.getItem('repairpro_produtos');
            return dados ? JSON.parse(dados) : [];
        } catch (error) {
            console.error('Erro ao carregar produtos do localStorage:', error);
            return [];
        }
    }

    salvarProdutosLocal() {
        try {
            localStorage.setItem('repairpro_produtos', JSON.stringify(this.produtos));
        } catch (error) {
            console.error('Erro ao salvar produtos no localStorage:', error);
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
                problema: "Forno não funciona",
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
