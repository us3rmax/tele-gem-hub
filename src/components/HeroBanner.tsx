
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(207,68%,65%)] py-3.5 px-6 text-center text-base font-extrabold uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] sm:text-lg">
              ENTRAR AGORA <span className="text-xl sm:text-2xl">🔥</span>
            </a> :
          <div
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(207,68%,65%)] py-3.5 px-6 text-center text-base font-extrabold uppercase tracking-wide text-white shadow-lg sm:text-lg">
              ENTRAR AGORA <span className="text-xl sm:text-2xl">🔥</span>
            </div>
          }
        </div>
      </div>

    </div>);

};

export default HeroBanner;