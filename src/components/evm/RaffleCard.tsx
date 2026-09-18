import { useNavigate } from "react-router-dom"
import { formatUnits } from 'viem'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerItem } from '../../utils/animations'
import { OfficialBadge } from './OfficialBadge'
import type { EnrichedRaffle } from '../../hooks/useRaffles'

interface TimeUnitProps {
    value: number
    label: string
}

function TimeUnit({ value, label }: TimeUnitProps) {
    return (
        <div className="flex flex-col items-center">
            <div className="bg-[#050505] border border-[#1f1f1f] rounded px-1 py-0.5 min-w-[18px] sm:min-w-[24px] text-center">
                <span className="text-[#FFB800] font-mono text-[9px] sm:text-[11px] font-bold leading-none">
                    {value.toString().padStart(2, '0')}
                </span>
            </div>
            <span className="text-[#666] text-[6px] sm:text-[8px] mt-0.5 font-mono uppercase">{label}</span>
        </div>
    )
}

function useCountdown(endsAtSeconds: number) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [isEnded, setIsEnded] = useState(false)

    useEffect(() => {
        function calc() {
            const diff = endsAtSeconds * 1000 - Date.now()
            if (diff <= 0 || isNaN(diff)) {
                setIsEnded(true)
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
                return
            }
            setIsEnded(false)
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            })
        }
        calc()
        const id = setInterval(calc, 1000)
        return () => clearInterval(id)
    }, [endsAtSeconds])

    return { timeLeft, isEnded }
}

