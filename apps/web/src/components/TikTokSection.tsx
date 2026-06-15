'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, ExternalLink } from './MaterialIcons';

// ─── TIKTOK VIDEOS WITH CLOUDINARY DIRECT LINKS & JPG DYNAMIC THUMBNAILS ──────
const TIKTOK_VIDEOS = [
  {
    id: '7650150671257308424',
    caption: 'එන්නකෝ ඔයාලට වැදගත් කතාවක් අහන්න🙈♥️',
    thumbnail: 'https://res.cloudinary.com/don5ltush/video/upload/v1781452933/snaptik_7650150671257308424_v3_k4scnl.jpg',
    videoUrl: 'https://res.cloudinary.com/don5ltush/video/upload/v1781452933/snaptik_7650150671257308424_v3_k4scnl.mp4',
  },
  {
    id: '7594374321456303380',
    caption: 'මිහිරාවේ💜✨',
    thumbnail: 'https://res.cloudinary.com/don5ltush/video/upload/v1781453407/snaptik_7594374321456303380_v3_dwsbxu.jpg',
    videoUrl: 'https://res.cloudinary.com/don5ltush/video/upload/v1781453407/snaptik_7594374321456303380_v3_dwsbxu.mp4',
  },
  {
    id: '7650804852775243026',
    caption: 'එයා🌈✨',
    thumbnail: 'https://res.cloudinary.com/don5ltush/video/upload/v1781453576/snaptik_7650804852775243026_v3_vxihl0.jpg',
    videoUrl: 'https://res.cloudinary.com/don5ltush/video/upload/v1781453576/snaptik_7650804852775243026_v3_vxihl0.mp4',
  },
  {
    id: '7651187847252430098',
    caption: 'සමනලී💙🩷',
    thumbnail: 'https://res.cloudinary.com/don5ltush/video/upload/v1781453576/snaptik_7651187847252430098_v3_koja5w.jpg',
    videoUrl: 'https://res.cloudinary.com/don5ltush/video/upload/v1781453576/snaptik_7651187847252430098_v3_koja5w.mp4',
  },
  {
    id: '7649056266685386002',
    caption: 'අපි දැන් අපගේ නේ♥️',
    thumbnail: 'https://res.cloudinary.com/don5ltush/video/upload/v1781454152/snaptik_7649056266685386002_v3_h5xcut.jpg',
    videoUrl: 'https://res.cloudinary.com/don5ltush/video/upload/v1781454152/snaptik_7649056266685386002_v3_h5xcut.mp4',
  },
  {
    id: '7648664623285062930',
    caption: 'මල් මල්🙈♥️',
    thumbnail: 'https://res.cloudinary.com/don5ltush/video/upload/v1781454261/snaptik_7648664623285062930_v3_a47aay.jpg',
    videoUrl: 'https://res.cloudinary.com/don5ltush/video/upload/v1781454261/snaptik_7648664623285062930_v3_a47aay.mp4',
  },
];

interface TikTokCardProps {
  video: typeof TIKTOK_VIDEOS[0];
  index: number;
  playingKey: string;
  isPlaying: boolean;
  onPlay: () => void;
}

