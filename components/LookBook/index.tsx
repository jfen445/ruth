"use client";

import React from "react";

type Rect = { left: number; top: number; width: number; height: number };

export const LookBook = () => {
  const gridItems = Array.from({ length: 24 }, (_, i) => i + 1);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [overlayStyle, setOverlayStyle] = React.useState<
    (React.CSSProperties & { transition?: string }) | null
  >(null);
  const [isClosing, setIsClosing] = React.useState(false);
  const fromRectRef = React.useRef<Rect | null>(null);
  const overlayRef = React.useRef<HTMLImageElement | null>(null);

  const handleGridClick = () => {
    // close by animating back to source
    if (!fromRectRef.current || !overlayStyle) return;
    setIsClosing(true);
    setOverlayStyle((prev) =>
      prev
        ? {
            ...prev,
            left: fromRectRef.current!.left,
            top: fromRectRef.current!.top,
            width: fromRectRef.current!.width,
            height: fromRectRef.current!.height,
          }
        : prev,
    );
  };

  const handleCellClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const cell = e.currentTarget as HTMLElement;
    const img = cell.querySelector("img") as HTMLImageElement | null;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const fromRect = {
      left: rect.left + scrollX,
      top: rect.top + scrollY,
      width: rect.width,
      height: rect.height,
    };
    fromRectRef.current = fromRect;

    // target is centered and 2x scale
    const targetW = rect.width * 2;
    const targetH = rect.height * 2;
    const targetLeft = scrollX + (window.innerWidth - targetW) / 2;
    const targetTop = scrollY + (window.innerHeight - targetH) / 2;

    // set initial overlay at the source position without transition
    setOverlayStyle({
      left: fromRect.left,
      top: fromRect.top,
      width: fromRect.width,
      height: fromRect.height,
      position: "absolute",
      transition: "none",
      zIndex: 9999,
    });
    setIsClosing(false);
    setActiveIndex(idx);

    // next frame, animate to center
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOverlayStyle({
          left: targetLeft,
          top: targetTop,
          width: targetW,
          height: targetH,
          position: "absolute",
          transition: "all 300ms ease",
          zIndex: 9999,
        });
      });
    });
  };

  const handleOverlayTransitionEnd = () => {
    // if overlay is animating back to source (activeIndex still set), check if we should clear
    if (!fromRectRef.current || !overlayStyle) return;
    const isAtSource =
      Math.round(Number(overlayStyle.left)) ===
        Math.round(fromRectRef.current.left) &&
      Math.round(Number(overlayStyle.top)) ===
        Math.round(fromRectRef.current.top);
    if (isAtSource) {
      // finished closing
      setActiveIndex(null);
      setOverlayStyle(null);
      fromRectRef.current = null;
      setIsClosing(false);
    }
  };

  return (
    <div className="relative" onClick={handleGridClick}>
      <div className="grid grid-cols-4 grid-rows-6 h-[90vh] w-[60vh] border border-black">
        {Array.from({ length: 24 }).map((_, i) => {
          const idx = i + 1;
          const isHovered = hoveredIndex === idx;
          const isActive = activeIndex === idx;
          return (
            <div
              key={i}
              className="relative border border-black overflow-visible flex items-center justify-center group w-full h-full"
              onClick={(e) => handleCellClick(e, idx)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {!(isActive && !isClosing) && (
                <img
                  src="/bulbasaur.png"
                  alt={`Look ${idx}`}
                  className="transform transition-transform duration-400 ease-out group-hover:scale-150 group-hover:z-10"
                  style={{
                    width: "80%",
                    height: "80%",
                    objectFit: "cover",
                    filter: isActive || isHovered ? "none" : "grayscale(100%)",
                    transition: "transform 400ms ease, filter 300ms ease",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {overlayStyle && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{ pointerEvents: "auto" }}
            onClick={() => {
              // animate back
              if (!fromRectRef.current) return;
              setOverlayStyle((prev) =>
                prev
                  ? {
                      ...prev,
                      left: fromRectRef.current!.left,
                      top: fromRectRef.current!.top,
                      width: fromRectRef.current!.width,
                      height: fromRectRef.current!.height,
                    }
                  : prev,
              );
            }}
          />
          <img
            ref={(el) => (overlayRef.current = el)}
            src="/bulbasaur.png"
            alt="enlarged"
            style={overlayStyle}
            onTransitionEnd={handleOverlayTransitionEnd}
          />
        </div>
      )}
    </div>
  );
};

export default LookBook;
