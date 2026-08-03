import LegalPage from "./LegalPage";

const CONTACT_EMAIL = "tggrupos@proton.me";

const Usc2257 = () => (
  <LegalPage title="18 U.S.C. 2257 - Declaração de Conformidade">
    <h1>18 U.S.C. 2257 - Declaração de Conformidade</h1>
    <p><strong>Última atualização: agosto de 2026</strong></p>

    <h2>Nossa Função</h2>
    <p><strong>O Canais18 é um diretório/agregador de links.</strong></p>
    <ul>
      <li>Não produzimos conteúdo adulto</li>
      <li>Não hospedamos fotos ou vídeos</li>
      <li>Não armazenamos material adulto primário</li>
      <li>Apenas listamos links para grupos/canais públicos do Telegram</li>
    </ul>

    <h2>Isenção 2257</h2>
    <p>De acordo com 18 U.S.C. 2257 e 28 C.F.R. 75, somos <strong>ISENTOS</strong> dos requisitos de manutenção de registros porque:</p>
    <ul>
      <li>Não somos produtores primários ou secundários de conteúdo adulto</li>
      <li>Não editamos, modificamos ou reprocessamos material existente</li>
      <li>Fornecemos apenas links/URLs — o conteúdo é hospedado por terceiros (Telegram)</li>
    </ul>

    <h2>Responsabilidade dos Grupos</h2>
    <p>Os <strong>administradores dos grupos/canais listados</strong> são responsáveis por manter registros 2257 apropriados e verificar a idade de todos os participantes em conteúdo adulto.</p>

    <h2>Política de Conteúdo</h2>
    <p>É <strong>ESTRITAMENTE PROIBIDO</strong> em nosso site:</p>
    <ul>
      <li>Conteúdo envolvendo menores de idade</li>
      <li>Links para conteúdo ilegal</li>
    </ul>
    <p>Todos os grupos são revisados antes da aprovação. Denúncias são investigadas e removemos links suspeitos imediatamente.</p>

    <h2>Denúncias</h2>
    <p>Suspeita de violação? Entre em contato:</p>
    <p><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>

    <h2>Verificação de Idade</h2>
    <p>Nosso site exige confirmação de 18+ anos para acesso e possui aviso claro sobre conteúdo adulto.</p>

    <h2>Cooperação com Autoridades</h2>
    <p>Cooperamos plenamente com a Polícia Federal, Ministério Público, FBI, Interpol e outras autoridades competentes.</p>

    <h2>Tolerância Zero</h2>
    <p>Temos tolerância zero com exploração infantil e conteúdo ilegal envolvendo menores. Denunciamos imediatamente às autoridades.</p>

    <h2>Conformidade Legal</h2>
    <ul>
      <li>18 U.S.C. 2257 e 28 C.F.R. Part 75</li>
      <li>Estatuto da Criança e do Adolescente (ECA - Lei 8.069/90)</li>
      <li>Código Penal Brasileiro (Art. 241-A a 241-E)</li>
    </ul>

    <hr />
    <p>Levamos a conformidade legal muito a sério e protegemos menores rigorosamente.</p>
  </LegalPage>
);

export default Usc2257;
