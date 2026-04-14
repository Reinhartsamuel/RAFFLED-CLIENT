import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

// Get build metadata
const getBuildMetadata = () => {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim()
    const buildTime = new Date().toISOString()
    return { commitHash, commitMessage, buildTime }
  } catch {
    return { commitHash: 'unknown', commitMessage: 'unknown', buildTime: new Date().toISOString() }
  }
}

const buildMetadata = getBuildMetadata()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env': {},
    '__BUILD_METADATA__': JSON.stringify(buildMetadata),
  },
})
