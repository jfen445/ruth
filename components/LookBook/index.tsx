"use client";

import React from "react";
import { LookBookImages } from "./images";

type Rect = { left: number; top: number; width: number; height: number };

const LookBook = () => {
  const gridItems = Array.from({ length: 24 }, (_, i) => i + 1);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [overlayStyle, setOverlayStyle] = React.useState<
    (React.CSSProperties & { transition?: string }) | null
  >(null);
  const [isClosing, setIsClosing] = React.useState(false);
  const fromRectRef = React.useRef<Rect | null>(null);
  const overlayRef = React.useRef<HTMLImageElement | null>(null);

  // helper used when we change the centred image via carets so the closing
  // animation targets the correct grid cell instead of the originally
  // clicked one.
  const updateFromRect = (idx: number) => {
    const cellImg = document.querySelector(
      `[data-idx="${idx}"] img`,
    ) as HTMLImageElement | null;
    if (!cellImg) return;
    const rect = cellImg.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    fromRectRef.current = {
      left: rect.left + scrollX,
      top: rect.top + scrollY,
      width: rect.width,
      height: rect.height,
    };
  };

  // handlers for the carets – replace contents with whatever behaviour you want
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("left caret clicked");
    if (activeIndex && activeIndex > 1) {
      const newIndex = activeIndex - 1;
      setActiveIndex(newIndex);
      // update the source rect so that when we close the overlay the
      // animation goes to the correct cell (the one we just switched to)
      updateFromRect(newIndex);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("right caret clicked");
    if (activeIndex && activeIndex < gridItems.length) {
      const newIndex = activeIndex + 1;
      setActiveIndex(newIndex);
      updateFromRect(newIndex);
    }
  };

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

  // calculate caret positions from the overlay rectangle
  let leftCaretStyle: React.CSSProperties = {};
  let rightCaretStyle: React.CSSProperties = {};
  if (overlayStyle) {
    const l = Number(overlayStyle.left);
    const t = Number(overlayStyle.top);
    const h = Number(overlayStyle.height);
    const w = Number(overlayStyle.width);
    // width/height of the caret element; keep in sync with the
    // width/height of the caret element; keep in sync with the
    // Tailwind class used on the icon (w-20 → 80px currently).
    const caretSize = 80;
    const gap = 10; // space between image and caret
    leftCaretStyle = {
      position: "absolute",
      // place the *right edge* of the left caret gap pixels left of the
      // image's left edge
      left: l - caretSize - gap,
      top: t + h / 2 - caretSize / 2,
      pointerEvents: "auto",
    };
    rightCaretStyle = {
      position: "absolute",
      // place the *left edge* of the right caret gap pixels right of the
      // image's right edge (spacing is independent of caret width)
      left: l + w + gap,
      top: t + h / 2 - caretSize / 2,
      pointerEvents: "auto",
    };
  }

  return (
    <div className="relative" onClick={handleGridClick}>
      <div className="w-full flex justify-center px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-4 grid-rows-6 w-full max-w-[55vh] aspect-[2/3] border border-black">
          {LookBookImages.map((img, i) => {
            const idx = i + 1;
            const isHovered = hoveredIndex === idx;
            const isActive = activeIndex === idx;
            return (
              <div
                key={i}
                data-idx={idx}
                className="relative border border-black overflow-visible flex items-center justify-center group w-full h-full"
                onClick={(e) => handleCellClick(e, idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {!(isActive && !isClosing) && (
                  <>
                    <img
                      src={img}
                      alt={`Look ${idx}`}
                      className={`transform transition-transform duration-400 ease-out group-hover:scale-200 group-hover:z-10 ${isActive || isHovered ? "opacity-100" : "opacity-40"}`}
                      style={{
                        width: "80%",
                        height: "80%",
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {overlayStyle && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          {/* background click area */}
          <div
            className="absolute inset-0"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => {
              // clicking the dark background should start a closing animation
              e.stopPropagation();
              if (!fromRectRef.current) return;
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
            }}
          />

          {/* left/right carets (don’t render while closing) */}
          {!isClosing && (
            <>
              <div style={leftCaretStyle}>
                <img
                  src="/icon-caret.svg"
                  alt=""
                  className="w-20 -rotate-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev(e as any);
                  }}
                />
              </div>
              <div style={rightCaretStyle}>
                <img
                  src="/icon-caret.svg"
                  alt=""
                  className="w-20 rotate-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext(e as any);
                  }}
                />
              </div>
            </>
          )}

          {/* enlarged image */}
          <img
            ref={(el) => {
              overlayRef.current = el;
            }}
            src={LookBookImages[activeIndex! - 1]}
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
