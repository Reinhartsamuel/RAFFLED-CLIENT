import { useNavigate } from "react-router-dom"
import { BackendRaffle } from "../../interfaces/BackendRaffle"
import { formatUnits } from 'viem'
import { useState, useEffect } from 'react'

function useCountdown(endsAt: string) {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        function calc() {
            const diff = new Date(endsAt).getTime() - Date.now()
            if (diff <= 0) { setTimeLeft('Ended'); return }
            const d = Math.floor(diff / 86400000)
            const h = Math.floor((diff % 86400000) / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            if (d > 0) setTimeLeft(`${d}d ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`)
            else setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`)
        }
        calc()
        const id = setInterval(calc, 1000)
        return () => clearInterval(id)
    }, [endsAt])

    return timeLeft
}

export function RaffleCard({
    raffle
}: {
    raffle: BackendRaffle
}) {
    const navigate = useNavigate();
    const countdown = useCountdown(raffle.ends_at)
    const decimals = raffle.prize_asset_decimals || 6
    const symbol = raffle.prize_asset_symbol || 'USDC'
    const soldTickets = raffle.sold_tickets || 0
    const remainingTickets = raffle.max_tickets - soldTickets
    const ticketPriceBig = BigInt(raffle.ticket_price_amount)
    const buyAllAmount = formatUnits(ticketPriceBig * BigInt(remainingTickets), decimals)
    const ticketPrice = formatUnits(ticketPriceBig, decimals)

    return (
        <div
            className="raffle-card"
            onClick={() => navigate(`/app/raffle/${raffle.id}`)}
        >
            <div className="raffle-card-image-wrapper">
                <img
                    src={raffle.image_url ?? '/src/assets/USDC-grey.webp'}
                    alt={raffle.title}
                    className="raffle-card-image"
                />
                <div className="raffle-card-countdown">
                    <span className="raffle-card-countdown-label">Ends in</span>
                    <span className="raffle-card-countdown-value">{countdown}</span>
                </div>
            </div>

            <div className="raffle-card-body">
                <h3 className="font-syne font-bold text-lg">{raffle.title}</h3>
                {raffle.description && (
                    <p className="font-jetbrains text-xs text-white/50">{raffle.description}</p>
                )}
                <div className="raffle-card-stats">
                    <div className="stat">
                        <span className="stat-label">Prize</span>
                        <span className="stat-value">
                            {raffle.prize_type === 'erc721'
                                ? <><span className="nft-badge">NFT</span> #{raffle.prize_amount}</>
                                : <>{formatUnits(BigInt(raffle.prize_amount), decimals)} {symbol}</>
                            }
                        </span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Ticket</span>
                        <span className="stat-value">${ticketPrice}</span>
                    </div>
                </div>
                <div className="raffle-card-progress">
                    <div className="raffle-card-progress-header">
                        <span className="stat-label">Tickets Sold</span>
                        <span className="stat-label">{soldTickets}/{raffle.max_tickets}</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min((soldTickets / raffle.max_tickets) * 100, 100)}%` }}
                        />
                    </div>
                </div>
                <div className="raffle-card-footer">
                    <div className="raffle-card-cta-default">
                        <div className="raffle-card-cta-half">
                            <span className="stat-label">Buy all</span>
                            <span className="stat-value">${buyAllAmount}</span>
                        </div>
                        <div className="raffle-card-cta-divider" />
                        <div className="raffle-card-cta-half">
                            <span className="stat-label">Start from</span>
                            <span className="stat-value">${ticketPrice}</span>
                        </div>
                    </div>
                    <div className="raffle-card-cta-hover">
                        Buy Now
                    </div>
                </div>
            </div>
        </div>
    )
}
