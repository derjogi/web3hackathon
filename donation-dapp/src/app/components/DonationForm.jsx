'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

export default function DonationForm() {
  const [recipients, setRecipients] = useState([
    { name: "Alice", address: "0x123..." },
    { name: "Bob", address: "0x456..." },
    // Add more recipients or fetch from your contract
  ]);
  const [selectedRecipient, setSelectedRecipient] = useState(recipients[0]);
  const [amount, setAmount] = useState("0.01");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  async function donate() {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    
    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Simple direct transfer (for now)
      const tx = await signer.sendTransaction({
        to: selectedRecipient.address,
        value: ethers.utils.parseEther(amount)
      });
      
      setTxHash(tx.hash);
      await tx.wait();
      alert(`Donated ${amount} ETH to ${selectedRecipient.name}!`);
    } catch (error) {
      console.error("Error donating:", error);
      alert("Transaction failed. See console for details.");
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="donation-form p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Make a Donation</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Select Recipient:</label>
        <select 
          className="w-full p-2 border rounded"
          onChange={(e) => {
            const index = parseInt(e.target.value);
            setSelectedRecipient(recipients[index]);
          }}
        >
          {recipients.map((recipient, index) => (
            <option key={index} value={index}>
              {recipient.name} ({recipient.address.substring(0, 6)}...{recipient.address.substring(38)})
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Amount (ETH):</label>
        <input 
          type="number" 
          min="0.001" 
          step="0.001" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <button 
        onClick={donate}
        disabled={isLoading}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full disabled:bg-gray-400"
      >
        {isLoading ? "Processing..." : "Donate"}
      </button>
      
      {txHash && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p>Transaction Hash:</p>
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 break-all"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  );
}

