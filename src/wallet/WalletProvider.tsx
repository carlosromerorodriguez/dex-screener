/**
 * Wallet Provider - Proveedor de wallets Solana para MINOTAURION ⚡
 */

import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import '@solana/wallet-adapter-react-ui/styles.css';

interface MinotaurionWalletProviderProps {
  children: ReactNode;
}

export const MinotaurionWalletProvider: FC<MinotaurionWalletProviderProps> = ({ children }) => {
  const endpoint = process.env.REACT_APP_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

