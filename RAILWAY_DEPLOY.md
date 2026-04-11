# FLUXO BACKEND - Deploy no Railway

## Pré-requisitos
- Node.js 18+
- PostgreSQL

## Variáveis de Ambiente Necessárias

No Railway, configure as seguintes variáveis:

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=sua-chave-secreta-aqui
NODE_ENV=production
PORT=3000
```

## Configuração no Railway

1. **Conectar repositório Git**: Sincronizar com seu GitHub
2. **Criar serviço PostgreSQL**: Railway oferece PostgreSQL como add-on
3. **Configurar variáveis de ambiente**:
   - `DATABASE_URL` será gerada automaticamente pelo Railway PostgreSQL
   - Adicionar manualmente: `JWT_SECRET`

## Processo de Deploy

1. **Build automático**: Railway executa `npm install && npm run build`
2. **Migrações automaticamente**: O script `start` executa `npm run migrate` antes de iniciar
3. **Health check**: Acesse `/health` para verificar conexão com banco

## Solução de Problemas

### Erro de Prisma Client não encontrado
- Certifique-se que `@prisma/adapter-pg` e `pg` estão nas dependências ✓

### Conexão com banco de dados
- Verifique se `DATABASE_URL` está corretamente configurada no Railway
- Use `/health` para testar a conexão

### Prisma migrations
- Railway executará automaticamente `prisma migrate deploy` no start
- Certifique-se de ter os arquivos de migration em `prisma/migrations/`

## Checklist de Deploy

- [x] Dependencies adicionadas (@prisma/adapter-pg, pg)
- [x] Variáveis de ambiente configuradas no Railway
- [x] Health check endpoint disponível
- [x] Graceful shutdown implementado
- [x] Build scripts configurados
- [x] railway.json criado
