import LegalPage from "./LegalPage";

const CONTACT_EMAIL = "tggrupos@proton.me";

const Removal = () => (
  <LegalPage title="Remoção de Links">
    <h1>Remoção de Links</h1>
    <p><strong>Última atualização: agosto de 2026</strong></p>

    <h2>Como Solicitar Remoção</h2>
    <p>Envie email para:</p>
    <p><strong><a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></strong></p>
    <p><strong>Assunto:</strong> Solicitação de Remoção - [Nome do Grupo]</p>

    <h2>Informações Necessárias</h2>
    <ol>
      <li>URL da página no Canais18</li>
      <li>Link do grupo/canal no Telegram</li>
      <li>Motivo da remoção</li>
      <li>Prova de propriedade (se possível): screenshot mostrando que você é admin</li>
    </ol>

    <h2>Motivos Válidos</h2>
    <ul>
      <li>Você é o administrador/proprietário do grupo</li>
      <li>O grupo foi encerrado</li>
      <li>Não deseja mais divulgação</li>
      <li>Informações incorretas ou desatualizadas</li>
      <li>Conteúdo viola nossas políticas</li>
    </ul>

    <h2>Tempo de Resposta</h2>
    <ul>
      <li>Remoções normais: 24-48 horas</li>
      <li>Remoções urgentes (conteúdo ilegal): imediato</li>
    </ul>

    <h2>O Que Não Removemos</h2>
    <p>Não removemos se você não é o administrador ou se o grupo é público e não viola políticas.</p>
    <p><strong>Exceção:</strong> Sempre removemos conteúdo ilegal, independente de quem solicita.</p>

    <h2>Após a Remoção</h2>
    <ul>
      <li>Página do grupo é deletada</li>
      <li>Link some dos resultados de busca</li>
      <li>Você recebe confirmação por email</li>
    </ul>

    <h2>Contato</h2>
    <p><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>
    <p><strong>Tempo médio de resposta:</strong> 24-48 horas</p>

    <hr />
    <p>Respeitamos o direito de remoção e processamos solicitações rapidamente.</p>
  </LegalPage>
);

export default Removal;
