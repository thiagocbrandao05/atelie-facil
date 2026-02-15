# Ateliê Fácil - Apresentação Funcional

> 📅 Última atualização: Fevereiro 2026

---

É uma plataforma completa de gestão desenvolvida especialmente para **artesãos e pequenos ateliês**. Nossa missão é simplificar o dia a dia do empreendedor criativo, oferecendo ferramentas práticas para controle de estoque, precificação inteligente, gestão de pedidos e comunicação com clientes.

Com a aplicação, você pode focar no que faz de melhor — **criar com excelência** — enquanto nós cuidamos da parte administrativa e financeira do seu negócio.

---

## 💎 Diferenciais da Plataforma

### ✨ Inteligência Artificial Integrada

- Previsão de demanda baseada no histórico de vendas
- Sugestões automáticas de compra de materiais
- Análise de sazonalidade para planejamento estratégico
- Alertas inteligentes de estoque crítico

### 📱 WhatsApp Nativo

- Notificações automáticas para clientes sobre status dos pedidos
- Campanhas de marketing segmentadas
- Mensagens personalizadas com placeholders dinâmicos
- Limites de envio configuráveis por plano (Start, Pro, Premium)

### 💰 Controle Financeiro Completo

- Cálculo automático de custo real de produção
- Precificação com margem de lucro personalizada
- Integração com fluxo de caixa
- Metas mensais e acompanhamento de performance

### 🏢 Multi-Workspace (Multi-Tenant)

- Suporte a um ateliê por conta
- Isolamento total de dados entre workspaces
- Segurança robusta com Row Level Security (RLS)

---

## 🛠️ Funcionalidades Atuais

### 📦 **Gestão de Estoque e Materiais**

#### Cadastro de Materiais

- **Nome e identificação** de cada insumo
- **Unidade de medida** (metros, kg, unidades, etc.)
- **Custo unitário** atualizado
- **Quantidade em estoque** com controle em tempo real
- **Estoque mínimo** configurável para alertas
- **Fornecedor** associado para facilitar reposição

#### Controle de Movimentações

- **Entrada de estoque** (compras, doações)
- **Saída de estoque** (produção, vendas)
- **Ajustes manuais** com justificativas
- **Histórico completo** de todas as movimentações
- **Rastreabilidade** por referência de pedido ou evento

#### Alertas Inteligentes

- Notificações quando materiais atingem estoque mínimo
- Sugestões de compra baseadas em consumo médio
- Previsão de quando o estoque acabará
- Integração com WhatsApp para avisos urgentes

---

### 🎨 **Gestão de Produtos**

#### Cadastro de Produtos

- **Nome e descrição** do produto
- **Imagem** para visualização rápida
- **Tempo de produção** (horas de trabalho manual)
- **Margem de lucro** desejada (%)

#### Composição de Materiais

- **Receita de produção** com lista de materiais necessários
- **Quantidade de cada material** por unidade produzida
- **Cálculo automático de custo** baseado no preço dos insumos
- **Preço de venda sugerido** considerando custos + margem

#### Análise de Rentabilidade

- Visualização do **custo real** vs. **preço de venda**
- Identificação dos **produtos mais lucrativos**
- Relatórios de **produtos mais vendidos**

---

### 👥 **Gestão de Clientes**

#### Cadastro Completo

- **Nome e dados de contato** (telefone, e-mail)
- **Endereço completo** para entregas
- **Observações personalizadas** sobre preferências
- **Histórico de pedidos** por cliente

---

### 📋 **Gestão de Pedidos**

#### Controle de Status

O sistema acompanha cada pedido através das seguintes etapas:

1. **Orçamento** - Proposta em análise pelo cliente
2. **Aprovado** - Cliente confirmou o pedido
3. **Em Produção** - Ateliê está confeccionando
4. **Pronto** - Produto finalizado, aguardando retirada
5. **Entregue** - Pedido concluído
6. **Cancelado** - Pedido não prosseguiu

#### Informações do Pedido

- **Cliente** associado
- **Produtos e quantidades**
- **Valor total** calculado automaticamente
- **Data de vencimento/entrega**
- **Data de criação** para rastreamento
- **Timeline visual** do progresso

