export default function PageBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Orb 1 — blue */}
      <div
        className="absolute w-[600px] h-[600px] -top-[200px] -left-[150px] rounded-full animate-orb"
        style={{
          background: 'radial-gradient(circle, rgba(79,142,247,0.18), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      {/* Orb 2 — purple */}
      <div
        className="absolute w-[500px] h-[500px] top-[40%] -right-[100px] rounded-full animate-orb"
        style={{
          background: 'radial-gradient(circle, rgba(124,106,247,0.14), transparent 70%)',
          filter: 'blur(100px)',
          animationDelay: '-7s',
          animationDuration: '26s',
        }}
      />
      {/* Orb 3 — cyan */}
      <div
        className="absolute w-[400px] h-[400px] -bottom-[100px] left-[30%] rounded-full animate-orb"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.12), transparent 70%)',
          filter: 'blur(100px)',
          animationDelay: '-14s',
          animationDuration: '22s',
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--lp-text-1, #eef2ff) 1px, transparent 1px), linear-gradient(90deg, var(--lp-text-1, #eef2ff) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}
