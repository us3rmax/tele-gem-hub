
import { supabase } from "@/integrations/supabase/client";

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
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-5 sm:p-7">
        {/* Spacer */}
        <div />

        {/* CTA Button */}
        <div className="mt-4">
          {link_url ?
          <a
            href={link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            style={{ background: "#69AEE8", border: "3px solid #3A7FC1", textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}
            className="flex w-full items-center justify-center gap-3 rounded-full py-4 px-6 text-center text-2xl font-black uppercase tracking-wider text-white shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98] sm:text-3xl sm:py-5">
              ENTRAR AGORA <span className="text-3xl sm:text-4xl leading-none">🔥</span>
            </a> :
          <div
            style={{ background: "#69AEE8", border: "3px solid #3A7FC1", textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}
            className="flex w-full items-center justify-center gap-3 rounded-full py-4 px-6 text-center text-2xl font-black uppercase tracking-wider text-white shadow-xl sm:text-3xl sm:py-5">
              ENTRAR AGORA <span className="text-3xl sm:text-4xl leading-none">🔥</span>
            </div>
          }
        </div>
      </div>

    </div>);

};

export default HeroBanner;