import MetalDuckScene from '@/components/metal-duck-scene';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-0 m-0 overflow-hidden">
      {/* The container for the 3D scene. Tailwind classes for centering and sizing. */}
      {/* Adjust max-w-xl, max-h-[60vh] or aspect-[4/3] as needed for desired presentation */}
      <div 
        id="duck-container" 
        className="w-full h-screen sm:w-[80vw] sm:h-[80vh] sm:max-w-3xl sm:max-h-[70vh] sm:aspect-video relative sm:rounded-lg sm:shadow-2xl overflow-hidden"
        aria-label="Interactive 3D Duck Scene"
      >
        <MetalDuckScene />
      </div>
    </main>
  );
}