function TikTokCard({ video, index, playingKey, isPlaying, onPlay }: TikTokCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHoveredMutable = false;
    let frameId: number;

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    };

    const onMouseEnter = () => {
      isHoveredMutable = true;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
      }
    };

    const onMouseLeave = () => {
      isHoveredMutable = false;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '0';
      }
    };

    const updateCursor = () => {
      // Fluid inertial smooth follow math (lerp)
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      if (cursorRef.current) {
        const scale = isHoveredMutable ? 1 : 0;
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(${scale})`;
      }
      frameId = requestAnimationFrame(updateCursor);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseenter', onMouseEnter);
      container.addEventListener('mouseleave', onMouseLeave);
      frameId = requestAnimationFrame(updateCursor);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseenter', onMouseEnter);
        container.removeEventListener('mouseleave', onMouseLeave);
      }
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={onPlay}
      className={`relative aspect-[9/16] rounded-2xl overflow-hidden bg-muted border border-border shadow-lg group select-none transition-all duration-300 ${
        isPlaying ? '' : 'hover:cursor-none hover:shadow-2xl hover:border-primary/30'
      }`}
    >
      {isPlaying ? (
        video.videoUrl ? (
          <video
            src={video.videoUrl}
            controls
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${video.id}?autoplay=1&loop=1`}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            title={`TikTok video ${index + 1}`}
          />
        )
      ) : (
        <>
          {/* Thumbnail */}
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${video.thumbnail})` }}
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          </div>

          {/* Inertial Follow-Cursor Play Banner/Bubble */}
          <div
            ref={cursorRef}
            className="absolute w-20 h-20 rounded-full bg-primary/95 text-primary-foreground flex flex-col items-center justify-center shadow-2xl pointer-events-none transition-all duration-300 ease-out z-30 ring-4 ring-primary/20 backdrop-blur-[2px]"
            style={{
              left: 0,
              top: 0,
              opacity: 0,
              transform: 'translate3d(0, 0, 0) translate(-50%, -50%) scale(0)',
            }}
          >
            <Play size={20} className="fill-current ml-0.5 animate-pulse" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase mt-0.5">Play</span>
          </div>

          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-20">
            <p className="text-white text-sm font-semibold">{video.caption}</p>
          </div>

          {/* TikTok logo badge */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 z-20">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.74a8.19 8.19 0 0 0 4.78 1.52V6.82a4.85 4.85 0 0 1-1.01-.13z"/>
            </svg>
            <span className="text-white text-[10px] font-bold">TikTok</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function TikTokSection() {
  const [activePlayingKey, setActivePlayingKey] = useState<string | null>(null);

  // Duplicate the list of videos for seamless loop marquee effect
  const duplicatedVideos = [...TIKTOK_VIDEOS, ...TIKTOK_VIDEOS];

  return (
    <section id="tiktok-section" className="py-24 bg-muted/10 relative overflow-hidden">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 45s linear infinite;
        }
        .animate-marquee-paused {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* Blueprint grid pattern backdrop for premium aesthetics */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.12] pointer-events-none" />

      <div className="container mx-auto px-4 mb-12 text-center relative z-10">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-semibold uppercase tracking-widest mb-4">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-primary">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.74a8.19 8.19 0 0 0 4.78 1.52V6.82a4.85 4.85 0 0 1-1.01-.13z"/>
          </svg>
          As Seen on TikTok
        </span>
        <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-serif)' }}>
          Watch Us in Action
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
          Follow our journey — from handcrafting each pair to happy customers showing them off.
        </p>
      </div>

      {/* Infinite Horizontal Carousel Scroller */}
      <div className="relative w-full py-4 overflow-hidden select-none z-10">
        {/* Soft edge fade overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background/90 via-background/40 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background/90 via-background/40 to-transparent z-20 pointer-events-none" />

        <div
          className={`animate-marquee ${
            activePlayingKey !== null ? 'animate-marquee-paused' : 'hover:animate-marquee-paused'
          }`}
        >
          {duplicatedVideos.map((video, idx) => {
            const playingKey = `${video.id}-${idx}`;
            return (
              <div key={playingKey} className="px-4 w-[270px] shrink-0">
                <TikTokCard
                  video={video}
                  index={idx}
                  playingKey={playingKey}
                  isPlaying={activePlayingKey === playingKey}
                  onPlay={() => setActivePlayingKey(playingKey)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-10 relative z-10">
        <a
          href="https://www.tiktok.com/@hushcrafts?is_from_webapp=1&sender_device=pc"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-black/80 transition-colors shadow-md hover:shadow-lg"
        >
          Follow Us @hushcrafts
          <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}
