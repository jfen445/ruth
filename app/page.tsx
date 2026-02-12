import Video from "@/components/Video";
import LookBook from "@/components/LookBook";
import LookBookPage from "@/components/LookBookPage";

export default function Home() {
  return (
    <div className="relative h-screen w-screen bg-white">
      <div className="absolute inset-0 flex items-center justify-center">
        <LookBookPage />
      </div>
      <Video />
    </div>
  );
}
