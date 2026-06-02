export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      {/* Animated aurora ambience */}
      <div className="pointer-events-none absolute inset-0 bg-aurora bg-[length:200%_200%] animate-gradient-shift opacity-20 dark:opacity-30" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-glow-radial" aria-hidden />
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </main>
  );
}
