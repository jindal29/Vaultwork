import React, { createContext, useContext, useState, useEffect } from 'react'

export type SupportedWallet = 'MetaMask' | 'Phantom' | 'Coinbase Wallet' | 'WalletConnect'

interface WalletContextType {
  address: string | null
  chainId: string
  chainName: string
  isConnected: boolean
  isConnecting: boolean
  walletName: SupportedWallet | null
  balance: string
  connect: (wallet: SupportedWallet) => Promise<void>
  disconnect: () => void
  switchChain: (chainId: string) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const NETWORKS: Record<string, string> = {
  '1': 'Ethereum Mainnet',
  '42161': 'Arbitrum One',
  '8453': 'Base',
  'solana': 'Solana Mainnet'
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(() => {
    return localStorage.getItem('vaultwork_wallet_address') || '0x71C2a8B87e452a23C4498B9d8E7A034179e83120'
  })
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return localStorage.getItem('vaultwork_wallet_connected') === 'true'
  })
  const [walletName, setWalletName] = useState<SupportedWallet | null>(() => {
    return (localStorage.getItem('vaultwork_wallet_name') as SupportedWallet) || null
  })
  const [chainId, setChainId] = useState<string>('42161')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem('vaultwork_wallet_connected', 'true')
      localStorage.setItem('vaultwork_wallet_address', address)
      if (walletName) localStorage.setItem('vaultwork_wallet_name', walletName)
    } else {
      localStorage.removeItem('vaultwork_wallet_connected')
      localStorage.removeItem('vaultwork_wallet_address')
      localStorage.removeItem('vaultwork_wallet_name')
    }
  }, [isConnected, address, walletName])

  const connect = async (wallet: SupportedWallet) => {
    setIsConnecting(true)
    await new Promise(r => setTimeout(r, 600)) // realistic connect delay

    let mockAddr = '0x71C2a8B87e452a23C4498B9d8E7A034179e83120'
    if (wallet === 'Phantom') {
      mockAddr = '7XvJ3YdZ1Ksm7b4kE2wN9CjR8Lm4PqQ5t'
      setChainId('solana')
    } else {
      setChainId('42161')
    }

    setAddress(mockAddr)
    setWalletName(wallet)
    setIsConnected(true)
    setIsConnecting(false)
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress(null)
    setWalletName(null)
  }

  const switchChain = (newChainId: string) => {
    setChainId(newChainId)
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        chainName: NETWORKS[chainId] || 'Custom Network',
        isConnected,
        isConnecting,
        walletName,
        balance: chainId === 'solana' ? '68.5 SOL' : '18,450 USDC',
        connect,
        disconnect,
        switchChain
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
