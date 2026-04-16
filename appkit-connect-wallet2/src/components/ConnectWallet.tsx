import { useAppKit } from '@reown/appkit/react';

export function ConnectWallet() {
  const appKit = useAppKit();

  return (
    <button onClick={() => appKit.open()}>
      Connect Wallet
    </button>
  );
}