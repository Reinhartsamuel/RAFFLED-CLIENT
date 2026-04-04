import { GlassCard } from './';

const features = [
    {
        title: 'Multi-Chain Support',
        description: 'Seamlessly enter raffles from both Solana and Base. Your assets, your choice.',
        icon: '🔗',
    },
    {
        title: 'Verifiable Randomness',
        description: 'Winners are selected with provable fairness using Chainlink VRF. No more guessing.',
        icon: '🎲',
    },
    {
        title: 'Instant Payouts',
        description: 'Winnings are automatically transferred to your wallet. No lengthy claim processes.',
        icon: '⚡️',
    },
];

const FeatureSection2 = () => {
    return (
        <section id="features" className="py-20 md:py-28">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-12 md:mb-16">
                    <span className="font-jetbrains text-xs uppercase tracking-widest text-white/50 mb-4 block">
                        Features
                    </span>
                    <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-white">
                        Built for the Future of Raffles
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature) => (
                        <GlassCard key={feature.title} className="p-8">
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="font-syne font-bold text-xl mb-3 text-white">
                                {feature.title}
                            </h3>
                            <p className="font-jetbrains text-sm text-white/60 leading-relaxed">
                                {feature.description}
                            </p>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureSection2;