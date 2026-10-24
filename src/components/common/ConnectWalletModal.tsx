import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { useWallet, SupportedWallet } from '../../context/WalletContext'
import { truncateAddress } from '../../lib/utils'
import { Copy, Check, LogOut, Globe, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export const ConnectWalletModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { isConnected, address, chainName, chainId, balance, walletName, connect, disconnect, switchChain, isConnecting } = useWallet()
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success('Wallet address copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const wallets: { name: SupportedWallet; desc: string; icon: string }[] = [
    {
      name: 'MetaMask',
      desc: 'Connect using browser extension or mobile wallet',
      icon: '🦊'
    },
    {
      name: 'Phantom',
      desc: 'Connect to Solana ecosystem programs and micro-bounties',
      icon: '👻'
    },
    {
      name: 'Coinbase Wallet',
      desc: 'Seamless Smart Wallet and passkey authentication',
      icon: '🔵'
    },
    {
      name: 'WalletConnect',
      desc: 'Scan QR code with 300+ supported mobile Web3 wallets',
      icon: '🔗'
    }
  ]

  const networks = [
    { id: '42161', name: 'Arbitrum One' },
    { id: '1', name: 'Ethereum Mainnet' },
    { id: '8453', name: 'Base' },
    { id: 'solana', name: 'Solana' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isConnected ? 'Connected Web3 Wallet' : 'Connect Web3 Wallet'}
      description={
        isConnected
          ? 'Manage your Web3 address, escrow payout routes and network parameters.'
          : 'Connect your decentralized wallet to receive automated bounty payouts and stake collateral.'
      }
      maxWidth="md"
    >
      {isConnected ? (
        <div className="space-y-5">
          {/* Connected card */}
          <div className="p-4 rounded-xl bg-[#141A18] border border-[#232B28] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8E9894] uppercase tracking-wider">Active Wallet</span>
              <span className="text-xs text-[#24D6B1] flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {walletName}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#191F1D] p-3 rounded-lg border border-[#283530]">
              <span className="font-mono text-sm text-[#F4F5F1] font-medium">
                {truncateAddress(address || '')}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-[#25302C] text-[#8E9894] hover:text-[#F4F5F1] transition-colors"
                title="Copy Address"
              >
                {copied ? <Check className="w-4 h-4 text-[#24D6B1]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-[#8E9894] pt-1">
              <span>Marketplace Balance:</span>
              <span className="text-[#F4F5F1] font-mono font-semibold">{balance}</span>
            </div>
          </div>

          {/* Network Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8E9894] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#24D6B1]" />
              Select Network
            </label>
            <div className="grid grid-cols-2 gap-2">
              {networks.map(net => (
                <button
                  key={net.id}
                  onClick={() => { switchChain(net.id); toast.success(`Switched network to ${net.name}`); }}
                  className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left flex items-center justify-between ${
                    chainId === net.id 
                      ? 'bg-[#24D6B1]/10 border-[#24D6B1] text-[#24D6B1]' 
                      : 'bg-[#191F1D] border-[#25302C] text-[#8E9894] hover:text-[#F4F5F1] hover:border-[#33423D]'
                  }`}
                >
                  <span>{net.name}</span>
                  {chainId === net.id && <span className="w-1.5 h-1.5 rounded-full bg-[#24D6B1]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              onClick={() => { disconnect(); toast.info('Wallet disconnected'); onClose(); }}
              className="w-full"
            >
              Disconnect Wallet
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((w) => (
            <button
              key={w.name}
              disabled={isConnecting}
              onClick={async () => {
                await connect(w.name)
                toast.success(`Connected to ${w.name}!`)
                onClose()
              }}
              className="w-full p-3.5 rounded-xl bg-[#191F1D] border border-[#25302C] hover:border-[#24D6B1]/50 hover:bg-[#1E2623] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-2xl p-2 rounded-lg bg-[#141A18] border border-[#232B28]">{w.icon}</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#F4F5F1] group-hover:text-[#24D6B1] transition-colors font-display">
                    {w.name}
                  </h4>
                  <p className="text-xs text-[#8E9894] mt-0.5">{w.desc}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#8E9894] group-hover:text-[#24D6B1] transition-colors">
                Connect →
              </span>
            </button>
          ))}

          <p className="text-[11px] text-[#626D68] text-center pt-2">
            By connecting, you agree to Vaultwork's Terms of Service and automated cryptographic payout agreements.
          </p>
        </div>
      )}
    </Modal>
  )
}
