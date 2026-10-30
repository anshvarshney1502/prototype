"use client";
import dynamic from "next/dynamic";

// WebGL only in the browser; a flat teal circle holds the space while it loads.
const Orb = dynamic(() => import("./Orb"), {
  ssr: false,
  loading: () => <div className="w-full h-full grid place-items-center"><div className="w-1/2 aspect-square rounded-full bg-teal-soft" /></div>,
});
export default Orb;
