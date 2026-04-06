import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import GroupCard from "@/components/GroupCard";
import { supabase } from "@/integrations/supabase/client";
import type { Grupo } from "@/data/mock";

// Configurações por página
const pageConfigs: Record<string, any> = {
  "/telegram-porno": {
    title: "Telegram Porno - Melhores Canais +18",
    seoTitle: "Telegram Porno - Canais e Grupos +18 | Canais18",
    description: "Os melhores canais porno do Telegram reunidos aqui. Entra e curte 🔥",
    keywords: "telegram porno, canais telegram porno, grupos telegram porno",
    filter: "category.ilike.%porno%,category.ilike.%xxx%,category.ilike.%amadoras%",
    categoryLink: "Porno",
  },
  "/putaria-telegram": {
    title: "Putaria Telegram - Grupos e Canais Brasil",
    seoTitle: "Putaria Telegram - Grupos +18 Verificados | Canais18",
    description: "Os melhores grupos de putaria do Telegram tão aqui. Entra e aproveita 🔥",
    keywords: "putaria telegram, grupos putaria telegram, telegram putaria brasil",
    filter: "category.ilike.%putaria%,category.ilike.%novinhas%,category.ilike.%amadoras%",
    categoryLink: "Putaria",
  },
  "/telegram-xxx": {
    title: "Telegram XXX - Canais Adultos Verificados",
    seoTitle: "Telegram XXX - Melhores Canais +18 | Canais18",
    description: "Conteúdo XXX no Telegram sem enrolação. Acessa e curte 😈",
    keywords: "telegram xxx, canais telegram xxx, xxx telegram",
    filter: "category.ilike.%xxx%,category.ilike.%porno%",
    categoryLink: "XXX",
  },
  "/grupos-putaria-telegram": {
    title: "Grupos Putaria Telegram - Lista Atualizada",
    seoTitle: "Grupos Putaria Telegram - +100 Grupos Ativos | Canais18",
    description: "Lista atualizada dos grupos de putaria mais quentes do Telegram. Cola aqui 🔞",
    keywords: "grupos putaria telegram, lista grupos putaria, grupos telegram putaria",
    filter: "category.ilike.%putaria%,category.ilike.%grupos%",
    categoryLink: "Putaria",
  },

  "/telegram-putaria": {
    title: "Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Putaria Telegram - Grupos Verificados | Canais18",
    description: "Os melhores grupos de putaria do Telegram tão aqui. Entra e aproveita 🔥",
    keywords: "putaria telegram, grupos putaria telegram, telegram putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/canal-de-putaria": {
    title: "Canal de Putaria - Grupos e Canais +18 | Canais18",
    seoTitle: "Canal de Putaria - Grupos Verificados | Canais18",
    description: "Canais de putaria no Telegram com conteúdo fresquinho todo dia. Entra agora 🔞",
    keywords: "canal de putaria, grupos canal de putaria, telegram canal de putaria",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/grupo-putaria-telegram": {
    title: "Grupo Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupo Putaria Telegram - Grupos Verificados | Canais18",
    description: "Grupos de putaria no Telegram verificados e ativos. Cola agora 😈",
    keywords: "grupo putaria telegram, grupos grupo putaria telegram, telegram grupo putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/xxx-telegram": {
    title: "XXX Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "XXX Telegram - Grupos Verificados | Canais18",
    description: "Conteúdo XXX liberado no Telegram. Acessa e aproveita 🔥",
    keywords: "xxx telegram, grupos xxx telegram, telegram xxx telegram",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/grupos-porno-telegram": {
    title: "Grupos Porno Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Porno Telegram - Grupos Verificados | Canais18",
    description: "Os grupos porno mais populares do Telegram estão aqui. Entra 🔞",
    keywords: "grupos porno telegram, grupos grupos porno telegram, telegram grupos porno telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/canais-putaria-telegram": {
    title: "Canais Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Canais Putaria Telegram - Grupos Verificados | Canais18",
    description: "Canais de putaria no Telegram com vídeos e fotos todo dia. Acessa grátis 🔥",
    keywords: "canais putaria telegram, grupos canais putaria telegram, telegram canais putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/putaria-brasileira": {
    title: "Putaria Brasileira - Grupos e Canais +18 | Canais18",
    seoTitle: "Putaria Brasileira - Grupos Verificados | Canais18",
    description: "Putaria brasileira sem censura no Telegram. Entra e curte 🔞",
    keywords: "putaria brasileira, grupos putaria brasileira, telegram putaria brasileira",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/putaria-brasileira-telegram": {
    title: "Putaria Brasileira Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Putaria Brasileira Telegram - Grupos Verificados | Canais18",
    description: "Os melhores grupos de putaria brasileira no Telegram. Cola aqui 😈",
    keywords: "putaria brasileira telegram, grupos putaria brasileira telegram, telegram putaria brasileira telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/grupos-de-putaria-telegram": {
    title: "Grupos de Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos de Putaria Telegram - Grupos Verificados | Canais18",
    description: "Grupos de putaria no Telegram atualizados e verificados. Entra agora 🔥",
    keywords: "grupos de putaria telegram, grupos grupos de putaria telegram, telegram grupos de putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/grupo-de-putaria-telegram": {
    title: "Grupo de Putaria Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupo de Putaria Telegram - Grupos Verificados | Canais18",
    description: "Grupo de putaria no Telegram com conteúdo fresquinho. Acessa 🔞",
    keywords: "grupo de putaria telegram, grupos grupo de putaria telegram, telegram grupo de putaria telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/xvideos-putaria": {
    title: "Xvideos Putaria - Grupos e Canais +18 | Canais18",
    seoTitle: "Xvideos Putaria - Grupos Verificados | Canais18",
    description: "Vídeos de putaria direto no Telegram, estilo xvideos. Entra e curte 😈",
    keywords: "xvideos putaria, grupos xvideos putaria, telegram xvideos putaria",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/video-porno-telegram": {
    title: "Video Porno Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Video Porno Telegram - Grupos Verificados | Canais18",
    description: "Vídeos porno no Telegram disponíveis agora. Acessa grátis 🔥",
    keywords: "video porno telegram, grupos video porno telegram, telegram video porno telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/porno-gratis-telegram": {
    title: "Porno Grátis Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Porno Grátis Telegram - Grupos Verificados | Canais18",
    description: "Porno grátis no Telegram sem precisar pagar nada. Cola aqui 🔞",
    keywords: "porno grátis telegram, grupos porno grátis telegram, telegram porno grátis telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/xvideos-porno-telegram": {
    title: "Xvideos Porno Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Xvideos Porno Telegram - Grupos Verificados | Canais18",
    description: "Vídeos porno no estilo xvideos no Telegram. Entra e aproveita 😈",
    keywords: "xvideos porno telegram, grupos xvideos porno telegram, telegram xvideos porno telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/telegram-sexo": {
    title: "Telegram Sexo - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram Sexo - Grupos Verificados | Canais18",
    description: "Grupos de sexo no Telegram ativos agora. Acessa e curte 🔥",
    keywords: "telegram sexo, grupos telegram sexo, telegram telegram sexo",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/sexo-telegram": {
    title: "Sexo Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Sexo Telegram - Grupos Verificados | Canais18",
    description: "Conteúdo de sexo no Telegram sem frescura. Entra agora 🔞",
    keywords: "sexo telegram, grupos sexo telegram, telegram sexo telegram",
    filter: "category.eq.putaria",
    categoryLink: "putaria",
  },
  "/video-sexo-telegram": {
    title: "Video Sexo Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Video Sexo Telegram - Grupos Verificados | Canais18",
    description: "Vídeos de sexo no Telegram atualizados todo dia. Cola aqui 😈",
    keywords: "video sexo telegram, grupos video sexo telegram, telegram video sexo telegram",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/videos-eroticos-telegram": {
    title: "Vídeos Eróticos Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vídeos Eróticos Telegram - Grupos Verificados | Canais18",
    description: "Vídeos eróticos no Telegram com curadoria especial. Acessa grátis 🔥",
    keywords: "vídeos eróticos telegram, grupos vídeos eróticos telegram, telegram vídeos eróticos telegram",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/chat-sexo-telegram": {
    title: "Chat Sexo Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Chat Sexo Telegram - Grupos Verificados | Canais18",
    description: "Chat de sexo no Telegram com pessoal ativo. Entra e participa 🔞",
    keywords: "chat sexo telegram, grupos chat sexo telegram, telegram chat sexo telegram",
    filter: "category.eq.putaria,category.eq.geral",
    categoryLink: "putaria",
  },
  "/grupos-telegram-18": {
    title: "Grupos Telegram 18 - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram 18 - Grupos Verificados | Canais18",
    description: "Grupos +18 no Telegram verificados e liberados. Entra agora 🔥",
    keywords: "grupos telegram 18, grupos grupos telegram 18, telegram grupos telegram 18",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/canais-telegram-18": {
    title: "Canais Telegram 18 - Grupos e Canais +18 | Canais18",
    seoTitle: "Canais Telegram 18 - Grupos Verificados | Canais18",
    description: "Canais +18 no Telegram com conteúdo adulto de qualidade. Cola aqui 😈",
    keywords: "canais telegram 18, grupos canais telegram 18, telegram canais telegram 18",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/telegram-adulto": {
    title: "Telegram Adulto - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram Adulto - Grupos Verificados | Canais18",
    description: "Conteúdo adulto no Telegram sem enrolação. Acessa agora 🔞",
    keywords: "telegram adulto, grupos telegram adulto, telegram telegram adulto",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupos-telegram-geral": {
    title: "Grupos Telegram Geral - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram Geral - Grupos Verificados | Canais18",
    description: "Grupos gerais no Telegram com conteúdo adulto variado. Entra e curte 🔥",
    keywords: "grupos telegram geral, grupos grupos telegram geral, telegram grupos telegram geral",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/links-telegram": {
    title: "Links Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Links Telegram - Grupos Verificados | Canais18",
    description: "Links de grupos Telegram adultos verificados e ativos. Acessa grátis 🔞",
    keywords: "links telegram, grupos links telegram, telegram links telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/telegram-proibido": {
    title: "Telegram Proibido - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram Proibido - Grupos Verificados | Canais18",
    description: "Conteúdo proibido no Telegram que você não vai achar em outro lugar. Entra 😈",
    keywords: "telegram proibido, grupos telegram proibido, telegram telegram proibido",
    filter: "category.eq.geral,category.eq.putaria",
    categoryLink: "geral",
  },
  "/grupo-telegram-18": {
    title: "Grupo Telegram 18 - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupo Telegram 18 - Grupos Verificados | Canais18",
    description: "Grupo +18 no Telegram verificado e ativo. Cola aqui agora 🔥",
    keywords: "grupo telegram 18, grupos grupo telegram 18, telegram grupo telegram 18",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupos-telegram-pode-tudo": {
    title: "Grupos Telegram Pode Tudo - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram Pode Tudo - Grupos Verificados | Canais18",
    description: "Grupos Telegram sem censura, pode tudo. Acessa e aproveita 🔞",
    keywords: "grupos telegram pode tudo, grupos grupos telegram pode tudo, telegram grupos telegram pode tudo",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupos-telegram-secretos": {
    title: "Grupos Telegram Secretos - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram Secretos - Grupos Verificados | Canais18",
    description: "Grupos secretos do Telegram que poucas pessoas conhecem. Entra agora 😈",
    keywords: "grupos telegram secretos, grupos grupos telegram secretos, telegram grupos telegram secretos",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupos-18-telegram": {
    title: "Grupos 18 Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos 18 Telegram - Grupos Verificados | Canais18",
    description: "Grupos 18+ no Telegram reunidos num só lugar. Cola aqui 🔥",
    keywords: "grupos 18 telegram, grupos grupos 18 telegram, telegram grupos 18 telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/grupo-telegram-proibido": {
    title: "Grupo Telegram Proibido - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupo Telegram Proibido - Grupos Verificados | Canais18",
    description: "Grupo Telegram proibido com conteúdo sem censura. Acessa agora 🔞",
    keywords: "grupo telegram proibido, grupos grupo telegram proibido, telegram grupo telegram proibido",
    filter: "category.eq.geral,category.eq.putaria",
    categoryLink: "geral",
  },
  "/grupos-telegram": {
    title: "Grupos Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram - Grupos Verificados | Canais18",
    description: "Os melhores grupos do Telegram adultos reunidos aqui. Entra 😈",
    keywords: "grupos telegram, grupos grupos telegram, telegram grupos telegram",
    filter: "category.eq.geral",
    categoryLink: "geral",
  },
  "/novinhas-telegram": {
    title: "Novinhas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Novinhas Telegram - Grupos Verificados | Canais18",
    description: "Grupos de novinhas no Telegram atualizados. Cola aqui 😈",
    keywords: "novinhas telegram, grupos novinhas telegram, telegram novinhas telegram",
    filter: "category.eq.novinhas",
    categoryLink: "novinhas",
  },
  "/mulheres-nuas-telegram": {
    title: "Mulheres Nuas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Mulheres Nuas Telegram - Grupos Verificados | Canais18",
    description: "Mulheres nuas no Telegram sem edição. Acessa agora 🔥",
    keywords: "mulheres nuas telegram, grupos mulheres nuas telegram, telegram mulheres nuas telegram",
    filter: "category.eq.amadoras,category.eq.novinhas",
    categoryLink: "amadoras",
  },
  "/vazadinhos-telegram": {
    title: "Vazadinhos Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazadinhos Telegram - Grupos Verificados | Canais18",
    description: "Vazadinhos fresquinhos no Telegram todo dia. Entra e curte 🔞",
    keywords: "vazadinhos telegram, grupos vazadinhos telegram, telegram vazadinhos telegram",
    filter: "category.eq.vazados,category.eq.novinhas",
    categoryLink: "vazados",
  },
  "/vazados-telegram": {
    title: "Vazados Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazados Telegram - Grupos Verificados | Canais18",
    description: "Vazados fresquinhos no Telegram. Acessa agora 🔞",
    keywords: "vazados telegram, grupos vazados telegram, telegram vazados telegram",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/telegram-vazados": {
    title: "Telegram Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram Vazados - Grupos Verificados | Canais18",
    description: "Tudo que vazou no Telegram está aqui. Entra e confere 😈",
    keywords: "telegram vazados, grupos telegram vazados, telegram telegram vazados",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/vazou-telegram": {
    title: "Vazou Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazou Telegram - Grupos Verificados | Canais18",
    description: "Acabou de vazar no Telegram. Acessa antes que saia do ar 🔥",
    keywords: "vazou telegram, grupos vazou telegram, telegram vazou telegram",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/vazado-telegram": {
    title: "Vazado Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazado Telegram - Grupos Verificados | Canais18",
    description: "Conteúdo vazado no Telegram reunido aqui. Cola agora 🔞",
    keywords: "vazado telegram, grupos vazado telegram, telegram vazado telegram",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/grupos-telegram-vazados": {
    title: "Grupos Telegram Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "Grupos Telegram Vazados - Grupos Verificados | Canais18",
    description: "Grupos de vazados no Telegram atualizados. Entra e aproveita 😈",
    keywords: "grupos telegram vazados, grupos grupos telegram vazados, telegram grupos telegram vazados",
    filter: "category.eq.vazados",
    categoryLink: "vazados",
  },
  "/onlyfans-telegram": {
    title: "OnlyFans Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "OnlyFans Telegram - Grupos Verificados | Canais18",
    description: "Conteúdo do OnlyFans vazado no Telegram, de graça. Acessa agora 🔥",
    keywords: "onlyfans telegram, grupos onlyfans telegram, telegram onlyfans telegram",
    filter: "category.eq.onlyfans",
    categoryLink: "onlyfans",
  },
  "/onlyfans-packs": {
    title: "OnlyFans Packs - Grupos e Canais +18 | Canais18",
    seoTitle: "OnlyFans Packs - Grupos Verificados | Canais18",
    description: "Packs de OnlyFans disponíveis agora no Telegram. Cola aqui 😈",
    keywords: "onlyfans packs, grupos onlyfans packs, telegram onlyfans packs",
    filter: "category.eq.onlyfans",
    categoryLink: "onlyfans",
  },
  "/onlyfans-vazados": {
    title: "OnlyFans Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "OnlyFans Vazados - Grupos Verificados | Canais18",
    description: "OnlyFans vazados no Telegram sem precisar pagar. Entra agora 🔞",
    keywords: "onlyfans vazados, grupos onlyfans vazados, telegram onlyfans vazados",
    filter: "category.eq.onlyfans,category.eq.vazados",
    categoryLink: "onlyfans",
  },
  "/telegram-onlyfans": {
    title: "Telegram OnlyFans - Grupos e Canais +18 | Canais18",
    seoTitle: "Telegram OnlyFans - Grupos Verificados | Canais18",
    description: "OnlyFans no Telegram, conteúdo exclusivo de graça. Acessa 🔥",
    keywords: "telegram onlyfans, grupos telegram onlyfans, telegram telegram onlyfans",
    filter: "category.eq.onlyfans",
    categoryLink: "onlyfans",
  },
  "/michele-umezu-onlyfans": {
    title: "Michele Umezu OnlyFans - Grupos e Canais +18 | Canais18",
    seoTitle: "Michele Umezu OnlyFans - Grupos Verificados | Canais18",
    description: "Conteúdo da Michele Umezu no Telegram. Entra e confere 😈",
    keywords: "michele umezu onlyfans, grupos michele umezu onlyfans, telegram michele umezu onlyfans",
    filter: "category.eq.onlyfans",
    categoryLink: "onlyfans",
  },
  "/privacy-telegram": {
    title: "Privacy Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Telegram - Grupos Verificados | Canais18",
    description: "Privacy Telegram com os melhores packs. Acessa agora 🔞",
    keywords: "privacy telegram, grupos privacy telegram, telegram privacy telegram",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/privacy-gratis": {
    title: "Privacy Grátis - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Grátis - Grupos Verificados | Canais18",
    description: "Privacy grátis no Telegram sem pagar nada. Cola aqui 🔥",
    keywords: "privacy grátis, grupos privacy grátis, telegram privacy grátis",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/erome-privacy": {
    title: "Erome Privacy - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Privacy - Grupos Verificados | Canais18",
    description: "Erome e Privacy no Telegram reunidos. Entra e curte 😈",
    keywords: "erome privacy, grupos erome privacy, telegram erome privacy",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/privacy-vazados": {
    title: "Privacy Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Vazados - Grupos Verificados | Canais18",
    description: "Privacy vazados no Telegram fresquinhos. Acessa agora 🔞",
    keywords: "privacy vazados, grupos privacy vazados, telegram privacy vazados",
    filter: "category.eq.privacy,category.eq.vazados",
    categoryLink: "privacy",
  },
  "/erome-vazados": {
    title: "Erome Vazados - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Vazados - Grupos Verificados | Canais18",
    description: "Vazados do Erome no Telegram direto aqui. Entra e aproveita 🔥",
    keywords: "erome vazados, grupos erome vazados, telegram erome vazados",
    filter: "category.eq.privacy,category.eq.vazados",
    categoryLink: "privacy",
  },
  "/erome-vazado": {
    title: "Erome Vazado - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Vazado - Grupos Verificados | Canais18",
    description: "Erome vazado no Telegram disponível agora. Cola aqui 😈",
    keywords: "erome vazado, grupos erome vazado, telegram erome vazado",
    filter: "category.eq.privacy,category.eq.vazados",
    categoryLink: "privacy",
  },
  "/erome-vazou": {
    title: "Erome Vazou - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Vazou - Grupos Verificados | Canais18",
    description: "Acabou de vazar do Erome no Telegram. Acessa antes que saia 🔞",
    keywords: "erome vazou, grupos erome vazou, telegram erome vazou",
    filter: "category.eq.privacy,category.eq.vazados",
    categoryLink: "privacy",
  },
  "/erome-gostosa": {
    title: "Erome Gostosa - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Gostosa - Grupos Verificados | Canais18",
    description: "Gostosas do Erome no Telegram. Entra e confere 🔥",
    keywords: "erome gostosa, grupos erome gostosa, telegram erome gostosa",
    filter: "category.eq.amadoras,category.eq.privacy",
    categoryLink: "amadoras",
  },
  "/vazados-erome": {
    title: "Vazados Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Vazados Erome - Grupos Verificados | Canais18",
    description: "Erome vazados reunidos no Telegram. Acessa grátis agora 😈",
    keywords: "vazados erome, grupos vazados erome, telegram vazados erome",
    filter: "category.eq.vazados,category.eq.privacy",
    categoryLink: "vazados",
  },
  "/dra-sophia-privacy": {
    title: "Dra Sophia Privacy - Grupos e Canais +18 | Canais18",
    seoTitle: "Dra Sophia Privacy - Grupos Verificados | Canais18",
    description: "Conteúdo da Dra Sophia no Privacy Telegram. Entra e confere 🔥",
    keywords: "dra sophia privacy, grupos dra sophia privacy, telegram dra sophia privacy",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/erome-juliana-silva": {
    title: "Erome Juliana Silva - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Juliana Silva - Grupos Verificados | Canais18",
    description: "Erome da Juliana Silva no Telegram. Acessa agora 😈",
    keywords: "erome juliana silva, grupos erome juliana silva, telegram erome juliana silva",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/bia-albina-erome": {
    title: "Bia Albina Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Bia Albina Erome - Grupos Verificados | Canais18",
    description: "Bia Albina no Erome Telegram. Cola aqui e confere 🔞",
    keywords: "bia albina erome, grupos bia albina erome, telegram bia albina erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/cosvickye-erome": {
    title: "Cosvickye Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Cosvickye Erome - Grupos Verificados | Canais18",
    description: "Cosvickye no Erome, conteúdo no Telegram. Entra agora 🔥",
    keywords: "cosvickye erome, grupos cosvickye erome, telegram cosvickye erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/nayzinha-erome": {
    title: "Nayzinha Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Nayzinha Erome - Grupos Verificados | Canais18",
    description: "Nayzinha no Erome disponível no Telegram. Acessa agora 😈",
    keywords: "nayzinha erome, grupos nayzinha erome, telegram nayzinha erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/privacy-bad-mi": {
    title: "Privacy Bad Mi - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Bad Mi - Grupos Verificados | Canais18",
    description: "Bad Mi no Privacy Telegram. Entra e curte o conteúdo 🔞",
    keywords: "privacy bad mi, grupos privacy bad mi, telegram privacy bad mi",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/privacy-display-apk": {
    title: "Privacy Display APK - Grupos e Canais +18 | Canais18",
    seoTitle: "Privacy Display APK - Grupos Verificados | Canais18",
    description: "Privacy Display APK com grupos no Telegram. Cola aqui 🔥",
    keywords: "privacy display apk, grupos privacy display apk, telegram privacy display apk",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/erome-nicole-rodrigues": {
    title: "Erome Nicole Rodrigues - Grupos e Canais +18 | Canais18",
    seoTitle: "Erome Nicole Rodrigues - Grupos Verificados | Canais18",
    description: "Nicole Rodrigues no Erome Telegram. Acessa e confere 😈",
    keywords: "erome nicole rodrigues, grupos erome nicole rodrigues, telegram erome nicole rodrigues",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/nyvi-estephan-erome": {
    title: "Nyvi Estephan Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Nyvi Estephan Erome - Grupos Verificados | Canais18",
    description: "Nyvi Estephan no Erome, disponível no Telegram. Entra agora 🔞",
    keywords: "nyvi estephan erome, grupos nyvi estephan erome, telegram nyvi estephan erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/nayara-erome": {
    title: "Nayara Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Nayara Erome - Grupos Verificados | Canais18",
    description: "Nayara no Erome Telegram. Cola aqui e aproveita 🔥",
    keywords: "nayara erome, grupos nayara erome, telegram nayara erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/jenifer-novaki-privacy": {
    title: "Jenifer Novaki Privacy - Grupos e Canais +18 | Canais18",
    seoTitle: "Jenifer Novaki Privacy - Grupos Verificados | Canais18",
    description: "Jenifer Novaki no Privacy Telegram. Entra e confere 😈",
    keywords: "jenifer novaki privacy, grupos jenifer novaki privacy, telegram jenifer novaki privacy",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/camila-prado-privacy": {
    title: "Camila Prado Privacy - Grupos e Canais +18 | Canais18",
    seoTitle: "Camila Prado Privacy - Grupos Verificados | Canais18",
    description: "Camila Prado no Privacy Telegram. Acessa agora 🔞",
    keywords: "camila prado privacy, grupos camila prado privacy, telegram camila prado privacy",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/mae-e-filha-erome": {
    title: "Mae e Filha Erome - Grupos e Canais +18 | Canais18",
    seoTitle: "Mae e Filha Erome - Grupos Verificados | Canais18",
    description: "Mãe e filha no Erome Telegram. Entra e confere 🔥",
    keywords: "mae e filha erome, grupos mae e filha erome, telegram mae e filha erome",
    filter: "category.eq.privacy",
    categoryLink: "privacy",
  },
  "/amadoras-telegram": {
    title: "Amadoras Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Amadoras Telegram - Grupos Verificados | Canais18",
    description: "Amadoras brasileiras no Telegram com conteúdo real. Acessa agora 🔥",
    keywords: "amadoras telegram, grupos amadoras telegram, telegram amadoras telegram",
    filter: "category.eq.amadoras",
    categoryLink: "amadoras",
  },
  "/amadoras-quentes": {
    title: "Amadoras Quentes - Grupos e Canais +18 | Canais18",
    seoTitle: "Amadoras Quentes - Grupos Verificados | Canais18",
    description: "Amadoras quentes no Telegram sem filtro. Entra e curte 🔞",
    keywords: "amadoras quentes, grupos amadoras quentes, telegram amadoras quentes",
    filter: "category.eq.amadoras",
    categoryLink: "amadoras",
  },
  "/gay-telegram": {
    title: "Gay Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Gay Telegram - Grupos Verificados | Canais18",
    description: "Grupos gay no Telegram verificados e ativos. Cola aqui 😈",
    keywords: "gay telegram, grupos gay telegram, telegram gay telegram",
    filter: "category.eq.gay",
    categoryLink: "gay",
  },
  "/fetiche-telegram": {
    title: "Fetiche Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Fetiche Telegram - Grupos Verificados | Canais18",
    description: "Grupos de fetiche no Telegram sem julgamento. Entra agora 🔥",
    keywords: "fetiche telegram, grupos fetiche telegram, telegram fetiche telegram",
    filter: "category.eq.fetiche",
    categoryLink: "fetiche",
  },
  "/casadas-telegram": {
    title: "Casadas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Casadas Telegram - Grupos Verificados | Canais18",
    description: "Casadas no Telegram com conteúdo adulto real. Acessa 🔞",
    keywords: "casadas telegram, grupos casadas telegram, telegram casadas telegram",
    filter: "category.eq.casadas",
    categoryLink: "casadas",
  },
  "/celebridades-telegram": {
    title: "Celebridades Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Celebridades Telegram - Grupos Verificados | Canais18",
    description: "Famosos em cenas picantes no Telegram. Entra e confere 😈",
    keywords: "celebridades telegram, grupos celebridades telegram, telegram celebridades telegram",
    filter: "category.eq.celebridades",
    categoryLink: "celebridades",
  },
  "/famosos-nus-telegram": {
    title: "Famosos Nus Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Famosos Nus Telegram - Grupos Verificados | Canais18",
    description: "Famosos nus no Telegram, vazamentos e cenas. Cola aqui 🔥",
    keywords: "famosos nus telegram, grupos famosos nus telegram, telegram famosos nus telegram",
    filter: "category.eq.celebridades",
    categoryLink: "celebridades",
  },
  "/asiaticas-telegram": {
    title: "Asiáticas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Asiáticas Telegram - Grupos Verificados | Canais18",
    description: "Asiáticas no Telegram com conteúdo exclusivo. Acessa agora 🔞",
    keywords: "asiáticas telegram, grupos asiáticas telegram, telegram asiáticas telegram",
    filter: "category.eq.asiaticas",
    categoryLink: "asiaticas",
  },
  "/bdsm-telegram": {
    title: "BDSM Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "BDSM Telegram - Grupos Verificados | Canais18",
    description: "Grupos de BDSM no Telegram para quem curte. Entra 😈",
    keywords: "bdsm telegram, grupos bdsm telegram, telegram bdsm telegram",
    filter: "category.eq.bdsm",
    categoryLink: "bdsm",
  },
  "/bbw-telegram": {
    title: "BBW Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "BBW Telegram - Grupos Verificados | Canais18",
    description: "BBW no Telegram com muito conteúdo. Cola aqui agora 🔥",
    keywords: "bbw telegram, grupos bbw telegram, telegram bbw telegram",
    filter: "category.eq.bbw",
    categoryLink: "bbw",
  },
  "/coroas-telegram": {
    title: "Coroas Telegram - Grupos e Canais +18 | Canais18",
    seoTitle: "Coroas Telegram - Grupos Verificados | Canais18",
    description: "Coroas gostosas no Telegram verificadas. Acessa agora 🔞",
    keywords: "coroas telegram, grupos coroas telegram, telegram coroas telegram",
    filter: "category.eq.coroas",
    categoryLink: "coroas",
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
    <div className="min-h-screen bg-background">
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

          <div className="prose prose-invert max-w-none">
            <p className="text-base text-muted-foreground leading-relaxed">
              O Telegram se tornou uma das maiores plataformas para conteúdo adulto no Brasil. Com milhões de usuários
              ativos, a rede oferece privacidade, segurança e uma variedade impressionante de canais dedicados a
              entretenimento adulto.
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              Nossa seleção inclui os melhores canais, cuidadosamente verificados pela nossa equipe. Conteúdo amador
              brasileiro, produções profissionais em HD, lives exclusivas e muito mais.
            </p>
          </div>
        </section>

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
      </main>
    </div>
  );
};

export default CategoryLanding;
