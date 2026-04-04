import { Button } from './';

const Header2 = () => {
    return (
        <header className="fixed top-0 left-0 w-full z-50">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
                <a href="/" className="font-syne font-extrabold text-xl text-white">
                    RAFFLED
                </a>
                <div className="flex items-center gap-6">
                    <a
                        href="#features"
                        className="font-jetbrains text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors hidden md:block"
                    >
                        Features
                    </a>
                    <a
                        href="#how-it-works"
                        className="font-jetbrains text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors hidden md:block"
                    >
                        How It Works
                    </a>
                    <Button onClick={() => window.location.href = '/app'} className="font-jetbrains font-semibold text-xs uppercase tracking-wider px-4 py-2">
                        Launch App
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header2;