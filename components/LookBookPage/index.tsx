import LookBook from "../LookBook";
import MenuBar from "../MenuBar";

const LookBookPage = () => {
  return (
    <div className="flex flex-col items-center h-dvh w-full bg-white overflow-hidden">
      <MenuBar />

      <h1 className="mt-8">SHOP</h1>
      {/* min-h-0 lets this area actually shrink, so the grid is sized by the
          space that's left rather than overflowing and getting clipped. */}
      {/* No overflow-hidden here: hovering an edge cell scales it past the
          grid's bounds, and clipping at this box lopped off the top row. The
          page root above still clips, so nothing can cause a scrollbar. */}
      <div className="flex-1 min-h-0 w-full flex justify-center items-center px-4 py-4 sm:px-6 md:px-8">
        <LookBook />
      </div>
    </div>
  );
};

export default LookBookPage;