const STATUS_COLORS: Record<EnrichedRaffle['status'], { text: string; bg: string; border: string }> = {
    OPEN: { text: 'text-[#22C55E]', bg: 'bg-[#22C55E]', border: 'border-[#22C55E]/30' },
    PENDING_VRF: { text: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]', border: 'border-[#3B82F6]/30' },
    COMPLETED: { text: 'text-[#555555]', bg: 'bg-[#555555]', border: 'border-[#555555]/30' },
    CANCELLED: { text: 'text-[#EF4444]', bg: 'bg-[#EF4444]', border: 'border-[#EF4444]/30' },
}

export function RaffleCard({
    raffle
}: {
    raffle: EnrichedRaffle
}) {
    const navigate = useNavigate()
    const cardRef = useRef<HTMLDivElement>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    const isNft = raffle.prizeType === 'ERC721'
    const isOfficial = Boolean(raffle.official_raffle)
    const decimals = raffle.prizeDecimals || 6
    const symbol = raffle.prizeSymbol || (isNft ? 'NFT' : 'TOKEN')
    const soldTickets = Number(raffle.totalTickets ?? 0)
    const maxTickets = Number(raffle.maxCap ?? 0)
    const remainingTickets = Math.max(0, maxTickets - soldTickets)
    const isSoldOut = raffle.isFilled
    const isEnded = raffle.isExpired || raffle.status === 'COMPLETED' || raffle.status === 'CANCELLED'
    const ticketPrice = formatUnits(BigInt(raffle.ticketPrice || 0n), 6)
    const progressPct = raffle.progressPercent

    const { timeLeft, isEnded: countdownEnded } = useCountdown(raffle.expiryNum)
    const isAlmostSoldOut = progressPct >= 70
    const statusColor = STATUS_COLORS[raffle.status] ?? STATUS_COLORS.COMPLETED

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect()
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
            }
        }

        if (isHovered) {
            window.addEventListener('mousemove', handleMouseMove)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [isHovered])

    const prizeValue = raffle.prizeAmountOrTokenId || '0'
    const prizeAmountDisplay = isNft
        ? <><span className="text-xs border border-[#FFB800]/40 text-[#FFB800] px-1.5 py-0.5 rounded">NFT</span> #{prizeValue}</>
        : <>{formatUnits(BigInt(prizeValue), decimals)} <span className="text-[#999999] text-sm">{symbol}</span></>

    const cardBorderColor = isHovered ? 'rgba(255, 184, 0, 0.3)' : '#1f1f1f'
    const hoverShadow = '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 184, 0, 0.15)'
    const spotlightColor = 'rgba(255, 184, 0, 0.08)'

    return (
        <motion.div
            ref={cardRef}
            variants={staggerItem}
            className="relative w-full bg-[#0a0a0a] rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer"
            style={{
                borderColor: cardBorderColor,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/app/raffle/${raffle.raffleIdNum}`)}
            whileHover={{
                y: -8,
                boxShadow: hoverShadow,
            }}
        >
            {/* Mouse tracking spotlight effect */}
            {isHovered && (
                <motion.div
                    className="absolute inset-0 pointer-events-none z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        background: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent)`,
                    }}
                />
            )}

            {/* Image Section */}
            <div className="relative aspect-square w-full overflow-hidden bg-[#111111]">
                {/* Prize grid backdrop */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <p className="font-mono text-[10px] text-[#333333] uppercase tracking-widest mb-2">
                            {isNft ? 'NFT PRIZE' : 'PRIZE POOL'}
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold text-[#FFB800]/90 px-4 truncate max-w-full">
                            {isNft ? `#${prizeValue}` : formatUnits(BigInt(prizeValue), decimals)}
                        </p>
                        {!isNft && (
                            <p className="font-mono text-xs text-[#555555] mt-1 uppercase tracking-wider">{symbol}</p>
                        )}
                    </div>
                </div>

                {/* Prize image */}
                {raffle.image_url && (
                    <img
                        src={raffle.image_url}
                        alt={raffle.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-transparent to-transparent pointer-events-none" />

                {/* Status Ribbon */}
                <div className="absolute top-0 left-0 right-0 z-20">
                    <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-1 py-1 px-2 bg-[#050505]/85 backdrop-blur-sm border-b border-[#1f1f1f] ${statusColor.border}`}>
                        <div className="flex items-center justify-start">
                            {isOfficial && <OfficialBadge />}
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor.bg} ${raffle.status === 'OPEN' && !isEnded ? 'animate-pulse' : ''}`} />
                            <span className={`font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${statusColor.text}`}>
                                {raffle.status === 'PENDING_VRF' ? 'PENDING VRF' : raffle.status}
                            </span>
                        </div>
                        <div />
                    </div>
                </div>

                {/* Countdown Timer */}
                <div className="absolute left-0 right-0 top-9 px-1.5">
                    {!countdownEnded && !isEnded ? (
                        <div className="flex gap-0.5 sm:gap-1 items-center justify-center">
                            <TimeUnit value={timeLeft.days} label="Days" />
                            <span className="text-[#FFB800] font-mono text-[9px] sm:text-xs mb-2">:</span>
                            <TimeUnit value={timeLeft.hours} label="Hrs" />
                            <span className="text-[#FFB800] font-mono text-[9px] sm:text-xs mb-2">:</span>
                            <TimeUnit value={timeLeft.minutes} label="Min" />
                            <span className="text-[#FFB800] font-mono text-[9px] sm:text-xs mb-2">:</span>
                            <TimeUnit value={timeLeft.seconds} label="Sec" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <div className="bg-[#050505] border border-[#1f1f1f] rounded px-2 py-0.5">
                                <span className="text-[#555555] font-mono text-[10px] sm:text-sm font-bold">
                                    {raffle.status === 'CANCELLED' ? 'CANCELLED' : 'ENDED'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Live / Sold Out badge */}
                {!isEnded && !isSoldOut && (
                    <div className="absolute bottom-2 right-2">
                        <span className="flex items-center gap-1 bg-[#050505]/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-[#1f1f1f]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse flex-shrink-0" />
                            <span className="font-mono text-[8px] sm:text-[9px] text-[#22C55E] uppercase tracking-wider">Live</span>
                        </span>
                    </div>
                )}
                {isSoldOut && !isEnded && (
                    <div className="absolute bottom-2 right-2">
                        <span className="flex items-center gap-1 bg-[#050505]/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-[#1f1f1f]">
                            <span className="font-mono text-[8px] sm:text-[9px] text-[#EF4444] uppercase tracking-wider">Sold Out</span>
                        </span>
                    </div>
                )}

                {/* Underfilled badge */}
                {raffle.underfilled && (
                    <div className="absolute bottom-2 left-2">
                        <span className="flex items-center gap-1 bg-[#050505]/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-[#F97316]/30">
                            <span className="font-mono text-[8px] sm:text-[9px] text-[#F97316] uppercase tracking-wider">Underfilled</span>
                        </span>
                    </div>
                )}

                {/* Buy Now Overlay on Hover */}
                <AnimatePresence>
                    {isHovered && !isEnded && !isSoldOut && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm"
                        >
                            <div className="bg-[#FFB800] hover:bg-[#FFB800]/90 shadow-lg shadow-[#FFB800]/20 text-[#050505] font-mono font-bold text-lg px-8 py-6 rounded-lg">
                                Buy Now
                            </div>
                        </motion.div>
                    )}

                    {isHovered && (isEnded || isSoldOut) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm"
                        >
                            <div className="bg-[#1f1f1f] text-[#555555] font-mono font-bold text-lg px-8 py-6 rounded-lg border border-[#333]">
                                {isSoldOut ? 'Sold Out' : 'Ended'}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Card Body */}
            <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 relative">
                {/* Raffle ID + Prize Pool */}
                <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                        <p className="text-[#666] text-[9px] sm:text-xs font-mono uppercase tracking-wider mb-0.5 sm:mb-1">
                            Raffle #{raffle.raffleIdNum} · {symbol}
                        </p>
                        <p className="text-[#FFB800] text-base sm:text-2xl font-mono font-bold truncate">
                            {prizeAmountDisplay}
                        </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-[#666] text-[9px] sm:text-xs font-mono uppercase tracking-wider mb-0.5 sm:mb-1">Ticket</p>
                        <p className="text-white text-sm sm:text-lg font-mono font-semibold">${Number(ticketPrice).toFixed(2)}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#666] text-[9px] sm:text-xs">Tickets Sold</span>
                        <span className="text-white font-semibold text-[9px] sm:text-xs">
                            {soldTickets} / {maxTickets}
                        </span>
                    </div>

                    <div className="relative h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
                        <motion.div
                            className={`absolute top-0 left-0 h-full rounded-full transition-colors duration-300 ${
                                isAlmostSoldOut
                                    ? 'bg-gradient-to-r from-[#EF4444] to-[#FF6B00]'
                                    : 'bg-gradient-to-r from-[#FFB800] to-[#FFA500]'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                        {!isEnded && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                        )}
                    </div>

                    <div className="flex items-center justify-between font-mono">
                        <span className="text-[#666] text-[9px] sm:text-xs">{progressPct.toFixed(1)}% Sold</span>
                        <span className={`text-[9px] sm:text-xs ${
                            isAlmostSoldOut ? 'text-[#EF4444]' : 'text-[#FFB800]'
                        }`}>
                            {remainingTickets} Left
                        </span>
                    </div>
                </div>
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 184, 0, 0.03)" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                </svg>
            </div>
        </motion.div>
    )
}
