import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import RegisterPlayer from "@/components/RegisterPlayer";
import CreateGame from "@/components/CreateGame";
import PlayerStatusGrid from "@/components/PlayerStatusGrid";
import PlayerControls from "@/components/PlayerControls";
import GameControls from "@/components/GameControls";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20`}
    >
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-[560px]">
        <h1 className="text-2xl font-semibold">mazerunner</h1>
        <CreateGame />
        <GameControls />
        <RegisterPlayer />
        <PlayerStatusGrid />
        <PlayerControls />
      </main>
    </div>
  );
}
