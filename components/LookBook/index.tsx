"use client";

import React from "react";
import { LookBookImages } from "./images";

type Rect = { left: number; top: number; width: number; height: number };

const OVERLAY_TRANSITION = "all 500ms ease-in-out";

// How much a grid image grows on hover. Tune to taste.
const HOVER_SCALE = 1.5;

// How long the hover zoom and colour fade take, in ms. Shared so the colour
// finishes filling in exactly as the image reaches full size.
const HOVER_DURATION = 700;

// Where the enlarged image sits, in pixels relative to the grid box. Derived
// from the grid's current size, so it can be recomputed whenever that changes.
const centeredRect = (
  aspectRatio: number,
  gridWidth: number,
  gridHeight: number,
): Rect => {
  let width = gridWidth * 0.6; // 60% of grid width
  let height = width / aspectRatio;

  // cap to grid size
  if (height > gridHeight * 0.9) {
    height = gridHeight * 0.9;
    width = height * aspectRatio;
  }

  return {
    left: (gridWidth - width) / 2,
    top: (gridHeight - height) / 2,
    width,
    height,
  };
};

const LookBook = () => {
  const gridItems = Array.from({ length: 24 }, (_, i) => i + 1);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [overlayStyle, setOverlayStyle] = React.useState<
    (React.CSSProperties & { transition?: string }) | null
  >(null);
  const [isClosing, setIsClosing] = React.useState(false);
  const [gridRect, setGridRect] = React.useState<Rect | null>(null);
  const fromRectRef = React.useRef<Rect | null>(null);
  const overlayRef = React.useRef<HTMLImageElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  // The grid is sized by container queries, so it can change size without the
  // window firing a resize event. Observe the box itself instead.
  React.useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateGridRect = () => {
      const rect = grid.getBoundingClientRect();
      setGridRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };

    updateGridRect();
    const observer = new ResizeObserver(updateGridRect);
    observer.observe(grid);
    window.addEventListener("resize", updateGridRect);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateGridRect);
    };
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

  // The overlay's position is stored as pixels measured at click time, so it
  // has to be recomputed whenever the grid box changes size — otherwise the
  // centred image keeps its old geometry and drifts off-centre on resize.
  React.useEffect(() => {
    const grid = gridRef.current;
    if (grid === null || activeIndex === null || isClosing) return;

    // Start from the current size, not null: ResizeObserver fires once on
    // observe(), and if that first call got through it would snap the overlay
    // straight to the centre, skipping the open animation. That only showed up
    // once the image was cached — on a first open naturalWidth is still 0 and
    // recenter bails out early.
    const initial = grid.getBoundingClientRect();
    let lastWidth: number | null = initial.width;
    let lastHeight: number | null = initial.height;

    const recenter = () => {
      const img = overlayRef.current;
      if (!img || !img.naturalWidth) return;

      const bounds = grid.getBoundingClientRect();
      // ignore any notification that isn't an actual size change
      if (bounds.width === lastWidth && bounds.height === lastHeight) return;
      lastWidth = bounds.width;
      lastHeight = bounds.height;

      // keep the closing animation aimed at the right cell at its new size
      updateFromRect(activeIndex);

      setOverlayStyle((prev) =>
        prev
          ? {
              ...prev,
              ...centeredRect(
                img.naturalWidth / img.naturalHeight,
                bounds.width,
                bounds.height,
              ),
              // snap rather than animate, so it tracks the drag of a resize
              transition: "none",
            }
          : prev,
      );
    };

    const observer = new ResizeObserver(recenter);
    observer.observe(grid);
    window.addEventListener("resize", recenter);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recenter);
    };
  }, [activeIndex, isClosing]);

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
            // set explicitly: a resize leaves the transition at "none", and
            // without one the transitionend that unmounts this never fires
            transition: OVERLAY_TRANSITION,
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

    // Target size/position, preserving the image's natural aspect ratio
    const target = centeredRect(
      img.naturalWidth / img.naturalHeight,
      gridBounds.width,
      gridBounds.height,
    );

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
          ...target,
          transition: OVERLAY_TRANSITION,
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

    // Position overlay relative to grid origin
    overlayTransform = `translate(${l}px, ${t}px)`;

    const caretTop = t + h / 2;

    // Room between the grid and the viewport edge, on the tighter side.
    // gridRect is tracked on resize, so this re-decides as the window changes.
    const sideSpace = Math.min(
      gridRect.left,
      window.innerWidth - (gridRect.left + gridRect.width),
    );

    const outsideCaretSize = gridRect.width * 0.12;
    const outsideGap = outsideCaretSize * 0.25;

    if (sideSpace >= outsideCaretSize + outsideGap * 2) {
      // Enough margin: carets sit outside the grid, just clear of its border
      caretSize = outsideCaretSize;
      leftCaretTransform = `translate(${-caretSize - outsideGap}px, ${caretTop - caretSize / 2}px)`;
      rightCaretTransform = `translate(${gridRect.width + outsideGap}px, ${caretTop - caretSize / 2}px)`;
    } else {
      // No margin to spare: carets sit within the grid, spaced relative to
      // the enlarged image
      caretSize = gridRect.width * 0.08;
      const imageRelativeGap = w * 0.05;
      leftCaretTransform = `translate(${imageRelativeGap}px, ${caretTop - caretSize / 2}px)`;
      rightCaretTransform = `translate(${gridRect.width - caretSize - imageRelativeGap}px, ${caretTop - caretSize / 2}px)`;
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
      <div className="h-full w-full flex items-center justify-center [container-type:size]">
        {/* Sized from whichever axis runs out first: the available width, or
            the available height of this area (100cqh) via the 2:3 ratio. */}
        <div
          ref={gridRef}
          className="relative aspect-[2/3] w-full max-w-[calc(100cqh*2/3)]"
        >
          {/* Grid. The 1px gaps let the grid's own background show through,
              so every seam is a single hairline instead of two cell borders
              stacking into a 2px band. */}
          <div className="grid grid-cols-4 grid-rows-6 gap-px w-full h-full bg-gray-500 border border-gray-500 relative z-0">
            {LookBookImages.map((img, i) => {
              const idx = i + 1;
              const isHovered = hoveredIndex === idx;
              const isActive = activeIndex === idx;
              return (
                <div
                  key={i}
                  data-idx={idx}
                  className="relative bg-white overflow-visible flex items-center justify-center w-full h-full"
                  // lift the hovered cell so its enlarged image sits above its
                  // neighbours instead of under the ones later in the grid
                  style={{ zIndex: isHovered ? 10 : undefined }}
                  onClick={(e) => handleCellClick(e, idx)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <img
                    src={img}
                    alt={`Look ${idx}`}
                    // Scale is driven from the same hover state as opacity
                    // rather than a group-hover class, so the two always stay
                    // in step and can't be dropped by a stale CSS build.
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top",
                      opacity: isActive ? 0 : isHovered ? 1 : 0.2,
                      transform:
                        isHovered && !isActive
                          ? `scale(${HOVER_SCALE})`
                          : "scale(1)",
                      // On hover the colour eases in over the whole zoom, so it
                      // is still filling in as the image reaches full size
                      // rather than snapping on at the start of it.
                      transition: `transform ${HOVER_DURATION}ms ease-out, opacity ${HOVER_DURATION}ms ${
                        isHovered ? "ease-in" : "ease-out"
                      }`,
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
