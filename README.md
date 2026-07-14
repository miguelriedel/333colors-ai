# 333Colors AI — Vercel proxy

Projeto mínimo para apresentar a Help Page da Chatbase em:

https://ai.333colors.com

Agent ID configurado:
`C_lk_1lsiol-HkkHly10W`

## Publicação

1. Crie um repositório GitHub, por exemplo `333colors-ai`.
2. Carregue os ficheiros deste pacote para a raiz do repositório.
3. Na Vercel, escolha **New Project** e importe o repositório.
4. Em **Framework Preset**, escolha **Other**.
5. Não defina Build Command nem Output Directory.
6. Clique em **Deploy**.
7. Teste primeiro o endereço `*.vercel.app`.
8. No projeto da Vercel, vá a **Settings → Domains**.
9. Adicione `ai.333colors.com`.
10. No fornecedor DNS de `333colors.com`, crie o CNAME indicado pela Vercel:
    - Tipo: CNAME
    - Nome/Host: ai
    - Destino/Value: copiar exatamente o valor apresentado pela Vercel
    - TTL: Auto ou padrão
11. Aguarde a validação e teste `https://ai.333colors.com`.

## Atenção

Confirme na Chatbase se o Agent ID continua exatamente igual ao indicado acima.
O ID é o trecho da URL entre `chatbase.co/` e `/help`.
