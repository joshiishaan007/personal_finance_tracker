export default function AppTemplate({ children }: { children: React.ReactNode }) {
  // CSS page-enter (fade + slide-up); motion-reduce disables it for reduced-motion.
  // min-h-full (not h-full): lets content grow past the viewport so overflow-y-auto
  // on the parent correctly enables scrolling; h-full clamps to content-box height
  // and can suppress scroll in iOS Safari.
  return <div className="min-h-full animate-slide-up motion-reduce:animate-none">{children}</div>;
}
