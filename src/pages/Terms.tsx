import LegalPage from "./LegalPage";

const CONTACT_EMAIL = "tggrupos@proton.me";

const Terms = () => (
  <LegalPage title="Termos de Uso">
    <h1>Termos de Uso</h1>
    <p><strong>Última atualização: agosto de 2026</strong></p>

    <h2>1. Aceitação</h2>
    <p>Ao usar o Canais18, você concorda com estes termos. Se não concordar, não utilize o site.</p>

    <h2>2. O que é o Canais18</h2>
    <p>Somos um diretório de grupos e canais do Telegram. Não hospedamos, armazenamos ou distribuímos conteúdo — apenas listamos links para grupos públicos.</p>

    <h2>3. Elegibilidade</h2>
    <p>Você deve ter 18 anos ou mais e estar em uma jurisdição onde o acesso a conteúdo adulto é legal.</p>

    <h2>4. Conteúdo Proibido</h2>
    <p>É <strong>ESTRITAMENTE PROIBIDO</strong> submeter:</p>
    <ul>
      <li>Conteúdo envolvendo menores de idade</li>
      <li>Violência extrema ou real</li>
      <li>Zoofilia ou necrofilia</li>
      <li>Spam, malware ou phishing</li>
      <li>Conteúdo que viole leis aplicáveis</li>
    </ul>

    <h2>5. Conteúdo Permitido</h2>
    <p>Permitimos conteúdo adulto (+18) consensual, incluindo conteúdo erótico/pornográfico legal e grupos de entretenimento adulto. A foto de capa não pode conter nudez explícita.</p>

    <h2>6. Submissão de Grupos</h2>
    <p>Ao submeter um grupo, você confirma que:</p>
    <ul>
      <li>Tem autorização para promovê-lo</li>
      <li>O conteúdo é legal</li>
      <li>Aceita que podemos rejeitar sem justificativa</li>
    </ul>

    <h2>7. Responsabilidade</h2>
    <p><strong>Não somos responsáveis pelo conteúdo dos grupos listados.</strong> Somos apenas um agregador de links. A responsabilidade pelo conteúdo é dos administradores de cada grupo.</p>

    <h2>8. Denúncias</h2>
    <p>Encontrou conteúdo ilegal? Entre em contato:</p>
    <p><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>

    <h2>9. Serviços Pagos</h2>
    <p>Grupos Premium e banners publicitários são pagos e não-reembolsáveis, sujeitos a aprovação.</p>

    <h2>10. Isenção de Garantias</h2>
    <p>O site é fornecido "como está". Não garantimos disponibilidade contínua, resultados de tráfego ou links inalterados.</p>

    <h2>11. Limitação de Responsabilidade</h2>
    <p>Não somos responsáveis por danos diretos, indiretos ou consequenciais decorrentes do uso do site, conteúdo de terceiros, links quebrados ou ações de outros usuários.</p>

    <h2>12. Lei Aplicável</h2>
    <p>Estes termos são regidos pelas leis do Brasil. Foro: Comarca de São Paulo/SP.</p>

    <h2>13. Contato</h2>
    <p>Dúvidas sobre os termos:</p>
    <p><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>

    <hr />
    <p>Ao usar o Canais18, você concorda com estes Termos de Uso.</p>
  </LegalPage>
);

export default Terms;
