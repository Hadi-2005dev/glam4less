"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  src: string;
  alt: string;
  caption?: string;
};

const SLIDES: Slide[] = [
  { src: "/hero-1.jpg", alt: "Best deals from best brands, up to 40% discount" },
  { src: "/hero-2.jpg", alt: "Luxury beauty collection, shop the limited edition" },
  {
    src: "/hero-3.jpg",
    alt: "Everyday makeup essentials",
    caption: "Everyday Essentials",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => setIndex((i + SLIDES.length) % SLIDES.length);

  return (
    <div className="mx-4 md:mx-6 lg:mx-10 mb-5 md:mb-7 rounded-2xl md:rounded-3xl overflow-hidden relative aspect-[16/9] md:aspect-[21/9] bg-secondary group">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <img src={slide.src} alt={slide.alt} className="w-full h-full object-cover" />
          {slide.caption && (
            <div className="absolute inset-0 flex items-end">
              <p
                className="text-white text-lg md:text-2xl font-bold px-5 py-4 md:px-8 md:py-6 drop-shadow-md"
                style={{ fontFamily: "var(--font-display-family)" }}
              >
                {slide.caption}
              </p>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => goTo(index - 1)}
        aria-label="Previous slide"
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={18} className="text-foreground" />
      </button>
      <button
        onClick={() => goTo(index + 1)}
        aria-label="Next slide"
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={18} className="text-foreground" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