#### Baixa Automática de Estoque

- Quando um pedido é aprovado, o sistema **deduz automaticamente** os materiais do estoque
- Cálculo preciso baseado na **receita do produto** × **quantidade**
- **Prevenção de vendas** sem estoque suficiente
- **Histórico de movimentações** vinculado ao pedido

---

### 💸 **Gestão Financeira**

#### Configurações de Custo

- **Custos fixos mensais** (aluguel, energia, internet, etc.)
- **Salário desejado** pelo artesão
- **Horas de trabalho por mês**
- **Taxa horária** calculada automaticamente

#### Precificação Inteligente

A plataforma calcula o preço de cada produto considerando:

1. **Custo dos materiais** (soma de todos os insumos)
2. **Custo da mão de obra** (tempo × taxa horária)
3. **Margem de lucro** configurável
4. **Preço final sugerido**

Fórmula: `Preço = (Materiais + Mão de Obra) × (1 + Margem)`

#### Metas e Acompanhamento

- **Meta mensal de faturamento**
- **Comparativo real vs. meta**
- **Lucro previsto** com base nas margens
- **Indicadores visuais** de performance

---

### 🤖 **Automações com IA**

#### Previsão de Demanda

- Análise do **histórico de vendas**
- Identificação de **padrões sazonais** (Natal, Dia das Mães, etc.)
- **Sugestão de quantidade** a produzir
- Redução de desperdício e falta de produtos

#### Sugestões de Compra

- Baseado no **consumo médio** de materiais
- Considerando **pedidos em aberto**
- Alertas quando é hora de **reabastecer**
- Otimização de **custos de aquisição**

#### Insights de Comportamento

- Identificação dos **clientes mais recorrentes**
- Produtos **preferidos por região/perfil**
- Melhor época para **lançar campanhas**

---

### 📱 **WhatsApp Business Integrado**

#### Notificações Automáticas

O sistema envia mensagens automáticas via WhatsApp quando:

- Um **orçamento é criado** → "Olá {cliente}, seu orçamento está pronto!"
- Um **pedido é aprovado** → "Seu pedido foi confirmado e entrará em produção!"
- O produto está **pronto** → "Boa notícia! Sua encomenda já está pronta para retirada!"
- O pedido foi **entregue** → "Obrigado pela confiança! Esperamos você novamente!"

#### Campanhas de Marketing

- **Criação de campanhas** segmentadas
- Envio em massa para **grupos de clientes**
- Personalização com **placeholders** (`{cliente}`, `{produto}`, etc.)
- **Anexo de imagens** (ex: novo produto, promoção)
- **Rastreamento de status** (enviado, falhou, entregue)
- **Limites por plano** para controle de custos

#### Configuração de Mensagens

Personalização das mensagens padrão para:

- Orçamento
- Aprovação
- Produto pronto
- Finalização

---

### 🏪 **Gestão de Fornecedores**

#### Cadastro de Fornecedores

- **Nome completo** da empresa ou pessoa
- **Contato** (telefone, e-mail)
- **Endereço** para entregas e visitas
- **Observações** sobre prazos, condições de pagamento

#### Vinculação com Materiais

- Cada **material** pode ter um fornecedor padrão
- Facilita **cotações** e reposições rápidas
- **Histórico de compras** por fornecedor

---

### 📊 **Relatórios e Análises**

#### Dashboards Visuais

- **Resumo do mês** (faturamento, pedidos, lucro)
- **Pedidos ativos** por status
- **Estoque crítico** em destaque
- **Agenda do dia** com entregas previstas
- **Caixa previsto** para planejamento

#### Relatórios Disponíveis

- **Produtos mais vendidos**
- **Clientes mais recorrentes**
- **Materiais mais consumidos**
- **Performance mensal** (faturamento, margem)
- **Histórico de movimentações** de estoque

#### Exportação de Dados

- **Importação em massa** via Excel (materiais, clientes, fornecedores)
- **Exportação de relatórios** para análise externa
- **Backup de dados** para segurança

---

### 🔧 **Configurações e Personalização**

#### Dados do Ateliê

- **Nome da loja**
- **Logotipo** personalizado
- **Endereço completo**
- **Telefone e e-mail** de contato
- **Redes sociais** (Instagram, Facebook)

