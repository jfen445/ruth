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
  const [gap, setGap] = React.useState(10);
  const [gridRect, setGridRect] = React.useState<Rect | null>(null);
  const fromRectRef = React.useRef<Rect | null>(null);
  const overlayRef = React.useRef<HTMLImageElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const updateGap = () => {
      setGap(window.innerWidth < 768 ? 10 : 200);
    };
    updateGap();
    window.addEventListener("resize", updateGap);
    return () => window.removeEventListener("resize", updateGap);
  }, []);

  React.useEffect(() => {
    const updateGridRect = () => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      setGridRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };
    updateGridRect();
    window.addEventListener("resize", updateGridRect);
    return () => window.removeEventListener("resize", updateGridRect);
  }, []);

  // helper used when we change the centred image via carets so the closing
  // animation targets the correct grid cell instead of the originally
  // clicked one.
  const updateFromRect = (idx: number) => {
    const cellImg = document.querySelector(
      `[data-idx="${idx}"] img`,
    ) as HTMLImageElement | null;
    if (!cellImg || !gridRef.current) return;
    const cellRect = cellImg.getBoundingClientRect();
    const gridBounds = gridRef.current.getBoundingClientRect();
    fromRectRef.current = {
      left: cellRect.left - gridBounds.left,
      top: cellRect.top - gridBounds.top,
      width: cellRect.width,
      height: cellRect.height,
    };
  };

  // handlers for the carets – replace contents with whatever behaviour you want
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();

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

    if (activeIndex && activeIndex < gridItems.length) {
      const newIndex = activeIndex + 1;
      setActiveIndex(newIndex);
      updateFromRect(newIndex);
    }
  };

  const overlayContainerRef = React.useRef<HTMLDivElement>(null);

  const handleCloseOverlay = () => {
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
            opacity: 0,
          }
        : prev,
    );
  };

  // Handle backdrop clicks to close overlay
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop itself, not on overlay content
    if (e.target === e.currentTarget) {
      handleCloseOverlay();
    }
  };

  const handleCellClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    if (!gridRef.current) return;

    const cell = e.currentTarget as HTMLElement;
    const img = cell.querySelector("img") as HTMLImageElement | null;
    if (!img) return;

    const imgRect = img.getBoundingClientRect();
    const gridBounds = gridRef.current.getBoundingClientRect();

    const fromRect = {
      left: imgRect.left - gridBounds.left,
      top: imgRect.top - gridBounds.top,
      width: imgRect.width,
      height: imgRect.height,
    };
    fromRectRef.current = fromRect;

    // Get natural dimensions to preserve aspect ratio
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const aspectRatio = naturalWidth / naturalHeight;

    // Calculate target size preserving aspect ratio
    // Scale relative to grid width
    const gridWidth = gridBounds.width;
    const gridHeight = gridBounds.height;
    const scale = 0.6; // 60% of grid width
    let targetW = gridWidth * scale;
    let targetH = targetW / aspectRatio;

    // Cap to grid size
    if (targetH > gridHeight * 0.9) {
      targetH = gridHeight * 0.9;
      targetW = targetH * aspectRatio;
    }

    // Calculate target position - center within grid
    const targetLeft = (gridWidth - targetW) / 2;
    const targetTop = (gridHeight - targetH) / 2;

    // set initial overlay at the source position without transition
    setOverlayStyle({
      left: fromRect.left,
      top: fromRect.top,
      width: fromRect.width,
      height: fromRect.height,
      transition: "none",
      opacity: 1,
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
          transition: "all 500ms ease-in-out",
          opacity: 1,
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

  // calculate overlay image and caret positions using transform
  let overlayTransform = "translate(0, 0)";
  let overlayOpacity = 0;
  let leftCaretTransform = "translate(0, 0)";
  let rightCaretTransform = "translate(0, 0)";
  let caretSize = 0;

  if (overlayStyle && gridRect) {
    const l = Number(overlayStyle.left);
    const t = Number(overlayStyle.top);
    const h = Number(overlayStyle.height);
    const w = Number(overlayStyle.width);
    overlayOpacity = Number(overlayStyle.opacity) || 1;

    const isMobile = window.innerWidth < 768;

    // Scale caret size based on screen size
    caretSize = isMobile ? gridRect.width * 0.08 : gridRect.width * 0.12;

    // Spacing relative to the enlarged image width
    const imageRelativeGap = w * (isMobile ? 0.05 : 0.1);

    // Position overlay relative to grid origin
    overlayTransform = `translate(${l}px, ${t}px)`;

    if (isMobile) {
      // Mobile: carets positioned within grid borders, spaced relative to image
      leftCaretTransform = `translate(${imageRelativeGap}px, ${t + h / 2 - caretSize / 2}px)`;
      rightCaretTransform = `translate(${gridRect.width - caretSize - imageRelativeGap}px, ${t + h / 2 - caretSize / 2}px)`;
    } else {
      // Desktop: carets positioned outside grid borders
      leftCaretTransform = `translate(${l - caretSize - imageRelativeGap}px, ${t + h / 2 - caretSize / 2}px)`;
      rightCaretTransform = `translate(${l + w + imageRelativeGap}px, ${t + h / 2 - caretSize / 2}px)`;
    }
  }

  return (
    <>
      {overlayStyle && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseOverlay();
            }
          }}
        />
      )}
      <div className="w-full flex justify-center px-4 sm:px-6 md:px-8">
        <div
          ref={gridRef}
          className="relative w-full max-w-[55vh] aspect-[2/3]"
        >
          {/* Grid */}
          <div className="grid grid-cols-4 grid-rows-6 w-full h-full border border-gray-500 relative z-0">
            {LookBookImages.map((img, i) => {
              const idx = i + 1;
              const isHovered = hoveredIndex === idx;
              const isActive = activeIndex === idx;
              return (
                <div
                  key={i}
                  data-idx={idx}
                  className="relative border border-gray-500 overflow-visible flex items-center justify-center group w-full h-full"
                  onClick={(e) => handleCellClick(e, idx)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <img
                    src={img}
                    alt={`Look ${idx}`}
                    className={`transform transition-transform duration-2000 ease-out group-hover:scale-200 group-hover:z-10 transition-opacity duration-500 ease-in-out`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top",
                      opacity: isActive ? 0 : isHovered ? 1 : 0.2,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Overlay container - positioned relative to grid */}
          {overlayStyle && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              {/* background click area - close overlay when clicking inside grid */}
              <div
                className="absolute inset-0"
                style={{ pointerEvents: "auto" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseOverlay();
                }}
              />

              {/* Overlay image */}
              <img
                ref={(el) => {
                  overlayRef.current = el;
                }}
                src={LookBookImages[activeIndex! - 1]}
                alt="enlarged"
                style={{
                  width: Number(overlayStyle.width),
                  height: Number(overlayStyle.height),
                  objectFit: "cover",
                  objectPosition: "top",
                  pointerEvents: "auto",
                  position: "absolute",
                  transform: overlayTransform,
                  opacity: overlayOpacity,
                  transition: overlayStyle.transition,
                  zIndex: 9999,
                  top: 0,
                  left: 0,
                }}
                onTransitionEnd={handleOverlayTransitionEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseOverlay();
                }}
              />

              {/* left/right carets (don't render while closing) */}
              {!isClosing && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      transform: leftCaretTransform,
                      pointerEvents: "auto",
                      width: caretSize,
                      height: caretSize,
                      top: 0,
                      left: 0,
                      zIndex: 9999,
                    }}
                  >
                    <svg
                      className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                      style={{ width: "100%", height: "100%" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrev(e as any);
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      transform: rightCaretTransform,
                      pointerEvents: "auto",
                      width: caretSize,
                      height: caretSize,
                      top: 0,
                      left: 0,
                      zIndex: 9999,
                    }}
                  >
                    <svg
                      className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                      style={{ width: "100%", height: "100%" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext(e as any);
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LookBook;
