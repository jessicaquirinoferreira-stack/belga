# Belga Móveis - Sistema de Vendas, E-commerce e Crediário Digital

Sistema web completo, profissional e moderno desenvolvido para a **Belga Móveis** ("Seu lar mais completo!"). O sistema unifica **E-commerce**, **Crediário Digital com Ficha Oficial**, **PDV Balcão**, **CRM de Clientes**, **Gestão de Parcelas e Cobrança**, **WhatsApp**, **Chat em Tempo Real**, **Estoque** e **Painel Administrativo**.

---

## 1. Identidade & Contatos Comerciais
- **Empresa:** Belga Móveis
- **Slogan:** "Seu lar mais completo!"
- **WhatsApp Comercial / Vendas:** (21) 97393-4438
- **WhatsApp Crediário / Chave Pix:** (21) 96656-7027
- **Endereço:** Rio de Janeiro / RJ

---

## 2. Estrutura do Projeto
```text
/
├── api/
│   ├── upload.ts              # API Route segura para upload com Vercel Blob
│   └── delete-upload.ts       # API Route para remoção de arquivos no Blob
├── src/
│   ├── components/
│   │   ├── admin/             # Painel administrativo completo, PDV, relatórios, auditoria
│   │   ├── auth/              # Modal e autenticação (Cliente e Admin)
│   │   ├── catalog/           # Catálogo, cards, filtros e modal de detalhes dos colchões Queen
│   │   ├── checkout/          # Checkout guiado em 7 etapas com geração de Ficha Digital
│   │   ├── crediario/         # Simulador financeiro com centavos e cronograma de vencimentos
│   │   ├── customer/          # Área do cliente, extrato de parcelas, comprovantes e chat
│   │   ├── home/              # Hero section, explicação visual da ficha de crediário
│   │   └── layout/            # Header, Footer com botão discreto do Admin, CartDrawer
│   ├── context/
│   │   ├── AuthContext.tsx    # Gerenciamento de sessão, perfis e permissões RBAC
│   │   └── CartContext.tsx    # Carrinho de compras e persistência local
│   ├── lib/
│   │   ├── api.ts             # ViaCEP, templates do WhatsApp e upload seguro
│   │   ├── dbService.ts       # Serviços em tempo real e transações atômicas no Firestore
│   │   ├── financial.ts       # Calculadora financeira precisa (centavos/inteiros)
│   │   ├── firebase.ts        # Inicialização do Firebase SDK e tratamento de erros
│   │   └── seedData.ts        # 12 modelos de colchões Queen com preços originais
│   ├── types/
│   │   └── index.ts           # Definições completas TypeScript
│   ├── App.tsx                # Roteamento dinâmico e controle de visualizações
│   ├── index.css              # Tailwind CSS
│   └── main.tsx               # Ponto de entrada React
├── firebase-applet-config.json # Configuração do projeto provisionado
├── firebase-blueprint.json    # Blueprint intermediário das entidades e coleções
├── firestore.rules            # Regras de segurança consolidadas (8 pilares de segurança)
├── security_spec.md           # Especificação de segurança e matriz de rejeição
├── .env.example               # Exemplo com todas as variáveis de ambiente
└── package.json
```

---

## 3. Instalação e Execução Local

### Pré-requisitos
- Node.js 18+ ou 20+
- npm ou bun

### Passos
1. Clone o repositório ou acesse a pasta do projeto:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Acesse a aplicação em `http://localhost:3000`.

---

## 4. Firebase Authentication & Firestore

O projeto utiliza o Firebase Firestore com sincronização em tempo real (`onSnapshot`) e Firebase Authentication.

### Administrador Inicial
- **E-mail:** `admin@x.com`
- **Senha Inicial:** `admin4321`
- **E-mail Master:** `jessicaq2204@gmail.com`
- **Troca Obrigatória:** No primeiro login do administrador com a senha padrão, o sistema solicita obrigatoriamente a troca por uma nova senha pessoal através da interface de segurança.

### Coleções do Banco de Dados
- `products`: Produtos, fotos, especificações, estoque e preços.
- `categories`: Categorias de móveis.
- `orders`: Pedidos e Fichas Digitais geradas.
- `installments`: Parcelas individuais do crediário com datas de vencimento, status e baixa.
- `payments`: Recibos de pagamentos registrados.
- `customers`: Dados de clientes, endereço e saldo devedor em aberto.
- `messages`: Mensagens do chat em tempo real entre cliente e atendimento.
- `settings`: Configurações de contatos, WhatsApp, chave Pix e contrato digital.
- `activity_logs`: Logs de auditoria administrativa.

### Regras do Firestore (`firestore.rules`)
As regras foram elaboradas de acordo com os Oito Pilares de Segurança:
- Leitura pública apenas para catálogo de produtos e categorias ativas.
- Clientes autenticados só podem ler seus próprios pedidos, parcelas, perfil e mensagens.
- Operações de baixa de parcelas, registro de pagamentos e edição de catálogo exigem permissão administrativa (`isAdmin()`).

---

## 5. Vercel & Vercel Blob para Uploads

Para garantir segurança total:
- O token `BLOB_READ_WRITE_TOKEN` **nunca** é exposto ao frontend.
- O frontend envia a requisição para `/api/upload` (rota de servidor).
- Em ambiente de produção na Vercel, o arquivo é gravado no Vercel Blob e a URL pública retornada ao Firestore.
- Em desenvolvimento local sem token configurado, o sistema possui fallback gracioso para pré-visualização.

---

## 6. Integração com WhatsApp

O sistema possui integração pronta para operar em dois modos:
1. **Modo Direto / wa.me:** Geração automática de links no formato `https://wa.me/55...` com codificação URL para:
   - Envio do Resumo Completo do Pedido após a compra;
   - Lembretes de vencimento (vence hoje, vence amanhã);
   - Avisos de parcelas em atraso com chave Pix para regularização;
   - Comprovantes digitais de pagamento.
2. **Modo API Oficial:** Se configurado via variáveis de ambiente (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER`), permite envio disparado pelo backend.

---

## 7. Deploy na Vercel

1. Suba o projeto para o GitHub / GitLab.
2. Importe na Vercel.
3. Configure as variáveis de ambiente baseadas no `.env.example`:
   - `BLOB_READ_WRITE_TOKEN`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Execute o build:
   ```bash
   npm run build
   ```
5. Deploy concluído! A aplicação suportará PWA, responsividade mobile-first e tempo real.
