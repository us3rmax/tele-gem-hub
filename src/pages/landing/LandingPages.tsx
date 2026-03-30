import LandingPage from "./LandingPage";
import { LANDING_PAGES } from "./landingPagesData";

// /telegram-putaria
export function TelegramPutariaPage() {
  const data = LANDING_PAGES.find((p) => p.rota === "/telegram-putaria")!;
  return <LandingPage {...data} />;
}

// /grupos-putaria-telegram
export function GruposPutariaTelegramPage() {
  const data = LANDING_PAGES.find((p) => p.rota === "/grupos-putaria-telegram")!;
  return <LandingPage {...data} />;
}

// /telegram-porno
export function TelegramPornoPage() {
  const data = LANDING_PAGES.find((p) => p.rota === "/telegram-porno")!;
  return <LandingPage {...data} />;
}

// /telegram-xxx
export function TelegramXxxPage() {
  const data = LANDING_PAGES.find((p) => p.rota === "/telegram-xxx")!;
  return <LandingPage {...data} />;
}

// /grupos-telegram-18
export function GruposTelegram18Page() {
  const data = LANDING_PAGES.find((p) => p.rota === "/grupos-telegram-18")!;
  return <LandingPage {...data} />;
}

// /novinhas-telegram
export function NovinhasTelegramPage() {
  const data = LANDING_PAGES.find((p) => p.rota === "/novinhas-telegram")!;
  return <LandingPage {...data} />;
}

// /vazados-telegram
export function VazadosTelegramPage() {
  const data = LANDING_PAGES.find((p) => p.rota === "/vazados-telegram")!;
  return <LandingPage {...data} />;
}

// /onlyfans-telegram
export function OnlyfansTelegramPage() {
  const data = LANDING_PAGES.find((p) => p.rota === "/onlyfans-telegram")!;
  return <LandingPage {...data} />;
}

// /canal-de-putaria
export function CanalDePutariaPage() {
  const data = LANDING_PAGES.find((p) => p.rota === "/canal-de-putaria")!;
  return <LandingPage {...data} />;
}

