import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import GroupCard from "@/components/GroupCard";
import BannerAd from "@/components/BannerAd";
import LandingSEOContent from "@/components/landing/LandingSEOContent";
import { supabase } from "@/integrations/supabase/client";
import type { Grupo } from "@/data/mock";

// Configurações por página — cada description é única para evitar canibalização e duplicidade
const pageConfigs: Record<string, any> = {
  "/telegram-porno": {
    title: "Telegram Porno - Melhores Canais +18",
    seoTitle: "Telegram Porno - Canais e Grupos +18 | Canais18",
    description: "Diretório com +1.900 canais de telegram porno verificados. Vídeos HD, amadoras e conteúdo profissional. Acesse grátis em canais18.com.",
    keywords: "telegram porno, canais telegram porno, grupos telegram porno",
    filter: "category.ilike.%porno%,category.ilike.%xxx%,category.ilike.%amadoras%",
    categoryLink: "Porno",
    seoKeyword: "canais de porno no Telegram",
    seoCategory: "Porno",
  },
  "/putaria-telegram": {
    title: "Putaria Telegram - Grupos e Canais Brasil",
    seoTitle: "Putaria Telegram - Grupos +18 Verificados | Canais18",
    description: "Lista atualizada de grupos de putaria no Telegram com +1.900 canais ativos. Verificados diariamente por nossa equipe. Entre agora.",
    keywords: "putaria telegram, grupos putaria telegram, telegram putaria brasil",
    filter: "category.ilike.%putaria%,category.ilike.%novinhas%,category.ilike.%amadoras%",
    categoryLink: "Putaria",
  },
  "/telegram-xxx": {
    title: "Telegram XXX - Canais Adultos Verificados",
    seoTitle: "Telegram XXX - Melhores Canais +18 | Canais18",
    description: "Conteúdo XXX no Telegram organizado por categoria: amadoras, casadas, celebridades. +1.900 grupos verificados em canais18.com.",
    keywords: "telegram xxx, canais telegram xxx, xxx telegram",
    filter: "category.ilike.%xxx%,category.ilike.%porno%",
    categoryLink: "XXX",
  },
  "/grupos-putaria-telegram": {
    title: "Grupos Putaria Telegram - Lista Atualizada",
    seoTitle: "Grupos Putaria Telegram - +100 Grupos Ativos | Canais18",
    description: "Ranking dos grupos de putaria telegram mais populares. Membros ativos, previews e links diretos. Atualizado todo dia em canais18.com.",
    keywords: "grupos putaria telegram, lista grupos putaria, grupos telegram putaria",
    filter: "category.ilike.%putaria%,category.ilike.%grupos%",
    categoryLink: "Putaria",
  },

  "/telegram-putaria": {
    title: "Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Putaria Telegram - Grupos Verificados | Canais18",
    description: "Os melhores grupos de putaria do Telegram estão reunidos aqui. +1.900 canais verificados, sem links quebrados. Acesse canais18.com.",
    keywords: "putaria telegram, grupos putaria telegram, telegram putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/canal-de-putaria": {
    title: "Canal de Putaria - Grupos e Canais +18 | Canais18",
    seoTitle: "Canal de Putaria - Grupos Verificados | Canais18",
    description: "Encontre canais de putaria no Telegram com conteúdo diário. Nossa equipe testa cada link antes de publicar. 100% grátis.",
    keywords: "canal de putaria, grupos canal de putaria, telegram canal de putaria",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/grupo-putaria-telegram": {
    title: "Grupo Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupo Putaria Telegram - Grupos Verificados | Canais18",
    description: "Grupos de putaria telegram ativos e verificados em 2026. Veja quantos membros cada grupo tem antes de entrar. Canais18.com.",
    keywords: "grupo putaria telegram, grupos grupo putaria telegram, telegram grupo putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/xxx-telegram": {
    title: "XXX Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "XXX Telegram - Grupos Verificados | Canais18",
    description: "Canais XXX no Telegram para adultos. Conteúdo sem censura, amadoras brasileiras e produções internacionais. Acesse grátis.",
    keywords: "xxx telegram, grupos xxx telegram, telegram xxx telegram",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/grupos-porno-telegram": {
    title: "Grupos Porno Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Porno Telegram - Grupos Verificados | Canais18",
    description: "Top grupos porno do Telegram organizados por popularidade. Previews, contagem de membros e acesso direto. Canais18.com.",
    keywords: "grupos porno telegram, grupos grupos porno telegram, telegram grupos porno telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/canais-putaria-telegram": {
    title: "Canais Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Canais Putaria Telegram - Grupos Verificados | Canais18",
    description: "Catálogo completo de canais putaria telegram com vídeos, fotos e lives exclusivas. Atualização diária. 100% gratuito.",
    keywords: "canais putaria telegram, grupos canais putaria telegram, telegram canais putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/putaria-brasileira": {
    title: "Putaria Brasileira - Grupos e Canais +18 | Canais18",
    seoTitle: "Putaria Brasileira - Grupos Verificados | Canais18",
    description: "Putaria brasileira no Telegram: amadoras, casadas e conteúdo autêntico nacional. Grupos verificados e sem spam.",
    keywords: "putaria brasileira, grupos putaria brasileira, telegram putaria brasileira",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/putaria-brasileira-telegram": {
    title: "Putaria Brasileira Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Putaria Brasileira Telegram - Grupos Verificados | Canais18",
    description: "Grupos de putaria brasileira telegram com conteúdo original de creators brasileiros. Comunidade ativa e verificada.",
    keywords: "putaria brasileira telegram, grupos putaria brasileira telegram, telegram putaria brasileira telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/grupos-de-putaria-telegram": {
    title: "Grupos de Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos de Putaria Telegram - Grupos Verificados | Canais18",
    description: "Lista definitiva de grupos de putaria telegram: navegue por categoria, veja previews e entre direto no canal. Canais18.com.",
    keywords: "grupos de putaria telegram, grupos grupos de putaria telegram, telegram grupos de putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/grupo-de-putaria-telegram": {
    title: "Grupo de Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupo de Putaria Telegram - Grupos Verificados | Canais18",
    description: "Grupo de putaria telegram ativo agora? Veja nossa lista atualizada com status de cada canal em tempo real.",
    keywords: "grupo de putaria telegram, grupos grupo de putaria telegram, telegram grupo de putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/xvideos-putaria": {
    title: "Xvideos Putaria - Grupos e Canais +18 | Canais18",
    seoTitle: "Xvideos Putaria - Grupos Verificados | Canais18",
    description: "Canais estilo xvideos no Telegram: vídeos completos, HD, sem censura. Acesso direto e gratuito em canais18.com.",
    keywords: "xvideos putaria, grupos xvideos putaria, telegram xvideos putaria",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/video-porno-telegram": {
    title: "Video Porno Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Video Porno Telegram - Grupos Verificados | Canais18",
    description: "Vídeos porno no Telegram: catálogo com milhares de grupos organizados por categoria. Acesse links verificados.",
    keywords: "video porno telegram, grupos video porno telegram, telegram video porno telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/porno-gratis-telegram": {
    title: "Porno Grátis Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Porno Grátis Telegram - Grupos Verificados | Canais18",
    description: "Porno grátis no Telegram sem cadastro, sem pagamento. Diretório verificado com +1.900 grupos. Canais18.com.",
    keywords: "porno grátis telegram, grupos porno grátis telegram, telegram porno grátis telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/xvideos-porno-telegram": {
    title: "Xvideos Porno Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Xvideos Porno Telegram - Grupos Verificados | Canais18",
    description: "Conteúdo xvideos gratuito no Telegram: vídeos completos em HD. Grupos testados e funcionando. Acesse agora.",
    keywords: "xvideos porno telegram, grupos xvideos porno telegram, telegram xvideos porno telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/telegram-sexo": {
    title: "Telegram Sexo - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram Sexo - Grupos Verificados | Canais18",
    description: "Grupos de sexo telegram com chat ativo, vídeos e fotos. Comunidade +18 verificada diariamente. Entre grátis.",
    keywords: "telegram sexo, grupos telegram sexo, telegram telegram sexo",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/sexo-telegram": {
    title: "Sexo Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Sexo Telegram - Grupos Verificados | Canais18",
    description: "Canais de sexo no Telegram para maiores de 18. Conteúdo variado: amadoras, profissional, fetiches. Verificado.",
    keywords: "sexo telegram, grupos sexo telegram, telegram sexo telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/video-sexo-telegram": {
    title: "Video Sexo Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Video Sexo Telegram - Grupos Verificados | Canais18",
    description: "Vídeos de sexo no Telegram: acervo atualizado com conteúdo de qualidade. Previews antes de entrar em cada grupo.",
    keywords: "video sexo telegram, grupos video sexo telegram, telegram video sexo telegram",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/videos-eroticos-telegram": {
    title: "Vídeos Eróticos Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vídeos Eróticos Telegram - Grupos Verificados | Canais18",
    description: "Vídeos eróticos telegram com curadoria: cinema adulto, amadoras, produções brasileiras. Acesse canais18.com.",
    keywords: "vídeos eróticos telegram, grupos vídeos eróticos telegram, telegram vídeos eróticos telegram",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/chat-sexo-telegram": {
    title: "Chat Sexo Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Chat Sexo Telegram - Grupos Verificados | Canais18",
    description: "Chat de sexo no Telegram com membros reais e ativos. Sem bots, sem spam. Comunidade verificada em canais18.com.",
    keywords: "chat sexo telegram, grupos chat sexo telegram, telegram chat sexo telegram",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/grupos-telegram-18": {
    title: "Grupos Telegram 18 - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram 18 - Grupos Verificados | Canais18",
    description: "Grupos telegram 18+: catálogo completo de canais adultos verificados. Navegue por categoria e entre direto.",
    keywords: "grupos telegram 18, grupos grupos telegram 18, telegram grupos telegram 18",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/canais-telegram-18": {
    title: "Canais Telegram 18 - Grupos e Canais +18 | Canais18",
    seoTitle: "Canais Telegram 18 - Grupos Verificados | Canais18",
    description: "Canais telegram 18+ organizados: porno, putaria, amadoras, vazados, onlyfans. +1.900 grupos testados.",
    keywords: "canais telegram 18, grupos canais telegram 18, telegram canais telegram 18",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/telegram-adulto": {
    title: "Telegram Adulto - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram Adulto - Grupos Verificados | Canais18",
    description: "Telegram adulto sem censura: explore categorias de conteúdo +18 com links diretos para cada grupo ativo.",
    keywords: "telegram adulto, grupos telegram adulto, telegram telegram adulto",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupos-telegram-geral": {
    title: "Grupos Telegram Geral - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram Geral - Grupos Verificados | Canais18",
    description: "Grupos telegram geral +18: conteúdo adulto variado em um só lugar. Verificação diária de links e atividade.",
    keywords: "grupos telegram geral, grupos grupos telegram geral, telegram grupos telegram geral",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/links-telegram": {
    title: "Links Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Links Telegram - Grupos Verificados | Canais18",
    description: "Links telegram adultos verificados: acesse grupos e canais +18 com um clique. Atualizado diariamente.",
    keywords: "links telegram, grupos links telegram, telegram links telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/telegram-proibido": {
    title: "Telegram Proibido - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram Proibido - Grupos Verificados | Canais18",
    description: "Conteúdo telegram proibido: grupos exclusivos que não estão em outros diretórios. Acesso gratuito e verificado.",
    keywords: "telegram proibido, grupos telegram proibido, telegram telegram proibido",
    filter: "category.eq.geral,category.eq.putaria",
    categoryLink: "geral",
  },
  "/grupo-telegram-18": {
    title: "Grupo Telegram 18 - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupo Telegram 18 - Grupos Verificados | Canais18",
    description: "Grupo telegram 18 ativo agora? Consulte nossa lista com status em tempo real e entre direto no canal.",
    keywords: "grupo telegram 18, grupos grupo telegram 18, telegram grupo telegram 18",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupos-telegram-pode-tudo": {
    title: "Grupos Telegram Pode Tudo - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram Pode Tudo - Grupos Verificados | Canais18",
    description: "Grupos telegram pode tudo: sem censura, sem regras. Comunidade +18 ativa e verificada em canais18.com.",
    keywords: "grupos telegram pode tudo, grupos grupos telegram pode tudo, telegram grupos telegram pode tudo",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupos-telegram-secretos": {
    title: "Grupos Telegram Secretos - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram Secretos - Grupos Verificados | Canais18",
    description: "Grupos telegram secretos: canais exclusivos que poucas pessoas conhecem. Lista atualizada e verificada.",
    keywords: "grupos telegram secretos, grupos grupos telegram secretos, telegram grupos telegram secretos",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupos-18-telegram": {
    title: "Grupos 18 Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos 18 Telegram - Grupos Verificados | Canais18",
    description: "Grupos 18 telegram reunidos: navegue por categoria, veja contagem de membros e acesse links diretos.",
    keywords: "grupos 18 telegram, grupos grupos 18 telegram, telegram grupos 18 telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupo-telegram-proibido": {
    title: "Grupo Telegram Proibido - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupo Telegram Proibido - Grupos Verificados | Canais18",
    description: "Grupo telegram proibido com conteúdo exclusivo. Verificado diariamente para garantir links funcionais.",
    keywords: "grupo telegram proibido, grupos grupo telegram proibido, telegram grupo telegram proibido",
    filter: "category.eq.geral,category.eq.putaria",
    categoryLink: "geral",
  },
  "/grupos-telegram": {
    title: "Grupos Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram - Grupos Verificados | Canais18",
    description: "Diretório completo de grupos telegram adultos: +1.900 canais verificados, organizados e atualizados todo dia.",
    keywords: "grupos telegram, grupos grupos telegram, telegram grupos telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/novinhas-telegram": {
    title: "Novinhas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Novinhas Telegram - Grupos Verificados | Canais18",
    description: "Grupos de novinhas telegram: influencers, amadoras e criadoras de conteúdo. Previews e links diretos.",
    keywords: "novinhas telegram, grupos novinhas telegram, telegram novinhas telegram",
    filter: "category.eq.novinhas",
    categoryLink: "novinhas",
  },
  "/mulheres-nuas-telegram": {
    title: "Mulheres Nuas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Mulheres Nuas Telegram - Grupos Verificados | Canais18",
    description: "Mulheres nuas no Telegram: conteúdo de amadoras brasileiras sem edição. Grupos verificados e ativos.",
    keywords: "mulheres nuas telegram, grupos mulheres nuas telegram, telegram mulheres nuas telegram",
    filter: "category.eq.amadoras,category.eq.novinhas",
    categoryLink: "amadoras",
  },
  "/vazadinhos-telegram": {
    title: "Vazadinhos Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazadinhos Telegram - Grupos Verificados | Canais18",
    description: "Vazadinhos fresquinhos no Telegram: conteúdo vazado atualizado diariamente. Links testados e funcionando.",
    keywords: "vazadinhos telegram, grupos vazadinhos telegram, telegram vazadinhos telegram",
    filter: "category.eq.vazados,category.eq.novinhas",
    categoryLink: "vazados",
  },
  "/vazados-telegram": {
    title: "Vazados Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazados Telegram - Grupos Verificados | Canais18",
    description: "Vazados telegram: canal com conteúdo exclusivo vazado. Previews, membros ativos e acesso direto.",
    keywords: "vazados telegram, grupos vazados telegram, telegram vazados telegram",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/telegram-vazados": {
    title: "Telegram Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram Vazados - Grupos Verificados | Canais18",
    description: "Telegram vazados: tudo que vazou está aqui. Grupos verificados com conteúdo de qualidade e links ativos.",
    keywords: "telegram vazados, grupos telegram vazados, telegram telegram vazados",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/vazou-telegram": {
    title: "Vazou Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazou Telegram - Grupos Verificados | Canais18",
    description: "Vazou telegram: conteúdo recém-vazado disponível agora. Acesse antes que saia do ar. Links verificados.",
    keywords: "vazou telegram, grupos vazou telegram, telegram vazou telegram",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/vazado-telegram": {
    title: "Vazado Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazado Telegram - Grupos Verificados | Canais18",
    description: "Vazado telegram: acervo de conteúdo vazado reunido em um só lugar. Navegue e entre direto no grupo.",
    keywords: "vazado telegram, grupos vazado telegram, telegram vazado telegram",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/grupos-telegram-vazados": {
    title: "Grupos Telegram Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram Vazados - Grupos Verificados | Canais18",
    description: "Grupos telegram vazados: lista atualizada de canais com conteúdo exclusivo. Verificação diária.",
    keywords: "grupos telegram vazados, grupos grupos telegram vazados, telegram grupos telegram vazados",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/onlyfans-telegram": {
    title: "OnlyFans Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "OnlyFans Telegram - Grupos Verificados | Canais18",
    description: "OnlyFans telegram grátis: conteúdo exclusivo de criadoras disponível sem assinatura. +1.900 grupos verificados.",
    keywords: "onlyfans telegram, grupos onlyfans telegram, telegram onlyfans telegram",
    filter: "category.eq.onlyfans",
    categoryLink: "onlyfans",
  },
  "/onlyfans-packs": {
    title: "OnlyFans Packs - Grupos e Canais +18 | Canais18",
    seoTitle: "OnlyFans Packs - Grupos Verificados | Canais18",
    description: "Packs OnlyFans no Telegram: coleções completas de criadoras disponíveis para download. Grátis e verificado.",
    keywords: "onlyfans packs, grupos onlyfans packs, telegram onlyfans packs",
    filter: "category.eq.onlyfans",
    categoryLink: "onlyfans",
  },
  "/onlyfans-vazados": {
    title: "OnlyFans Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "OnlyFans Vazados - Grupos Verificados | Canais18",
    description: "OnlyFans vazados telegram: conteúdo premium de graça. Lista de grupos com previews e links diretos.",
    keywords: "onlyfans vazados, grupos onlyfans vazados, telegram onlyfans vazados",
    filter: "category.eq.onlyfans,category.eq.vazados",
    categoryLink: "onlyfans",
  },
  "/telegram-onlyfans": {
    title: "Telegram OnlyFans - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram OnlyFans - Grupos Verificados | Canais18",
    description: "OnlyFans no Telegram: acesso gratuito a conteúdo exclusivo de criadoras brasileiras e internacionais.",
    keywords: "telegram onlyfans, grupos telegram onlyfans, telegram telegram onlyfans",
    filter: "category.eq.onlyfans",
    categoryLink: "onlyfans",
  },
  "/michele-umezu-onlyfans": {
    title: "Michele Umezu OnlyFans - Grupos e Canais +18 | Canais18",
    seoTitle: "Michele Umezu OnlyFans - Grupos Verificados | Canais18",
    description: "Conteúdo Michele Umezu no Telegram: grupos com material exclusivo da criadora. Verificado e atualizado.",
    keywords: "michele umezu onlyfans, grupos michele umezu onlyfans, telegram michele umezu onlyfans",
    filter: "category.eq.onlyfans",
    categoryLink: "onlyfans",
  },
  "/privacy-telegram": {
    title: "Privacy Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Telegram - Grupos Verificados | Canais18",
    description: "Privacy telegram: packs e conteúdo exclusivo de modelos brasileiras. Links diretos e verificados.",
    keywords: "privacy telegram, grupos privacy telegram, telegram privacy telegram",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/privacy-gratis": {
    title: "Privacy Grátis - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Grátis - Grupos Verificados | Canais18",
    description: "Privacy grátis no Telegram: acesse conteúdo de modelos sem pagar assinatura. Canais verificados.",
    keywords: "privacy grátis, grupos privacy grátis, telegram privacy grátis",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/erome-privacy": {
    title: "Erome Privacy - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Privacy - Grupos Verificados | Canais18",
    description: "Erome e Privacy no Telegram reunidos: conteúdo de plataformas pagas disponível gratuitamente.",
    keywords: "erome privacy, grupos erome privacy, telegram erome privacy",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/privacy-vazados": {
    title: "Privacy Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Vazados - Grupos Verificados | Canais18",
    description: "Privacy vazados telegram: conteúdo exclusivo de modelos brasileiras vazado. Atualizado diariamente.",
    keywords: "privacy vazados, grupos privacy vazados, telegram privacy vazados",
    filter: "category.eq.privacy,category.eq.vazados",
    categoryLink: "privacy",
  },
  "/erome-vazados": {
    title: "Erome Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Vazados - Grupos Verificados | Canais18",
    description: "Vazados do Erome no Telegram: conteúdo exclusivo de criadoras disponível para acesso direto.",
    keywords: "erome vazados, grupos erome vazados, telegram erome vazados",
    filter: "category.eq.privacy,category.eq.vazados",
    categoryLink: "privacy",
  },
  "/erome-vazado": {
    title: "Erome Vazado - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Vazado - Grupos Verificados | Canais18",
    description: "Erome vazado telegram: acervo de conteúdo vazado do Erome. Links testados e funcionando.",
    keywords: "erome vazado, grupos erome vazado, telegram erome vazado",
    filter: "category.eq.privacy,category.eq.vazados",
    categoryLink: "privacy",
  },
  "/erome-vazou": {
    title: "Erome Vazou - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Vazou - Grupos Verificados | Canais18",
    description: "Erome vazou telegram: conteúdo recém-vazado disponível agora. Acesse antes que seja removido.",
    keywords: "erome vazou, grupos erome vazou, telegram erome vazou",
    filter: "category.eq.privacy,category.eq.vazados",
    categoryLink: "privacy",
  },
  "/erome-gostosa": {
    title: "Erome Gostosa - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Gostosa - Grupos Verificados | Canais18",
    description: "Erome gostosa telegram: conteúdo de modelos brasileiras no Telegram. Previews e acesso direto.",
    keywords: "erome gostosa, grupos erome gostosa, telegram erome gostosa",
    filter: "category.eq.amadoras,category.eq.privacy",
    categoryLink: "amadoras",
  },
  "/vazados-erome": {
    title: "Vazados Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazados Erome - Grupos Verificados | Canais18",
    description: "Vazados erome telegram: catálogo de conteúdo exclusivo vazado de criadoras. Verificado diariamente.",
    keywords: "vazados erome, grupos vazados erome, telegram vazados erome",
    filter: "category.eq.vazados,category.eq.privacy",
    categoryLink: "vazados",
  },
  "/dra-sophia-privacy": {
    title: "Dra Sophia Privacy - Grupos e Canais +18 | Canais18",
    seoTitle: "Dra Sophia Privacy - Grupos Verificados | Canais18",
    description: "Dra Sophia Privacy telegram: conteúdo exclusivo da criadora. Grupos verificados com acesso direto.",
    keywords: "dra sophia privacy, grupos dra sophia privacy, telegram dra sophia privacy",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/erome-juliana-silva": {
    title: "Erome Juliana Silva - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Juliana Silva - Grupos Verificados | Canais18",
    description: "Erome Juliana Silva telegram: material exclusivo da modelo no Telegram. Links testados e ativos.",
    keywords: "erome juliana silva, grupos erome juliana silva, telegram erome juliana silva",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/bia-albina-erome": {
    title: "Bia Albina Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Bia Albina Erome - Grupos Verificados | Canais18",
    description: "Bia Albina Erome telegram: conteúdo da criadora disponível gratuitamente. Links verificados.",
    keywords: "bia albina erome, grupos bia albina erome, telegram bia albina erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/cosvickye-erome": {
    title: "Cosvickye Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Cosvickye Erome - Grupos Verificados | Canais18",
    description: "Cosvickye Erome telegram: conteúdo exclusivo da criadora. Grupos ativos e links verificados.",
    keywords: "cosvickye erome, grupos cosvickye erome, telegram cosvickye erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/nayzinha-erome": {
    title: "Nayzinha Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Nayzinha Erome - Grupos Verificados | Canais18",
    description: "Nayzinha Erome telegram: material exclusivo disponível agora. Acesse direto do canais18.com.",
    keywords: "nayzinha erome, grupos nayzinha erome, telegram nayzinha erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/privacy-bad-mi": {
    title: "Privacy Bad Mi - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Bad Mi - Grupos Verificados | Canais18",
    description: "Privacy Bad Mi telegram: conteúdo exclusivo da modelo. Grupos verificados e com links ativos.",
    keywords: "privacy bad mi, grupos privacy bad mi, telegram privacy bad mi",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/privacy-display-apk": {
    title: "Privacy Display APK - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Display APK - Grupos Verificados | Canais18",
    description: "Privacy Display APK telegram: grupos com conteúdo exclusivo da plataforma. Verificado e ativo.",
    keywords: "privacy display apk, grupos privacy display apk, telegram privacy display apk",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/erome-nicole-rodrigues": {
    title: "Erome Nicole Rodrigues - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Nicole Rodrigues - Grupos Verificados | Canais18",
    description: "Nicole Rodrigues Erome telegram: conteúdo da modelo disponível gratuitamente. Links diretos.",
    keywords: "erome nicole rodrigues, grupos erome nicole rodrigues, telegram erome nicole rodrigues",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/nyvi-estephan-erome": {
    title: "Nyvi Estephan Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Nyvi Estephan Erome - Grupos Verificados | Canais18",
    description: "Nyvi Estephan Erome telegram: material exclusivo da influencer. Grupos verificados e ativos.",
    keywords: "nyvi estephan erome, grupos nyvi estephan erome, telegram nyvi estephan erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/nayara-erome": {
    title: "Nayara Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Nayara Erome - Grupos Verificados | Canais18",
    description: "Nayara Erome telegram: conteúdo da criadora disponível agora. Acesse links verificados.",
    keywords: "nayara erome, grupos nayara erome, telegram nayara erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/jenifer-novaki-privacy": {
    title: "Jenifer Novaki Privacy - Grupos e Canais +18 | Canais18",
    seoTitle: "Jenifer Novaki Privacy - Grupos Verificados | Canais18",
    description: "Jenifer Novaki Privacy telegram: conteúdo exclusivo da modelo. Grupos com links funcionais.",
    keywords: "jenifer novaki privacy, grupos jenifer novaki privacy, telegram jenifer novaki privacy",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/camila-prado-privacy": {
    title: "Camila Prado Privacy - Grupos e Canais +18 | Canais18",
    seoTitle: "Camila Prado Privacy - Grupos Verificados | Canais18",
    description: "Camila Prado Privacy telegram: material da criadora disponível gratuitamente. Verificado.",
    keywords: "camila prado privacy, grupos camila prado privacy, telegram camila prado privacy",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/mae-e-filha-erome": {
    title: "Mae e Filha Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Mae e Filha Erome - Grupos Verificados | Canais18",
    description: "Mãe e filha Erome telegram: conteúdo da dupla disponível no Telegram. Links verificados.",
    keywords: "mae e filha erome, grupos mae e filha erome, telegram mae e filha erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/amadoras-telegram": {
    title: "Amadoras Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Amadoras Telegram - Grupos Verificados | Canais18",
    description: "Amadoras telegram brasileiras: conteúdo real de criadoras nacionais. +1.900 grupos verificados.",
    keywords: "amadoras telegram, grupos amadoras telegram, telegram amadoras telegram",
    filter: "category.eq.amadoras",
    categoryLink: "amadoras",
  },
  "/amadoras-quentes": {
    title: "Amadoras Quentes - Grupos e Canais +18 | Canais18",
    seoTitle: "Amadoras Quentes - Grupos Verificados | Canais18",
    description: "Amadoras quentes telegram: conteúdo autêntico de amadoras brasileiras. Previews e links diretos.",
    keywords: "amadoras quentes, grupos amadoras quentes, telegram amadoras quentes",
    filter: "category.eq.amadoras",
    categoryLink: "amadoras",
  },
  "/gay-telegram": {
    title: "Gay Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Gay Telegram - Grupos Verificados | Canais18",
    description: "Grupos gay telegram verificados: comunidade LGBT ativa e segura. Canais testados diariamente.",
    keywords: "gay telegram, grupos gay telegram, telegram gay telegram",
    filter: "category.eq.gay",
    categoryLink: "gay",
  },
  "/fetiche-telegram": {
    title: "Fetiche Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Fetiche Telegram - Grupos Verificados | Canais18",
    description: "Fetiche telegram: grupos especializados para cada preferência. Comunidade sem julgamento e verificada.",
    keywords: "fetiche telegram, grupos fetiche telegram, telegram fetiche telegram",
    filter: "category.eq.fetiche",
    categoryLink: "fetiche",
  },
  "/casadas-telegram": {
    title: "Casadas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Casadas Telegram - Grupos Verificados | Canais18",
    description: "Casadas telegram: conteúdo de mulheres casadas no Telegram. Grupos verificados e ativos.",
    keywords: "casadas telegram, grupos casadas telegram, telegram casadas telegram",
    filter: "category.eq.casadas",
    categoryLink: "casadas",
  },
  "/celebridades-telegram": {
    title: "Celebridades Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Celebridades Telegram - Grupos Verificados | Canais18",
    description: "Celebridades telegram: famosos em conteúdo adulto. Vazamentos verificados e organizados por nome.",
    keywords: "celebridades telegram, grupos celebridades telegram, telegram celebridades telegram",
    filter: "category.eq.celebridades",
    categoryLink: "celebridades",
  },
  "/famosos-nus-telegram": {
    title: "Famosos Nus Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Famosos Nus Telegram - Grupos Verificados | Canais18",
    description: "Famosos nus telegram: acervo de conteúdo vazado de celebridades. Links testados e atualizados.",
    keywords: "famosos nus telegram, grupos famosos nus telegram, telegram famosos nus telegram",
    filter: "category.eq.celebridades",
    categoryLink: "celebridades",
  },
  "/asiaticas-telegram": {
    title: "Asiáticas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Asiáticas Telegram - Grupos Verificados | Canais18",
    description: "Asiáticas telegram: conteúdo de criadoras asiáticas. Grupos verificados com acesso direto.",
    keywords: "asiáticas telegram, grupos asiáticas telegram, telegram asiáticas telegram",
    filter: "category.eq.asiaticas",
    categoryLink: "asiaticas",
  },
  "/bdsm-telegram": {
    title: "BDSM Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "BDSM Telegram - Grupos Verificados | Canais18",
    description: "BDSM telegram: comunidades especializadas para amantes do gênero. Links verificados e seguros.",
    keywords: "bdsm telegram, grupos bdsm telegram, telegram bdsm telegram",
    filter: "category.eq.bdsm",
    categoryLink: "bdsm",
  },
  "/bbw-telegram": {
    title: "BBW Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "BBW Telegram - Grupos Verificados | Canais18",
    description: "BBW telegram: conteúdo de criadoras plus size. Grupos verificados e com previews.",
    keywords: "bbw telegram, grupos bbw telegram, telegram bbw telegram",
    filter: "category.eq.bbw",
    categoryLink: "bbw",
  },
  "/coroas-telegram": {
    title: "Coroas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Coroas Telegram - Grupos Verificados | Canais18",
    description: "Coroas telegram: conteúdo de mulheres maduras. Grupos verificados e com membros ativos.",
    keywords: "coroas telegram, grupos coroas telegram, telegram coroas telegram",
    filter: "category.eq.coroas",
    categoryLink: "coroas",
    seoKeyword: "grupos de coroas no Telegram",
    seoCategory: "Coroas",
  },

  // ─── NOVAS LANDING PAGES (baseado no keyword gap dos concorrentes) ───

  "/telegram-vazados": {
    title: "Telegram Vazados - Conteúdo Exclusivo Verificado",
    seoTitle: "Telegram Vazados - Links Verificados | Canais18",
    description: "Telegram vazados: conteúdo exclusivo de criadoras brasileiras e internacionais. Links verificados diariamente.",
    keywords: "telegram vazados, vazados telegram, grupos vazados telegram",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
    seoKeyword: "vazados no Telegram",
    seoCategory: "Vazados",
  },
  "/vazados-telegram": {
    title: "Vazados Telegram - Canais e Grupos Ativos",
    seoTitle: "Vazados Telegram - Grupos Verificados | Canais18",
    description: "Vazados telegram: acervo de conteúdo vazado de criadoras. Links testados e funcionando. Acesse grátis.",
    keywords: "vazados telegram, grupos vazados telegram, telegram vazados telegram",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
    seoKeyword: "vazados telegram",
    seoCategory: "Vazados",
  },
  "/corno-telegram": {
    title: "Corno Telegram - Grupos e Canais +18",
    seoTitle: "Corno Telegram - Grupos Verificados | Canais18",
    description: "Corno telegram: grupos dedicados a esse fetiche. Comunidade ativa e verificada em canais18.com.",
    keywords: "corno telegram, grupos corno telegram, telegram corno telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
    seoKeyword: "grupos de corno no Telegram",
    seoCategory: "Telegram",
  },
  "/telegram-corno": {
    title: "Telegram Corno - Canais e Grupos +18",
    seoTitle: "Telegram Corno - Grupos Verificados | Canais18",
    description: "Telegram corno: conteúdo exclusivo sobre esse tema. Grupos verificados e com links ativos.",
    keywords: "telegram corno, canais telegram corno, grupos telegram corno",
    filter: "category.eq.geral",
    categoryLink: "geral",
    seoKeyword: "corno no Telegram",
    seoCategory: "Telegram",
  },
  "/amador-telegram": {
    title: "Amador Telegram - Conteúdo Real Verificado",
    seoTitle: "Amador Telegram - Grupos Verificados | Canais18",
    description: "Amador telegram: conteúdo real de amadoras brasileiras. Previews, links diretos e verificação diária.",
    keywords: "amador telegram, grupos amador telegram, telegram amador telegram",
    filter: "category.eq.amadoras",
    categoryLink: "amadoras",
    seoKeyword: "amador no Telegram",
    seoCategory: "Amadoras",
  },
  "/telegram-canais": {
    title: "Telegram Canais - Diretório Completo +18",
    seoTitle: "Telegram Canais - Grupos Verificados | Canais18",
    description: "Telegram canais: diretório completo de canais adultos. Navegue por categoria e entre direto nos grupos.",
    keywords: "telegram canais, canais telegram, grupos canais telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
    seoKeyword: "canais do Telegram",
    seoCategory: "Telegram",
  },
  "/telegram-links": {
    title: "Telegram Links - Acesso Direto a Grupos +18",
    seoTitle: "Telegram Links - Grupos Verificados | Canais18",
    description: "Telegram links: acesso direto a grupos adultos. Sem cadastro, sem pagamento. Links verificados.",
    keywords: "telegram links, links telegram, grupos telegram links",
    filter: "category.eq.geral",
    categoryLink: "geral",
    seoKeyword: "links do Telegram",
    seoCategory: "Telegram",
  },
  "/telegram-grupo": {
    title: "Telegram Grupo - Encontre Grupos Ativos +18",
    seoTitle: "Telegram Grupo - Grupos Verificados | Canais18",
    description: "Telegram grupo: encontre grupos ativos com conteúdo adulto. Links testados e membros reais.",
    keywords: "telegram grupo, grupos telegram, grupo telegram adulto",
    filter: "category.eq.geral",
    categoryLink: "geral",
    seoKeyword: "grupos do Telegram",
    seoCategory: "Telegram",
  },
  "/grupos-do-telegram": {
    title: "Grupos do Telegram - Diretório Adulto +18",
    seoTitle: "Grupos do Telegram - Grupos Verificados | Canais18",
    description: "Grupos do telegram: maior diretório de grupos adultos do Brasil. Organizado por categoria e verificado.",
    keywords: "grupos do telegram, grupos telegram, telegram grupos",
    filter: "category.eq.geral",
    categoryLink: "geral",
    seoKeyword: "grupos do Telegram",
    seoCategory: "Telegram",
  },
  "/telegram-puxadas": {
    title: "Telegram Puxadas - Conteúdo Exclusivo +18",
    seoTitle: "Telegram Puxadas - Grupos Verificados | Canais18",
    description: "Telegram puxadas: conteúdo exclusivo puxado de plataformas pagas. Links verificados diariamente.",
    keywords: "telegram puxadas, puxadas telegram, grupos puxadas telegram",
    filter: "category.eq.privacy,category.eq.vazados",
    categoryLink: "privacy",
    seoKeyword: "puxadas no Telegram",
    seoCategory: "Privacy",
  },
  "/curso-telegram": {
    title: "Curso Telegram - Conteúdo Exclusivo +18",
    seoTitle: "Curso Telegram - Grupos Verificados | Canais18",
    description: "Curso telegram: conteúdo de cursos exclusivos disponibilizado gratuitamente. Links verificados.",
    keywords: "curso telegram, cursos telegram, telegram cursos",
    filter: "category.eq.geral",
    categoryLink: "geral",
    seoKeyword: "cursos no Telegram",
    seoCategory: "Telegram",
  },
  "/erome-telegram": {
    title: "Erome Telegram - Conteúdo do Erome no Telegram",
    seoTitle: "Erome Telegram - Grupos Verificados | Canais18",
    description: "Erome telegram: conteúdo do Erome disponível no Telegram. Links diretos e verificados diariamente.",
    keywords: "erome telegram, grupos erome telegram, telegram erome telegram",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
    seoKeyword: "Erome no Telegram",
    seoCategory: "Privacy",
  },
  "/telegram-fap": {
    title: "Telegram Fap - Grupos e Canais +18",
    seoTitle: "Telegram Fap - Grupos Verificados | Canais18",
    description: "Telegram fap: comunidade de conteúdo adulto organizado por categorias. Links verificados.",
    keywords: "telegram fap, fap telegram, grupos fap telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
    seoKeyword: "fap no Telegram",
    seoCategory: "Telegram",
  },
  "/flagras-telegram": {
    title: "Flagras Telegram - Conteúdo Real Verificado",
    seoTitle: "Flagras Telegram - Grupos Verificados | Canais18",
    description: "Flagras telegram: flagras reais de brasileiros no Telegram. Conteúdo autêntico e verificado.",
    keywords: "flagras telegram, grupos flagras telegram, telegram flagras telegram",
    filter: "category.eq.amadoras",
    categoryLink: "amadoras",
    seoKeyword: "flagras no Telegram",
    seoCategory: "Amadoras",
  },
  "/grupos-telegram-br": {
    title: "Grupos Telegram BR - Diretório Brasileiro +18",
    seoTitle: "Grupos Telegram BR - Grupos Verificados | Canais18",
    description: "Grupos telegram BR: diretório brasileiro de grupos adultos. Conteúdo nacional verificado diariamente.",
    keywords: "grupos telegram br, telegram grupos brasil, grupos brasileiros telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
    seoKeyword: "grupos telegram brasileiros",
    seoCategory: "Telegram",
  },
};

const CategoryLanding = () => {
  const location = useLocation();
  const config = pageConfigs[location.pathname] || pageConfigs["/telegram-porno"];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);

      // Busca featured=true primeiro
      const { data: featuredData } = await supabase
        .from("groups")
        .select("*")
        .or(config.filter)
        .eq("featured", true)
        .or("hidden.is.null,hidden.eq.false")
        .neq("thumbnail_url", null as any)
        .not("thumbnail_url", "eq", "")
        .order("member_count", { ascending: false })
        .limit(12);

      const featured = featuredData || [];
      let result: Grupo[] = featured as Grupo[];

      // Completa até 12 com não-featured
      if (featured.length < 12) {
        const featuredIds = featured.map((g: any) => g.id);
        let fillQuery = supabase
          .from("groups")
          .select("*")
          .or(config.filter)
          .or("featured.is.null,featured.eq.false")
          .or("hidden.is.null,hidden.eq.false")
          .neq("thumbnail_url", null as any)
          .not("thumbnail_url", "eq", "")
          .order("member_count", { ascending: false })
          .limit(12 - featured.length);
        if (featuredIds.length > 0) {
          fillQuery = fillQuery.not("id", "in", `(${featuredIds.join(",")})`);
        }
        const { data: fillData } = await fillQuery;
        result = [...featured, ...(fillData || [])] as Grupo[];
      }

      setGrupos(result);
      setLoading(false);
    };

    fetchGroups();
  }, [location.pathname]);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SEO
        title={config.seoTitle}
        description={config.description}
        keywords={config.keywords}
        canonicalUrl={`https://www.canais18.com${location.pathname}`}
      />

      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <section className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{config.title}</h1>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver Todos os Grupos →
          </Link>
        </section>

        <BannerAd position="top" />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">🔥 Canais em Destaque</h2>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-card" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {grupos.map((grupo) => (
                  <GroupCard key={grupo.id} grupo={grupo} />
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Link
                  to={`/?category=${config.categoryLink}`}
                  className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver Todos os Canais
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">📂 Categorias Relacionadas</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <Link
              to="/telegram-porno"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Telegram Porno</span>
            </Link>
            <Link
              to="/putaria-telegram"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Putaria Telegram</span>
            </Link>
            <Link
              to="/telegram-xxx"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Telegram XXX</span>
            </Link>
            <Link
              to="/grupos-putaria-telegram"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Grupos Putaria</span>
            </Link>
          </div>
        </section>
        <LandingSEOContent
          keyword={config.seoKeyword || `${config.categoryLink} no Telegram`}
          category={config.seoCategory || config.categoryLink || "Telegram"}
          h1={config.title}
          groupCount={grupos.length}
          totalMembers={grupos.reduce((sum, g) => sum + (g.member_count || 0), 0)}
        />
      </main>
    </div>
  );
};

export default CategoryLanding;
