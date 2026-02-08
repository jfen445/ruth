"use client";

import React from "react";

const Video = () => {
  const [isMounted, setIsMounted] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(true);

  const screenClicked = () => {
    setIsVisible(false);
  };

  const handleTransitionEnd = () => {
    if (!isVisible) setIsMounted(false);
  };

  if (!isMounted) return null;

  return (
    <div
      onClick={screenClicked}
      onTransitionEnd={handleTransitionEnd}
      className={`fixed inset-0 flex items-center justify-center bg-black transition-opacity duration-700 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <video autoPlay muted className="max-h-full max-w-full object-contain">
        <source src="/ruthvideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default Video;