#### Preferências de Negócio

- **Taxa horária** de trabalho
- **Margem de lucro padrão**
- **Validade de orçamentos** (dias)
- **Notas padrão** em orçamentos

#### WhatsApp Business

- **Credenciais da API**
- **Número verificado**
- **Limites de envio** por plano
- **Mensagens customizadas**

#### Tema e Interface

- **Cor primária** personalizável
- Interface **responsiva** (desktop, tablet, mobile)
- **Modo claro** otimizado para uso diário

---

### 🔐 **Segurança e Auditoria**

#### Autenticação Segura

- **Login** via e-mail e senha
- **Integração com Supabase Auth**
- **Recuperação de senha** segura
- Suporte para **autenticação social** (Google, Facebook)

#### Auditoria Completa

O sistema registra automaticamente:

- Quem **criou/editou/deletou** cada registro
- **Quando** a ação foi realizada
- **O que** foi alterado (antes/depois)
- **Status** da operação (sucesso/falha)

Ações auditadas incluem:

- LOGIN, LOGOUT
- CREATE, UPDATE, DELETE
- EXPORT, IMPORT
- BACKUP, RESTORE
- SETTINGS_CHANGED

#### Notificações Internas

- **Central de notificações** na plataforma
- **Prioridades** (baixa, normal, alta, urgente)
- **Tipos** (estoque, pedidos, sistema)
- **Marcação de leitura** para organização

---

## 📈 **Planos e Escalabilidade**

### Planos Disponíveis

#### 🌱 **Start** (Iniciante)

- **300 mensagens transacionais/mês** via WhatsApp
- **300 mensagens de campanha/mês**
- **150 mensagens de campanha/dia**
- Até **200 destinatários por campanha**
- **10 testes diários** de mensagens
- Ideal para ateliês iniciantes

#### ⚡ **Pro** (Profissional)

- **1.500 mensagens transacionais/mês**
- **5.000 mensagens de campanha/mês**
- **1.000 mensagens de campanha/dia**
- Até **1.000 destinatários por campanha**
- **20 testes diários**
- Ideal para ateliês consolidados

#### 💎 **Premium** (Empresarial)

- **10.000 mensagens transacionais/mês**
- **20.000 mensagens de campanha/mês**
- **5.000 mensagens de campanha/dia**
- Até **5.000 destinatários por campanha**
- **50 testes diários**
- Ideal para operações em larga escala

### Sistema de Assinaturas

- **Integração com Stripe** para pagamentos
- **Cobrança recorrente** mensal ou anual
- **Upgrade/downgrade** flexível
- **Status** (ativo, pausado, cancelado)

---

## 🌐 **Experiência do Usuário**

### Interface Intuitiva

- **Design moderno** e limpo
- **Navegação clara** por sidebar
- **Ícones intuitivos** para ações rápidas
- **Responsividade** total (funciona em qualquer dispositivo)

### Fluxo de Trabalho Simplificado

1. **Cadastre** materiais e fornecedores
2. **Crie produtos** com suas receitas
3. **Adicione clientes**
4. **Gere orçamentos** com cálculo automático
5. **Acompanhe pedidos** em tempo real
6. **Envie notificações** via WhatsApp
7. **Analise resultados** com relatórios visuais

### Páginas Principais

- **Dashboard** - Visão geral do ateliê
- **Estoque** - Gestão de materiais
- **Produtos** - Catálogo e precificação
- **Clientes** - Relacionamento e histórico
- **Pedidos** - Pipeline de produção
- **Financeiro** - Custos e metas
- **Automações IA** - Insights inteligentes
- **Fornecedores** - Contatos e compras
- **Relatórios** - Análises e exportações
- **Configurações** - Personalização completa

---

## 🎁 **Benefícios do Ateliê Fácil**

### ⏱️ **Ganho de Tempo**

- Automação de tarefas repetitivas
- Cálculos automáticos de preço
- Notificações sem intervenção manual
- Organização centralizada

### 💡 **Decisões Mais Inteligentes**

- Dados consolidados em um só lugar
- Relatórios visuais e claros
- Previsões baseadas em IA
- Identificação de oportunidades

