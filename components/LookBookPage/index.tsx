import LookBook from "../LookBook";
import MenuBar from "../MenuBar";

const LookBookPage = () => {
  return (
    <div className="flex flex-col items-center h-screen w-screen bg-white overflow-hidden">
      <MenuBar />

      <h1 className="mt-8">SHOP</h1>
      <div className="flex-1 overflow-hidden w-full flex justify-center items-center">
        <LookBook />
      </div>
    </div>
  );
};

export default LookBookPage;
