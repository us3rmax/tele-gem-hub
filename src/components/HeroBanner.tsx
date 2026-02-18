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
        className="absolute inset-0 h-full w-full object-cover pointer-events-none" />


      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,50%,10%)/0.85] via-[hsl(220,50%,10%)/0.7] to-[hsl(220,50%,10%)/0.5]" />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 pb-3 sm:p-7 sm:pb-4">
        {/* CTA Button */}
        <div className="mt-4">
          {link_url ?
          <a
            href={link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block w-4/5 mx-auto transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <img src={btnEntrarAgora} alt="Entrar Agora" className="w-full object-contain max-h-12 sm:max-h-16" />
            </a> :
          <div className="w-4/5 mx-auto">
            <img alt="Entrar Agora" className="w-full max-h-12 sm:max-h-16 object-cover" src="/lovable-uploads/747af2eb-7bf8-4a93-81d4-7e643bbaad03.png" />
          </div>
          }
        </div>
      </div>

    </div>);

};

export default HeroBanner;