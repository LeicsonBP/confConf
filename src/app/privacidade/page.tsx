import type { Metadata } from "next";
import { PerforatedDivider, TicketCard } from "@/design-system/ticket";

export const metadata: Metadata = {
  title: "Privacidade e dados",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
        Transparência
      </p>
      <h1 className="mt-3 font-display text-4xl leading-none">Privacidade e dados</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Resumo de como o confConf trata os dados de quem organiza e de quem participa. Última
        atualização: 14/11/2026.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <TicketCard className="p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-none">Quem é quem</h2>
          <PerforatedDivider className="my-6" />
          <p className="text-sm text-ink-soft">
            Quem organiza a confraternização é o <strong>controlador</strong> dos dados: define o
            evento, envia os convites e decide quando excluir tudo. O confConf atua como{" "}
            <strong>operador</strong>, mantendo a plataforma e o banco de dados.
          </p>
        </TicketCard>

        <TicketCard className="p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-none">O que é coletado</h2>
          <PerforatedDivider className="my-6" />
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            <li>
              <strong>Nome completo, data de nascimento e usuário</strong> — identificação no
              evento e entrada na área do participante.
            </li>
            <li>
              <strong>Senha</strong> — armazenada apenas como hash pelo provedor de autenticação;
              ninguém no confConf consegue ler.
            </li>
            <li>
              <strong>Restrições alimentares</strong> — usadas para o planejamento da comida e para
              quem tira a pessoa no amigo secreto.
            </li>
            <li>
              <strong>Lista de desejos e relatos de problema</strong> — visíveis ao amigo secreto e
              a quem organiza, conforme o caso.
            </li>
            <li>
              <strong>Registros de acesso e auditoria</strong> — data/hora de ações
              administrativas, sem senhas ou conteúdo sensível.
            </li>
          </ul>
          <p className="mt-4 text-xs text-ink-faint">
            Não há anúncios, rastreadores de terceiros nem venda de dados. Os cookies são apenas de
            sessão.
          </p>
        </TicketCard>

        <TicketCard className="p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-none">Para que e por quanto tempo</h2>
          <PerforatedDivider className="my-6" />
          <p className="text-sm text-ink-soft">
            Os dados são usados exclusivamente para organizar a confraternização, o amigo secreto, a
            lista de desejos e o planejamento alimentar. Ficam guardados enquanto o evento existir.
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            Ao <strong>remover um participante</strong>, a conta e os dados daquela pessoa são
            apagados. Ao <strong>excluir a confraternização</strong>, participantes, convites, pares,
            listas e relatos são apagados junto.
          </p>
        </TicketCard>

        <TicketCard className="p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-none">Com quem é compartilhado</h2>
          <PerforatedDivider className="my-6" />
          <p className="text-sm text-ink-soft">
            Apenas com os provedores de infraestrutura necessários: Supabase (banco de dados e
            autenticação) e Vercel (hospedagem da aplicação), ambos com acesso restrito. O
            participante vê somente os próprios dados; quem organiza vê os dados dos participantes
            do evento para conseguir organizar a festa.
          </p>
        </TicketCard>

        <TicketCard className="p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-none">Seus direitos</h2>
          <PerforatedDivider className="my-6" />
          <p className="text-sm text-ink-soft">
            Você pode pedir acesso, correção (o próprio perfil permite ajustar as restrições) ou
            exclusão dos seus dados. Como o evento é de quem organiza, o pedido de exclusão deve ser
            feito a essa pessoa; ela pode remover você pelo painel, o que apaga a conta. Para
            dúvidas sobre a plataforma, procure quem organiza a sua confraternização.
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            Medidas de segurança: isolamento por linha no banco (RLS), senhas com hash, convites com
            token protegido, acesso administrativo restrito e registro de auditoria.
          </p>
        </TicketCard>
      </div>
    </main>
  );
}
