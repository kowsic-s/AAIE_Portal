export default function SectionLabel({ text, centered = false }) {
  return (
    <div
      className={`flex items-center gap-2 text-[0.72rem] font-display
        font-semibold uppercase tracking-[0.1em] text-[var(--lp-accent)] mb-4
        ${centered ? 'justify-center' : ''}`}
    >
      {!centered && (
        <span className="w-5 h-[2px] bg-[var(--lp-accent)] rounded" />
      )}
      {text}
    </div>
  )
}
