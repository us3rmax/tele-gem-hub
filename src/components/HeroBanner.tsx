import { supabase } from "@/integrations/supabase/client";
import btnEntrarAgora from "@/assets/btn-entrar-agora.png";

interface HeroBannerProps {
  id: string;
  title: string;
  video_url: string;
  link_url: string | null;
}

const HeroBanner = ({ id, title, video_url, link_url }: HeroBannerProps) => {
  const handleClick = () => {
    supabase.rpc("increment_banner_clicks" as never, { banner_id: id } as never).then(() => {}, () => {});
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl aspect-video">
      {/* Video background */}
      <video
        src={video_url}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      />


      {/* CTA Button — pinned to bottom, large */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center px-6 pb-4 sm:px-10 sm:pb-5 lg:px-16 lg:pb-6">
        {link_url ? (
          <a
            href={link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block w-full max-w-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <img
              src={btnEntrarAgora}
              alt="Entrar Agora"
              className="w-full object-contain animate-btn-pulse drop-shadow-2xl"
            />
          </a>
        ) : (
          <div className="w-full max-w-2xl">
            <img
              alt="Entrar Agora"
              src="/lovable-uploads/747af2eb-7bf8-4a93-81d4-7e643bbaad03.png"
              className="w-full object-contain animate-btn-pulse drop-shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroBanner;
