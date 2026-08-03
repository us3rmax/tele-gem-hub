import LegalPage from "./LegalPage";

const CONTACT_EMAIL = "tggrupos@proton.me";

const Dmca = () => (
  <LegalPage title="DMCA - Direitos Autorais">
    <h1>DMCA - Direitos Autorais</h1>
    <p><strong>Última atualização: agosto de 2026</strong></p>

    <h2>Nossa Função</h2>
    <p><strong>O Canais18 é um diretório/agregador de links.</strong> Não hospedamos, armazenamos ou distribuímos conteúdo. Apenas fornecemos links para grupos públicos do Telegram.</p>

    <h2>Notificação de Violação</h2>
    <p>Se acredita que seu conteúdo protegido por direitos autorais está sendo referenciado indevidamente, envie uma notificação contendo:</p>
    <ul>
      <li>Descrição da obra protegida e link do original</li>
      <li>URL do grupo no Canais18 e/ou link do Telegram</li>
      <li>Seu nome, email e assinatura</li>
      <li>Declaração de boa fé</li>
    </ul>

    <h2>Onde Enviar</h2>
    <p><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>
    <p><strong>Assunto:</strong> DMCA Takedown - [Nome da Obra]</p>

    <h2>O Que Fazemos</h2>
    <ul>
      <li>Analisamos a notificação em 24-48 horas</li>
      <li>Se procedente, removemos o link</li>
      <li>Notificamos o usuário que submeteu</li>
      <li>Usuários reincidentes têm contas suspensas</li>
    </ul>

    <h2>Contra-Notificação</h2>
    <p>Se seu grupo foi removido por engano, envie contra-notificação com identificação do conteúdo e declaração de boa fé para o mesmo email.</p>

    <h2>Notificações Falsas</h2>
    <p>Notificações falsas podem resultar em responsabilidade legal e banimento.</p>

    <h2>Limitações de Responsabilidade</h2>
    <p>Não somos responsáveis por:</p>
    <ul>
      <li>Conteúdo hospedado no Telegram (fora de nosso controle)</li>
      <li>Violações que ocorram nos grupos após a listagem</li>
      <li>Conteúdo em grupos privados</li>
    </ul>

    <h2>Conformidade Legal</h2>
    <p>Esta política segue o DMCA, a Lei de Direitos Autorais Brasileira (Lei 9.610/98) e o Marco Civil da Internet (Lei 12.965/14).</p>

    <hr />
    <p>Protegemos direitos autorais e removemos violações prontamente.</p>
  </LegalPage>
);

export default Dmca;
