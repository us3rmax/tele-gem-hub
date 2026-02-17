import { Send } from "lucide-react";
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
    <div className="relative w-full overflow-hidden rounded-2xl">
      {/* Video background */}
      <video
        src={video_url}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,50%,10%)/0.85] via-[hsl(220,50%,10%)/0.7] to-[hsl(220,50%,10%)/0.5]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[220px] flex-col justify-between p-5 sm:p-7">
        {/* Top row: title + Telegram icon */}
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-extrabold italic text-white sm:text-2xl">{title}</h3>
          <Send className="h-8 w-8 shrink-0 text-[hsl(200,100%,60%)] rotate-[-30deg]" />
        </div>


        {/* CTA Button */}
        {link_url ? (
          <a
            href={link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block w-full rounded-xl bg-gradient-to-r from-[hsl(200,100%,50%)] to-[hsl(190,100%,45%)] py-3.5 text-center text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] sm:text-lg"
          >
            Começar grátis
          </a>
        ) : (
          <div
            className="block w-full rounded-xl bg-gradient-to-r from-[hsl(200,100%,50%)] to-[hsl(190,100%,45%)] py-3.5 text-center text-base font-bold text-white shadow-lg sm:text-lg"
          >
            Começar grátis
          </div>
        )}
      </div>

    </div>
  );
};

export default HeroBanner;
