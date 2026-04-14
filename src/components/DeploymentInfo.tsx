import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

declare global {
  const __BUILD_METADATA__: {
    commitHash: string
    commitMessage: string
    buildTime: string
  }
}

export function DeploymentInfo() {
  const [isOpen, setIsOpen] = useState(false)
  const metadata = __BUILD_METADATA__

  const buildDate = new Date(metadata.buildTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      {/* Deployment Badge */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/40 text-[#FFB800] font-mono text-[10px] hover:bg-[#FFB800]/20 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? '✕' : '📦'}
      </motion.button>

      {/* Deployment Info Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-16 right-4 z-40 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg shadow-2xl p-4 max-w-xs"
          >
            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-[#888888] block mb-1">Build Timestamp</span>
                <span className="text-[#F5F5F5]">{buildDate}</span>
              </div>

              <div className="border-t border-[#1f1f1f] pt-3">
                <span className="text-[#888888] block mb-1">Commit</span>
                <div className="flex items-center gap-2">
                  <code className="bg-[#111111] px-2 py-1 rounded text-[#FFB800] flex-1 break-all">
                    {metadata.commitHash}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(metadata.commitHash)
                    }}
                    className="text-[#555555] hover:text-[#F5F5F5] transition-colors"
                    title="Copy commit hash"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="border-t border-[#1f1f1f] pt-3">
                <span className="text-[#888888] block mb-1">Message</span>
                <p className="text-[#AAAAAA] text-[9px] leading-relaxed break-words line-clamp-3">
                  {metadata.commitMessage}
                </p>
              </div>

              <div className="text-[9px] text-[#555555] pt-2 border-t border-[#1f1f1f]">
                You're running the latest deployment ✓
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
