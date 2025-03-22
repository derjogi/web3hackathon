'use client';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function WalletConnect({ onAccountChange }) {
  const [account, setAccount] = useState('');
  const [network, setNetwork] = useState('');

  async function connectWallet() {
    if (window.ethereum) {
      try {
        // Force MetaMask to show the account selection modal
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        
        // Then get the selected account
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Request switch to Sepolia network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '11155111' }], // Chain ID for Sepolia
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '11155111',
                    chainName: 'Sepolia Test Network',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: ['https://sepolia.infura.io/v3/'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io']
                  }
                ]
              });
            } catch (addError) {
              console.error("Error adding Sepolia network", addError);
            }
          } else {
            console.error("Failed to switch to Sepolia network", switchError);
          }
        }
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        
        setAccount(accounts[0]);
        setNetwork(network.name);
        
        // Notify parent component about account change
        if (onAccountChange) {
          onAccountChange(accounts[0], network.name);
        }
      } catch (error) {
        console.error("User denied account access", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  }
  
  function disconnectWallet() {
    // Clear wallet state
    setAccount('');
    setNetwork('');
    
    // Notify parent component
    if (onAccountChange) {
      onAccountChange('', '');
    }
    
    // Note to user
    alert("You've been disconnected from this dApp. To connect a different account, use MetaMask to switch accounts and then reconnect.");
  }
  
  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        const newAccount = accounts[0] || '';
        setAccount(newAccount);
        
        // Notify parent component
        if (onAccountChange) {
          onAccountChange(newAccount, network);
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, [network, onAccountChange]);

  return (
    <div className="wallet-connect">
      {account ? (
        <div className="flex flex-col md:flex-row items-center gap-3">
          <p>Connected: {account.substring(0, 6)}...{account.substring(38)}</p>
          <p>Network: {network}</p>
          <button 
            onClick={disconnectWallet}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button 
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}