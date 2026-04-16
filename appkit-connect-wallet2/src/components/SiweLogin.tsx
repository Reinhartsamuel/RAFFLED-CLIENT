import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export default function SiweLogin() {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { open } = useAppKit();
    const [token, setToken] = useState<string | null>(null);
    const API_BASE = 'https://api.raffled.live/api';

    async function handleLogin() {
        try {
            // Get nonce
            if (!address) {
                throw new Error('Wallet not connected');
            }

            const nonceRes = await fetch(`${API_BASE}/auth/nonce`, {
                headers: { 'Accept': 'application/json' },
            });

            const { nonce } = await nonceRes.json();

            // Compose message expected by backend (Base network)
            const message = [
                'Raffled wallet login',
                `Address: ${address}`,
                `Nonce: ${nonce}`,
            ].join('\n');

            // Sign message on Base (wagmi handles chain selection)
            const signature = await signMessageAsync({
                message,
            });

            // Verify with backend
            const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    signature,
                    address,
                    chain: 'base',
                }),
            });

            if (!verifyRes.ok) {
                const error = await verifyRes.json();
                throw new Error(error?.error || 'Verify failed');
            }

            const data = await verifyRes.json();

            // Save token for next requests
            setToken(data.token);
            localStorage.setItem('access_token', data.token);

            alert('✅ Login success!');
        } catch (err) {
            console.error('Base login failed:', err);
            alert('❌ Login failed!');
        }
    }

    // async function test() {
    //     // Test
    //     const testRes = await fetch(`${API_BASE}/test`, {
    //         method: 'POST',
    //         headers: {
    //             'Accept': 'application/json',
    //             'Content-Type': 'application/json',

    //             'Authorization': 'Bearer ' + localStorage.getItem('access_token')
    //         }
    //     });

    //     const result = await testRes.json();
    //     console.log(result);
    // }

    if (!isConnected) {
        return <button onClick={() => open()}>Connect Wallet</button>;
    }

    return (
        <div>
            <p>Connected as {address}</p>
            <button onClick={handleLogin}>Sign-In with Base</button>
            {token && <p>Token: {token.substring(0, 20)}...</p>}
{/* 
            <button onClick={test}>FETCH</button> */}

        </div>
    );
}
