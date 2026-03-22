"use client";

import React from "react";

const Video = () => {
  console.log("hiii", process.env.NEXT_PUBLIC_SHOW_VIDEO);
  const [isMounted, setIsMounted] = React.useState(
    process.env.NEXT_PUBLIC_SHOW_VIDEO === "true",
  );
  const [isVisible, setIsVisible] = React.useState(
    process.env.NEXT_PUBLIC_SHOW_VIDEO === "true",
  );

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
      <video
        autoPlay
        muted
        playsInline
        loop
        className="h-full w-full object-cover"
      >
        <source src="/ruthvideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default Video;