### 📊 **Maior Previsibilidade**

- Controle total do estoque
- Fluxo de caixa projetado
- Metas claras e alcançáveis
- Rastreamento de pedidos

### 🚀 **Crescimento Sustentável**

- Escalabilidade conforme demanda
- Processos padronizados
- Histórico para análise
- Relacionamento com clientes fortalecido

### 💰 **Mais Lucratividade**

- Precificação correta
- Redução de desperdício
- Controle de custos fixos
- Margem garantida

---

## 📱 **Tecnologias e Confiabilidade**

### Infraestrutura Moderna

- **Hospedagem na nuvem** (alta disponibilidade)
- **Banco de dados PostgreSQL** (Supabase)
- **Backups automáticos** diários
- **SSL/TLS** para comunicação segura

### Performance

- **Carregamento rápido** das páginas
- **Cache inteligente** de dados
- **Otimização de imagens**
- **Progressive Web App (PWA)** - Funciona offline

### Monitoramento

- **Sentry** para rastreamento de erros
- **Logs de auditoria** para análise
- **Indicadores de saúde** da aplicação

---

## 🎯 **Para Quem é o aplicação?**

### 🧵 **Costureiras e Alfaiates**

- Controle de tecidos, linhas e aviamentos

- Gestão de prazos de entrega

### 🎨 **Artesãos e Artesãs**

- Estoque de miçangas, tintas, madeira
- Produtos customizados
- Campanhas para datas comemorativas

### 🍰 **Confeitarias Artesanais**

- Controle de ingredientes (kg, unidades)
- Custos de produção precisos
- Pedidos sob encomenda

### 🪴 **Ateliês de Decoração**

- Materiais diversos (flores, vasos, tecidos)
- Composição de kits decorativos
- Gestão de eventos e entregas

### 🎁 **Qualquer Negócio Criativo**

Se você produz algo sob medida ou em pequenos lotes, o Ateliê Fácil foi feito para você!

---

## 🚀 **Como Começar?**

1. **Acesse** o site e crie sua conta gratuita
2. **Configure** os dados do seu ateliê
3. **Cadastre** materiais, produtos e clientes
4. **Crie** seu primeiro pedido
5. **Ative** as notificações WhatsApp (opcional)
6. **Acompanhe** os resultados no dashboard

💡 **Tempo estimado de configuração:** 10 minutos  
✅ **Sem necessidade de cartão de crédito** para começar  
🎓 **Suporte** e tutoriais disponíveis

---

## 🏆 **Missão**

> _"Empoderar artesãos e empreendedores criativos com ferramentas simples, poderosas e acessíveis, permitindo que foquem no que fazem de melhor: criar com excelência."_

---

## 📋 **Resumo de Funcionalidades**

| Módulo            | Funcionalidades Principais                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| **Estoque**       | Cadastro de materiais, controle de movimentações, alertas de estoque mínimo, histórico completo        |
| **Produtos**      | Receitas de produção, cálculo automático de custos, precificação inteligente, análise de rentabilidade |
| **Clientes**      | Cadastro completo, histórico de pedidos, segmentação para campanhas                                    |
| **Pedidos**       | Pipeline visual, múltiplos status, baixa automática de estoque, rastreamento de prazos                 |
| **Financeiro**    | Custos fixos, taxa horária, metas mensais, cálculo de margem, relatórios de performance                |
| **WhatsApp**      | Notificações automáticas, campanhas de marketing, mensagens personalizadas, limites por plano          |
| **IA**            | Previsão de demanda, sugestão de compras, análise de sazonalidade, insights de comportamento           |
| **Fornecedores**  | Cadastro completo, vinculação com materiais, histórico de compras                                      |
| **Relatórios**    | Dashboards visuais, produtos mais vendidos, clientes recorrentes, exportação de dados                  |
| **Configurações** | Personalização completa, integração WhatsApp, tema customizável, importação em massa                   |
| **Segurança**     | Autenticação segura, auditoria completa, notificações internas, multi-tenant com RLS                   |

---

Do controle financeiro à comunicação com clientes, a plataforma para artesãos que querem crescer com calma e clareza. ✨
