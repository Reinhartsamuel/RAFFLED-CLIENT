const tickerItems = [
  'RECENT WINNERS',
  'JACKPOT: 50 SOL',
  'BASE NETWORK LIVE',
  'SOLANA BRIDGE ACTIVE',
  'CHAINLINK VRF SECURED',
  'ORAO VRF POWERED',
];

export const Ticker = () => {
  return (
    <div className="w-full bg-safety-lime border-b-2 border-pure-black overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-3">
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <span
            key={i}
            className="mx-8 font-jetbrains text-pure-black font-black uppercase text-xs tracking-widest"
          >
            {item} +++
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
