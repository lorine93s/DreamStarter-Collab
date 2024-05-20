"use client";

import "./globals.css";

import {
  ThirdwebProvider,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  embeddedWallet,

} from "@thirdweb-dev/react";
import { Sepolia } from "@thirdweb-dev/chains";
import { ProposalProvider } from "@/ContextProviders/ProposalProvider";
import { SnackbarProvider, closeSnackbar } from "notistack";
import { IoClose } from "react-icons/io5";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <title>Dreamstarter</title>
      <ProposalProvider>
        <ThirdwebProvider
          activeChain={Sepolia}
          clientId="5be238b6d90aced04e9db46730f231da"
          supportedWallets={[
            metamaskWallet(),
            coinbaseWallet({ recommended: true }),
            walletConnect(),
            embeddedWallet(),
          ]}
        >
          <SnackbarProvider
            action={(snackbarId) => (
              <button onClick={() => closeSnackbar(snackbarId)}>
                <IoClose className="h-6 w-6 pr-2 text-xl" />
              </button>
            )}
          >
            <body className="font-raleway text-sm text-gray-800">
              <div>{children}</div>
            </body>
          </SnackbarProvider>
        </ThirdwebProvider>
      </ProposalProvider>
    </html>
  );
}