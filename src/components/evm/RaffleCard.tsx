import { useNavigate } from "react-router-dom"
import { BackendRaffle } from "../../interfaces/BackendRaffle"
import { formatUnits } from 'viem'

export function RaffleCard({
    raffle
}: {
    raffle: BackendRaffle
}) {
    const navigate = useNavigate();
    return (
        <div
            className="raffle-card"
            onClick={() => navigate(`/app/raffle/${raffle.id}`)}
        >

              <img src={raffle.image_url ?? '/src/assets/USDC-grey.webp'} alt={raffle.title} className="raffle-card-image" />
             
            <div className="raffle-card-body">
                <h3 className="font-syne font-bold text-lg">{raffle.title}</h3>
                {raffle.description && (
                    <p className="font-jetbrains text-xs text-pure-black/60">{raffle.description}</p>
                )}
                <div className="raffle-card-stats">
                    <div className="stat">
                        <span className="stat-label">Prize</span>
                        <span className="stat-value">
                            {formatUnits(BigInt(raffle.prize_amount), raffle.prize_asset_decimals || 6)} {raffle.prize_asset_symbol || 'USDC'}
                        </span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Ticket</span>
                        <span className="stat-value">${formatUnits(BigInt(raffle.ticket_price_amount), raffle.prize_asset_decimals || 6)}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Tickets</span>
                        <span className="stat-value">{raffle.tickets_sold || 0}/{raffle.max_tickets}</span>
                    </div>
                </div>
                <div className="raffle-card-footer">
                    <span className="font-jetbrains text-xs text-pure-black/50">
                        Ends: {new Date(raffle.ends_at).toLocaleDateString()}
                    </span>
                    <span className={`raffle-status status-${raffle.status}`}>
                        {raffle.status}
                    </span>
                </div>
            </div>
        </div>
    )
}