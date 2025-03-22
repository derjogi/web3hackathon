import { ethers } from 'ethers';

// Standard ERC-20 ABI (only the functions we need)
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

export async function transferNZDD(recipientAddress, amount) {
  try {
    // Check if a wallet is installed
    if (!window.ethereum) {
      throw new Error("Please install a Web3 wallet to make transactions");
    }

    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const userAddress = accounts[0];
    console.log("User address:", userAddress);
    
    // Create a provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // NZDD token contract address
    const nzddTokenAddress = process.env.NEXT_PUBLIC_NZDD_TOKEN_ADDRESS;
    const nzddContract = new ethers.Contract(nzddTokenAddress, ERC20_ABI, signer);
    const decimals = await nzddContract.decimals();
    const amountInTokenUnits = ethers.utils.parseUnits(amount.toString(), decimals);
    
    // Check if user has enough balance
    const balance = await nzddContract.balanceOf(userAddress);
    if (balance.lt(amountInTokenUnits)) {
      throw new Error("Insufficient NZDD balance");
    }
    
    // Execute the transfer
    const transaction = await nzddContract.transfer(recipientAddress, amountInTokenUnits);
    
    // Wait for transaction to be mined
    const receipt = await transaction.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash
    };
  } catch (error) {
    console.error("Error transferring NZDD:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
