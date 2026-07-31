# Hub Financeiro

Portal interno com páginas operacionais de conciliação, bancos, caixa, protestos e integrações de chat com IA. O front-end é estático, as funções em `api/` são executadas na Vercel e algumas telas consultam o Supabase.

## Estrutura

- `index.html` e demais arquivos `.html`: portais do Hub.
- `css/`: estilos compartilhados.
- `js/`: scripts executados no navegador.
- `api/`: funções de servidor que acessam o Gemini.
- `conhecimento.txt`: base usada pelo assistente. Este arquivo contém informação operacional e deve ser migrado para armazenamento privado.
- `tests/`: testes automatizados das validações de segurança.

## Execução e testes

Requisitos: Node.js 20 ou superior.

```bash
npm test
```

Na Vercel, configure as variáveis descritas em `.env.example`. A busca na web fica desativada por padrão; só é habilitada com `ENABLE_WEB_SEARCH=true`.

## Proteções incluídas

- validação de método, formato e tamanho das requisições;
- limitação básica de frequência por endereço de origem;
- bloqueio de chamadas originadas em outro site;
- tempo máximo para chamadas ao provedor de IA;
- mensagens de erro genéricas para o usuário, com detalhes apenas no log do servidor;
- validação de histórico, papéis, texto e imagens;
- resposta da IA renderizada como texto, impedindo a execução de HTML recebido;
- verificações automáticas em cada pull request.

## Ações críticas antes de uso corporativo

As medidas abaixo dependem das configurações do GitHub, Vercel e Supabase e não são resolvidas apenas por alterações no código:

1. Tornar o repositório privado.
2. Retirar dados bancários e procedimentos internos do histórico do Git. Apenas apagar os arquivos no estado atual não remove versões antigas.
3. Migrar `conhecimento.txt` e os dados de conciliação para armazenamento privado, com acesso autenticado.
4. Substituir a senha administrativa consultada pelo navegador por Supabase Auth ou SSO corporativo.
5. Revisar e testar as políticas RLS de todas as tabelas do Supabase.
6. Trocar senhas administrativas e revisar chaves que possam ter sido expostas.
7. Acrescentar autenticação de usuário às APIs antes de disponibilizar o portal fora da rede controlada.

Este primeiro pacote preserva o funcionamento existente. A retirada dos dados públicos deve ser feita junto com a migração, para evitar indisponibilidade do portal.
