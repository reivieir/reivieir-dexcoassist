# Segurança

## Comunicação de incidentes

Não publique vulnerabilidades, credenciais, dados bancários ou procedimentos internos em issues públicas. Use o canal corporativo de segurança da informação.

## Checklist de publicação

- [ ] O repositório está privado.
- [ ] O histórico do Git foi limpo de informações internas.
- [ ] As credenciais e senhas possivelmente expostas foram trocadas.
- [ ] O login administrativo usa Supabase Auth ou SSO, sem comparação de senha no navegador.
- [ ] As políticas RLS negam acesso por padrão e foram testadas por perfil.
- [ ] As APIs exigem identidade autenticada e possuem limites centralizados de uso.
- [ ] Os dados operacionais estão em armazenamento privado.
- [ ] Os testes e a revisão de segurança foram aprovados antes da publicação.

## Limites deste pacote

A limitação de frequência adicionada às funções é local a cada instância da Vercel. Para proteção consistente em produção, use um armazenamento compartilhado ou o mecanismo de proteção da plataforma. A validação de origem reduz chamadas indevidas de outros sites, mas não substitui autenticação.
