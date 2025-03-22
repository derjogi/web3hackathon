'use client'
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function DecentralizedGovernment() {
  const [currentBalance, setCurrentBalance] = useState(100);
  const [totalDonation, setTotalDonation] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [cart, setCart] = useState({});
  const [account, setAccount] = useState('');
  const [network, setNetwork] = useState('');
  const [ethBalance, setEthBalance] = useState(0);

  const teams = [
    { name: "Cats Team", wallet: "xo...73" },
    { name: "Dogs Team", wallet: "xo...72" },
    { name: "Apes Team", wallet: "xo...55" },
    { name: "Kiwi Team", wallet: "xo...77" },
    { name: "Tuatara Team", wallet: "xo...123" }
  ];

  useEffect(() => {
    calculateAmounts();
  }, [totalDonation]);

  useEffect(() => {
    // Check if wallet is already connected
    checkWalletConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          getWalletBalance(accounts[0]);
        } else {
          setAccount('');
          setEthBalance(0);
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  async function checkWalletConnection() {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const network = await provider.getNetwork();
          setNetwork(network.name);
          getWalletBalance(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  }

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        
        setAccount(accounts[0]);
        setNetwork(network.name);
        getWalletBalance(accounts[0]);
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      alert("Please install MetaMask!");
    }
  }

  async function getWalletBalance(address) {
    if (window.ethereum && address) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(address);
        const etherBalance = ethers.utils.formatEther(balance);
        setEthBalance(parseFloat(etherBalance));
        setCurrentBalance(parseFloat(etherBalance)); // Update current balance with ETH balance
      } catch (error) {
        console.error("Error getting wallet balance:", error);
      }
    }
  }

  const calculateAmounts = () => {
    // Calculate total likes
    let totalLikes = 0;
    const likesInputs = document.querySelectorAll('.likes-input');

    likesInputs.forEach(input => {
      const likes = parseInt(input.value) || 0;
      totalLikes += likes;
    });

    // If no likes, reset all amounts
    if (totalLikes === 0) {
      const newCart = {};
      likesInputs.forEach((input, index) => {
        newCart[index] = 0;
      });
      setCart(newCart);
      return;
    }

    // Distribute total donation based on likes proportion
    let calculatedTotal = 0;
    const newCart = {};

    likesInputs.forEach((input, index) => {
      const likes = parseInt(input.value) || 0;
      const proportion = likes / totalLikes;
      const amount = totalDonation * proportion;
      const roundedAmount = Math.round(amount * 100) / 100; // Round to 2 decimal places

      newCart[index] = roundedAmount;
      calculatedTotal += roundedAmount;
    });

    setCart(newCart);

    // Validate if the total donation is valid
    validateDonation(calculatedTotal);
  };

  const validateDonation = (total) => {
    if (total <= 0) {
      setErrorMessage("Please add likes to at least one team.");
    } else if (total > currentBalance) {
      setErrorMessage("Total donation exceeds your current balance.");
    } else {
      setErrorMessage("");
    }
  };

  const addTransaction = (teamName, amount, teamWallet) => {
    const transaction = {
      teamName: teamName,
      amount: amount,
      teamWallet: teamWallet,
      timestamp: new Date().toLocaleString()
    };

    setTransactions(prev => [transaction, ...prev]);
  };

  const submitVotes = () => {
    const totalAmount = Object.values(cart).reduce((sum, amount) => sum + amount, 0);

    if (totalAmount <= 0) {
      setErrorMessage("Please add likes to at least one team.");
      return;
    }

    if (totalAmount > currentBalance) {
      setErrorMessage("Total donation exceeds your current balance.");
      return;
    }

    // Build confirmation message
    let confirmMessage = "Are you sure you want to submit the following votes?\n\n";
    let hasVotes = false;

    for (const [teamIndex, amount] of Object.entries(cart)) {
      if (amount > 0) {
        const team = teams[teamIndex];
        const likesInput = document.querySelectorAll('.likes-input')[teamIndex];
        confirmMessage += `${team.name}: ${amount.toFixed(2)} NZDD (${likesInput.value} likes)\n`;
        hasVotes = true;
      }
    }

    confirmMessage += `\nTotal: ${totalAmount.toFixed(2)} NZDD`;

    if (!hasVotes) {
      setErrorMessage("Please add likes to at least one team.");
      return;
    }

    if (confirm(confirmMessage)) {
      for (const [teamIndex, amount] of Object.entries(cart)) {
        if (amount > 0) {
          const team = teams[teamIndex];
          addTransaction(team.name, amount, team.wallet);
        }
      }

      setCurrentBalance(prev => prev - totalAmount);
      resetCart();

      alert(`Successfully submitted votes totaling ${totalAmount.toFixed(2)} NZDD!`);
    }
  };

  const resetCart = () => {
    setTotalDonation(0);
    
    const likesInputs = document.querySelectorAll('.likes-input');
    likesInputs.forEach(input => {
      input.value = '0';
    });

    setCart({});
  };

  const handleLikesChange = () => {
    calculateAmounts();
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
      <div className="mb-8 pb-4 border-b-2 border-gray-200">
        <h1 className="text-3xl font-bold text-blue-600 mb-3">Decentralized government documents</h1>
      </div>

      <div className="mb-8 p-5 bg-gray-50 rounded-lg">

        {account ? (
          <>
            <label htmlFor="wallet" className="block mb-1 font-semibold text-gray-600">Wallet Address:</label>
            <input 
              type="text" 
              id="wallet" 
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg text-base" 
              value={account}
              readOnly
            />
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span>Network:</span>
              <span className="font-bold text-blue-600">{network}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span>Current Balance:</span>
              <span className="font-bold text-green-600 transition-colors duration-500">
                {ethBalance.toFixed(4)} ETH
              </span>
            </div>
          </>
        ) : (
          <button 
            onClick={connectWallet}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Connect Wallet
          </button>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-blue-600 mb-5 text-center">Voting Cart</h2>
        {errorMessage && <p className="text-red-500 mb-3 text-sm">{errorMessage}</p>}

        <div className="p-4 mb-5 bg-gray-50 rounded-lg">
          <label htmlFor="totalDonation" className="block mb-2 font-semibold text-gray-600">
            Total Donation Amount (NZDD):
          </label>
          <input 
            type="number" 
            id="totalDonation" 
            className="w-full p-3 border border-gray-300 rounded-lg text-base" 
            value={totalDonation}
            onChange={(e) => setTotalDonation(parseFloat(e.target.value) || 0)}
            min="0" 
            step="0.1" 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full mb-5">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left border-b-2 border-gray-200">Team</th>
                <th className="p-3 text-left border-b-2 border-gray-200">Wallet</th>
                <th className="p-3 text-left border-b-2 border-gray-200">Likes</th>
                <th className="p-3 text-left border-b-2 border-gray-200">Amount (NZDD)</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="p-3">{team.name}</td>
                  <td className="p-3">{team.wallet}</td>
                  <td className="p-3">
                    <input 
                      type="number" 
                      className="likes-input w-16 p-2 border border-gray-300 rounded text-right" 
                      defaultValue="0" 
                      min="0" 
                      step="1" 
                      data-team-index={index}
                      onChange={handleLikesChange}
                    />
                  </td>
                  <td className="p-3 font-semibold text-gray-700">
                    {(cart[index] || 0).toFixed(2)} NZDD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-5 font-semibold text-lg">
          <span>Total Donation:</span>
          <span className="text-red-500">
            {Object.values(cart).reduce((sum, amount) => sum + amount, 0).toFixed(2)} NZDD
          </span>
        </div>

        <button 
          onClick={submitVotes}
          disabled={Object.values(cart).reduce((sum, amount) => sum + amount, 0) <= 0 || 
                   Object.values(cart).reduce((sum, amount) => sum + amount, 0) > currentBalance}
          className={`w-full py-3 px-5 text-white font-bold rounded-lg transition-all ${
            Object.values(cart).reduce((sum, amount) => sum + amount, 0) <= 0 || 
            Object.values(cart).reduce((sum, amount) => sum + amount, 0) > currentBalance
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          Submit Votes
        </button>
      </div>

      <div className="mt-8 pt-5 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-blue-600 mb-4">Transaction History</h3>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
          {transactions.length === 0 ? (
            <div className="p-3 border-b border-gray-100">No transactions yet</div>
          ) : (
            transactions.map((transaction, index) => (
              <div key={index} className="flex justify-between p-3 border-b border-gray-100 last:border-b-0">
                <span>{transaction.timestamp} - Voted for {transaction.teamName} ({transaction.teamWallet})</span>
                <span className="font-bold text-red-500">-{transaction.amount.toFixed(2)} NZDD</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
