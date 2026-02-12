import React from "react";

const MenuBar = () => {
  return (
    <div className="relative flex h-16 items-center w-screen p-4">
      {/* LEFT */}
      <img src="/icon-hamburger.svg" alt="Menu" className="w-4" />

      {/* CENTER (true center regardless of side widths) */}
      <img
        src="/ruth-logo.svg"
        alt="Logo"
        className="absolute left-1/2 -translate-x-1/2 h-8 object-contain animate-pulse"
      />

      {/* RIGHT */}
      <img src="/icon-cart-empty.svg" alt="Cart" className="w-10 ml-auto" />
    </div>
  );
};

export default MenuBar;
