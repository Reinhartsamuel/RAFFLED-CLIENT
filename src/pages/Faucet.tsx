import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWriteContract, useReadContract, useAccount } from 'wagmi'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { Navigate } from 'react-router-dom'
import { Layout, DashboardSidebar } from '../components/evm/Layout'
import mockUsdcAbi from '../abis/MockUSDC.json'

const MOCK_USDC_ADDRESS = '0x49f49cfe89050a8f8e48d3a31e33a8e26bc80d1d'
const MINT_AMOUNT = '1000000000' // 1000 USDC (6 decimals)

export function FaucetPage() {
  const { isConnected } = useAppKitAccount()
  const { address } = useAccount()
  const { open } = useAppKit()
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' })

  const sidebar = <DashboardSidebar activeFilter="faucet" onFilterChange={() => {}} />

  const { writeContractAsync } = useWriteContract()

  const { data: balance } = useReadContract({
    address: MOCK_USDC_ADDRESS as `0x${string}`,
    abi: mockUsdcAbi.abi,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && isConnected,
    },
  })

  // Redirect to connect wallet first if not connected
  if (!isConnected) {
    return <Navigate to="/app" replace />
  }

  const handleMint = async () => {
    if (!address) {
      open()
      return
    }

    setMessage({ type: null, text: '' })

    try {
      await writeContractAsync({
        address: MOCK_USDC_ADDRESS as `0x${string}`,
        abi: mockUsdcAbi.abi,
        functionName: 'mint',
        args: [address, BigInt(MINT_AMOUNT)],
      })

      setMessage({ type: 'success', text: `Successfully minted 1000 MockUSDC!` })
    } catch (err) {
      console.error('Mint error:', err)
      setMessage({ type: 'error', text: 'Failed to mint. Please try again.' })
    }
  }

  return (
    <Layout sidebar={sidebar}>
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full"
        >
          <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-2xl p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center mx-auto mb-4">
                <img src="/USDC.svg" alt="USDC" className="w-8 h-8" onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">💰</span>'
                }} />
              </div>
              <h2 className="font-sans font-bold text-2xl text-[#F5F5F5] mb-2">MockUSDC Faucet</h2>
              <p className="font-mono text-sm text-[#555555]">
                Get free testnet USDC tokens for development
              </p>
            </div>

            {/* Balance Display */}
            {address && (
              <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4 mb-6">
                <p className="font-mono text-xs text-[#555555] mb-1">Your Balance</p>
                <p className="font-sans font-bold text-xl text-[#F5F5F5]">
                  {balance ? `${(Number(balance as bigint) / 1_000_000).toFixed(2)} USDC` : '0.00 USDC'}
                </p>
              </div>
            )}

            {/* Mint Button */}
            <button
              onClick={handleMint}
              className="w-full py-3 bg-[#FFB800] text-[#050505] font-mono font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-[#FFCC33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'Mint 1000 USDC'}
            </button>

            {/* Message Display */}
            {message.type && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-lg border text-center font-mono text-xs ${
                  message.type === 'success'
                    ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20'
                    : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            {/* Info */}
            <div className="mt-6 text-center">
              <p className="font-mono text-[10px] text-[#333333] break-all">
                Contract: {MOCK_USDC_ADDRESS}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}

export default FaucetPage