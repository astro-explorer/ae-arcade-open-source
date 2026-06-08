import React, { useEffect, useState } from "react";

const DISPLAY_MS = 5000; // how long each promo shows
const FADE_MS = 0;     // fade duration (needs to match CSS, set to 0 for no fade)

const promos = [
  { href: "#", src: "/bork-ad.jpg", alt: "Astro Explorer has ad space available" },
];

export function AdSecondary() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (promos.length <= 1) return;

    let cancelled = false;

    const loop = () => {
      const showTimer = setTimeout(() => {
        setFading(true);
        const fadeTimer = setTimeout(() => {
          if (cancelled) return;
          setCurrentIndex((i) => (i + 1) % promos.length);
          setFading(false);
          loop();
        }, FADE_MS);

        return () => clearTimeout(fadeTimer);
      }, DISPLAY_MS);

      return () => clearTimeout(showTimer);
    };

    const cleanup = loop();

    return () => {
      cancelled = true;
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  const promo = promos[currentIndex];

  return (
    <div className="promo-container slot-secondary">
        <a
        className="promo-wrap"
        href={promo.href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={promo.alt}
        >
        <img
            className={`partner-slot promo-img ${fading ? "is-fading" : ""}`}
            src={promo.src}
            alt={promo.alt}
        />
        </a>
    </div>
  );
}
