interface OfficialBadgeProps {
    showLabel?: boolean
}

export function OfficialBadge({ showLabel = false }: OfficialBadgeProps) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FFD24A] via-[#FFB800] to-[#FF9500] px-1.5 py-0.5 shadow-[0_0_10px_rgba(255,184,0,0.45)] ring-1 ring-[#FFB800]/40">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-[#050505] flex-shrink-0" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.9 6.26 6.6 1.01-4.75 4.5 1.13 6.73L12 17.77 6.12 20.5l1.13-6.73L2.5 9.27l6.6-1.01L12 2z" />
            </svg>
            <span className={`${showLabel ? '' : 'hidden sm:inline '}font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#050505] leading-none`}>
                Official
            </span>
        </span>
    )
}
