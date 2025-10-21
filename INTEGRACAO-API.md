# 🔗 Integração Frontend + API - RepairPro

## ✅ Integração Completa Implementada

A integração entre o frontend e a API REST foi concluída com sucesso!

---

## 🚀 Como Usar

### 1️⃣ Iniciar a API (Backend)

Primeiro, clone e inicie a API:

```bash
# Clone a API (se ainda não fez)
git clone https://github.com/victorhugoaurelianocoltro/API-controledeprodutos.git
cd API-controledeprodutos

# Instale as dependências
npm install

# Inicie o servidor
npm start
```

A API estará rodando em: `http://localhost:3000`

### 2️⃣ Abrir o Frontend

Abra o arquivo `index.html` no navegador ou use um servidor local:

```bash
# Opção 1: Abrir diretamente
open index.html

# Opção 2: Usar Live Server (recomendado)
# Se tiver Python instalado:
python3 -m http.server 8080

# Se tiver Node.js:
npx serve .
```

---

## 🎯 Funcionalidades Integradas

### ✅ Listar Produtos
- Carrega automaticamente da API ao abrir o sistema
- Atualiza a interface em tempo real
- Backup automático no localStorage

### ✅ Cadastrar Produto
- Formulário envia direto para a API
- Validação de campos mantida
- Feedback visual durante o cadastro
- Navegação automática após sucesso

### ✅ Atualizar Status
- Mudança de status via dropdown no modal
- Sincronização imediata com a API
- 9 estados de rastreamento:
  1. Aguardando Orçamento (20%)
  2. Orçamento Enviado (30%)
  3. Aguardando Aprovação (40%)
  4. Em Reparo (60%)
  5. Aguardando Peça (50%)
  6. Teste de Qualidade (80%)
  7. Pronto para Retirada (90%)
  8. Concluído (100%)
  9. Cancelado (0%)

### ✅ Excluir Produto
- Confirmação de exclusão
- Remoção via API
- Atualização automática da lista

---

## 🟢 Indicador de Status da API

No canto superior direito do header, você verá o status da conexão:

- 🟢 **API Conectada** - Tudo funcionando
- 🟡 **Conectando...** - Tentando conectar
- 🔴 **API Offline** - Usando dados locais

---

## 🔄 Mapeamento de Dados

### Frontend → API
```javascript
{
  nomeCliente → cliente
  problema → defeito
  dataEntrada → entrada
  // Status e prioridades são mapeados automaticamente
}
```

### API → Frontend
```javascript
{
  cliente → nomeCliente
  defeito → problema
  entrada → dataEntrada
  // Conversão automática de formatos
}
```

---

## 🛡️ Modo Offline

Se a API estiver offline:
- ✅ Sistema continua funcionando
- ✅ Usa dados do localStorage como backup
- ⚠️ Mostra notificação de alerta
- 🔄 Sincroniza automaticamente quando API voltar

---

## 📝 Endpoints Utilizados

| Método | Endpoint | Função |
|--------|----------|---------|
| GET | `/api/produtos` | Listar todos os produtos |
| POST | `/api/produtos` | Criar novo produto |
| PUT | `/api/produtos/:id` | Atualizar produto |
| DELETE | `/api/produtos/:id` | Deletar produto |

---

## 🧪 Testando a Integração

### Teste 1: Cadastrar Produto
1. Vá em "Novo Produto"
2. Preencha o formulário
3. Clique em "Cadastrar"
4. ✅ Produto deve aparecer na API e na lista

### Teste 2: Atualizar Status
1. Abra um produto (clique no card)
2. Altere o status no dropdown
3. ✅ Status deve atualizar na API

### Teste 3: Excluir Produto
1. Clique no botão de excluir (lixeira)
2. Confirme a exclusão
3. ✅ Produto deve ser removido da API

### Teste 4: Modo Offline
1. Desligue a API (`Ctrl+C` no terminal)
2. Recarregue o frontend
3. ✅ Sistema deve mostrar "API Offline"
4. ✅ Dados locais ainda devem aparecer

---

## 🔧 Configuração

A URL da API está configurada em:
```javascript
// script.js - linha 5
this.API_URL = 'http://localhost:3000/api/produtos';
```

Se sua API estiver em outra porta, altere aqui.

---

## 📦 Estrutura de Arquivos

```
controledeprodutos/
├── index.html           # Interface principal
├── styles.css          # Estilos (incluindo indicador API)
├── script.js           # Lógica + Integração API
└── INTEGRACAO-API.md   # Este arquivo
```

---

## 🎨 Design Mantido

✅ Todo o design e layout foram mantidos inalterados
✅ Sistema de status com 9 estados preservado
✅ Animações e transições funcionando
✅ Modo responsivo funcionando
✅ Tema claro/escuro funcionando

---

## 💡 Dicas

1. **Mantenha a API rodando** durante o uso do frontend
2. **Abra o Console** (F12) para ver logs de debug
3. **Observe o indicador** de status da API no header
4. **Dados são salvos** automaticamente no localStorage como backup

---

## 🐛 Resolução de Problemas

### Problema: "API Offline" mesmo com API rodando

**Solução:**
- Verifique se a API está em `http://localhost:3000`
- Abra `http://localhost:3000/api/produtos` no navegador
- Verifique o console do navegador (F12) para erros CORS

### Problema: Erro de CORS

**Solução:** A API já vem configurada com CORS habilitado. Se ainda tiver erro:
```javascript
// Na API, verifique se tem:
app.use(cors());
```

### Problema: Produtos não aparecem

**Solução:**
1. Verifique se a API tem produtos cadastrados
2. Teste diretamente: `http://localhost:3000/api/produtos`
3. Veja o console do navegador para erros

---

## ✨ Recursos Extras Implementados

- ⚡ **Feedback visual** durante operações
- 🔄 **Sincronização automática**
- 💾 **Backup local inteligente**
- 🎯 **Indicador de conexão em tempo real**
- 📱 **100% responsivo**
- 🌓 **Suporte a modo escuro**

---

## 📞 Suporte

Se encontrar algum problema:
1. Verifique os logs no console (F12)
2. Confirme que a API está rodando
3. Teste os endpoints direto no navegador

---

**Desenvolvido com ❤️ para RepairPro**

🔗 API: https://github.com/victorhugoaurelianocoltro/API-controledeprodutos
