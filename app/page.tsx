import Video from "@/components/Video";
import LookBook from "@/components/LookBook";

export default function Home() {
  return (
    <div className="relative h-screen w-screen bg-white">
      <div className="absolute inset-0 flex items-center justify-center">
        <LookBook />
      </div>
      <Video />
    </div>
  );
}
