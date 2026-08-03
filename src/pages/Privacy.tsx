import LegalPage from "./LegalPage";

const CONTACT_EMAIL = "tggrupos@proton.me";

const Privacy = () => (
  <LegalPage title="Política de Privacidade">
    <h1>Política de Privacidade</h1>
    <p><strong>Última atualização: agosto de 2026</strong></p>

    <h2>1. Informações Coletadas</h2>
    <p>Coletamos apenas o necessário para o funcionamento da plataforma:</p>
    <ul>
      <li><strong>Conta:</strong> email e senha (hash criptografado)</li>
      <li><strong>Submissões:</strong> dados de grupos/canais que você submeter</li>
      <li><strong>Navegação:</strong> endereço IP, navegador, páginas visitadas (via analytics)</li>
    </ul>

    <h2>2. Uso das Informações</h2>
    <p>Utilizamos seus dados para:</p>
    <ul>
      <li>Manter sua conta e autenticação</li>
      <li>Processar e exibir suas submissões de grupos</li>
      <li>Melhorar a plataforma</li>
      <li>Cumprir obrigações legais</li>
    </ul>

    <h2>3. Compartilhamento</h2>
    <p><strong>Não vendemos</strong> dados pessoais.</p>
    <p>Compartilhamos apenas quando exigido por lei ou com provedores de infraestrutura (hospedagem, CDN).</p>

    <h2>4. Cookies</h2>
    <p>Usamos cookies para manter sessões e analisar o uso do site. Você pode desabilitá-los no navegador.</p>

    <h2>5. Seus Direitos</h2>
    <p>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento. Para exercer esses direitos, entre em contato:</p>
    <p><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>

    <h2>6. Menores de Idade</h2>
    <p>Este site é exclusivo para maiores de 18 anos. Não coletamos dados de menores.</p>

    <h2>7. Alterações</h2>
    <p>Podemos atualizar esta política. Mudanças serão publicadas nesta página.</p>

    <hr />
    <p>Em conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018).</p>
  </LegalPage>
);

export default Privacy;
