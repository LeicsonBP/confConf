# ADR-0009: Links de convite reutilizáveis e sempre visíveis

- **Status:** aceito
- **Data:** 2026-11-14
- **Decisores:** cliente (D-15) e agente

## Contexto

O desenho inicial (BR-06/AC-04) previa convite de **uso único** com o link exibido **uma única vez** e armazenado apenas como hash. O cliente precisa compartilhar o mesmo link em grupos de WhatsApp/família e reexibi-lo quantas vezes quiser, sem gerar um convite novo a cada pessoa.

## Decisão

1. Cada evento tem **N convites**; cada convite é um link **reutilizável**.
2. `max_uses` é **nulo por padrão = usos ilimitados**; quando o admin define um limite (1–5000), o convite fica "esgotado" ao atingi-lo.
3. O token é gerado no servidor (32 bytes aleatórios, base64url) e guardado em duas formas:
   - `token_hash` (SHA-256 hexadecimal) para busca e validação — nunca sai do servidor;
   - `token_ciphertext` (AES-256-GCM com `APP_SECRET`) para o admin **reexibir o link** na página do evento.
4. O link completo é montado no servidor (`NEXT_PUBLIC_APP_URL` + `/convite/<token>`) e vai para a tela com botão de copiar.
5. Revogação (`revoked_at`) e expiração (`expires_at`, padrão 30 dias) continuam valendo; a página pública mostra o motivo quando o convite não vale mais.
6. O consumo do convite (`redeem_invite`) é atômico: valida, cria perfil + participação e incrementa `used_count` na mesma transação.

## Alternativas consideradas

| Alternativa | Motivo do descarte |
|---|---|
| Manter uso único | Impede mandar o link em grupo e exige gerar links individuais |
| Guardar o token em claro | Vazamento do banco expõe links válidos; o hash continua servindo à validação |
| Não guardar nada e recriar link ao exibir | Perde a referência do convite, invalida links já compartilhados e duplica registros |

## Consequências

- **Positivas:** um link por grupo; admin revoga quando quiser; banco não guarda token em claro.
- **Negativas:** `APP_SECRET` passa a ser necessário também para reexibir links — se ele mudar, links antigos continuam válidos (hash), mas não podem ser reexibidos. Rotação de `APP_SECRET` deve recriptografar os tokens (tarefa futura) ou gerar novos links.
- Convite válido é, por natureza, uma credencial de entrada na festa: trate como link "semi-público".
