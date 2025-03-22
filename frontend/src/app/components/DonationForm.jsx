'use client'
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnect from './WalletConnect';

export default function DecentralizedGovernment() {
  const [currentBalance, setCurrentBalance] = useState(100);
  const [totalDonation, setTotalDonation] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [cart, setCart] = useState({});
  const [account, setAccount] = useState('');
  const [network, setNetwork] = useState('');
  const [ethBalance, setEthBalance] = useState(0);
  const [teams, setTeams] = useState([
    { name: "Shadow", wallet: "0x9d8F53ecaDe1d20B7f5fD160A9D114516d1Ed63d" },
    { name: "Dan", wallet: "junglanml.eth" },
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamWallet, setNewTeamWallet] = useState('');

  useEffect(() => {
    calculateAmounts();
  }, [totalDonation]);

  // Handle account changes from WalletConnect component
  const handleAccountChange = async (newAccount, newNetwork) => {
    setAccount(newAccount);
    setNetwork(newNetwork);
    
    if (newAccount) {
      await getWalletBalance(newAccount);
    } else {
      setEthBalance(0);
    }
  };



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

    // Modify the addTransaction function to include transaction hash:
  const addTransaction = (teamName, amount, teamWallet, transactionHash = null) => {
    const transaction = {
      teamName: teamName,
      amount: amount,
      teamWallet: teamWallet,
      timestamp: new Date().toLocaleString(),
      transactionHash: transactionHash
    };
    
    setTransactions(prev => [transaction, ...prev]);
  };  

  const submitVotes = async () => {
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
    let confirmMessage = "Are you sure you want to submit the following NZDD?\n\n";
    let hasVotes = false;
    let transferPromises = [];
  
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
      // Set a loading state if you want to show a spinner
      // setIsLoading(true);
      
      try {
        // Process each donation as a separate transaction
        for (const [teamIndex, amount] of Object.entries(cart)) {
          if (amount > 0) {
            const team = teams[teamIndex];
            
            // Call transferNZDD for each team with a donation
            const result = await transferNZDD(team.wallet, amount);
            
            if (result.success) {
              // Add successful transaction to history
              addTransaction(team.name, amount, team.wallet, result.transactionHash);
            } else {
              // Handle failed transaction
              setErrorMessage(`Failed to transfer to ${team.name}: ${result.error}`);
              // You might want to break the loop or continue based on your requirements
            }
          }
        }
        
        // Update balance after all transactions
        setCurrentBalance(prev => prev - totalAmount);
        resetCart();
        
        alert(`Successfully submitted NZDD totaling ${totalAmount.toFixed(2)} NZDD!`);
      } catch (error) {
        console.error("Error processing donations:", error);
        setErrorMessage(`Error processing donations: ${error.message}`);
      } finally {
        // Clear loading state if you added one
        // setIsLoading(false);
      }
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

  const handleTeamNameChange = (index, newName) => {
    const updatedTeams = [...teams];
    updatedTeams[index].name = newName;
    setTeams(updatedTeams);
  };

  const handleWalletChange = (index, newWallet) => {
    const updatedTeams = [...teams];
    updatedTeams[index].wallet = newWallet;
    setTeams(updatedTeams);
  };

  const addNewTeam = () => {
    if (newTeamName.trim() === '' || newTeamWallet.trim() === '') {
      alert('Please enter both team name and wallet address');
      return;
    }
    
    setTeams([...teams, { name: newTeamName, wallet: newTeamWallet }]);
    setNewTeamName('');
    setNewTeamWallet('');
  };

  const removeTeam = (index) => {
    if (confirm(`Are you sure you want to remove ${teams[index].name}?`)) {
      const updatedTeams = teams.filter((_, i) => i !== index);
      setTeams(updatedTeams);
      
      // Update cart to remove the deleted team
      const updatedCart = { ...cart };
      delete updatedCart[index];
      
      // Reindex the cart keys
      const newCart = {};
      Object.entries(updatedCart).forEach(([key, value]) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          newCart[keyNum - 1] = value;
        } else {
          newCart[key] = value;
        }
      });
      
      setCart(newCart);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
      <div className="mb-8 pb-4 border-b-2 border-gray-200 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-600">Hackathon People's Choice</h1>
        <div className="wallet-connect-container">
          <WalletConnect onAccountChange={handleAccountChange} />
        </div>
      </div>

      {account && (
        <div className="mb-8 p-5 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span>Connected Address:</span>
            <span className="font-bold text-blue-600">{`${account.substring(0, 6)}...${account.substring(38)}`}</span>
          </div>
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
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-600">Teams Management</h2>
          <button 
            onClick={toggleEditMode}
            className={`px-4 py-2 rounded-lg text-white font-medium ${isEditMode ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isEditMode ? 'Done Editing' : 'Edit Teams'}
          </button>
        </div>

        {isEditMode && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Add New Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Team Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Wallet Address</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg" 
                  value={newTeamWallet}
                  onChange={(e) => setNewTeamWallet(e.target.value)}
                  placeholder="Enter wallet address"
                />
              </div>
            </div>
            <button 
              onClick={addNewTeam}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Add Team
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full mb-5">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left border-b-2 border-gray-200">Team</th>
                <th className="p-3 text-left border-b-2 border-gray-200">Wallet</th>
                {isEditMode && <th className="p-3 text-left border-b-2 border-gray-200">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="p-3">
                    {isEditMode ? (
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded" 
                        value={team.name}
                        onChange={(e) => handleTeamNameChange(index, e.target.value)}
                      />
                    ) : (
                      team.name
                    )}
                  </td>
                  <td className="p-3">
                    {isEditMode ? (
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded" 
                        value={team.wallet}
                        onChange={(e) => handleWalletChange(index, e.target.value)}
                      />
                    ) : (
                      team.wallet
                    )}
                  </td>
                  {isEditMode && (
                    <td className="p-3">
                      <button 
                        onClick={() => removeTeam(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-blue-600 mb-5 text-center">Donation</h2>
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
          Submit NZDD
        </button>
      </div>

      <div className="mt-8 pt-5 border-t border-gray-200">
  <h3 className="text-lg font-semibold text-blue-600 mb-4">Transaction History</h3>
  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
    {transactions.length === 0 ? (
      <div className="p-3 border-b border-gray-100">No transactions yet</div>
    ) : (
      transactions.map((transaction, index) => (
        <div key={index} className="flex flex-col p-3 border-b border-gray-100 last:border-b-0">
          <div className="flex justify-between">
            <span>{transaction.timestamp} - Voted for {transaction.teamName} ({transaction.teamWallet})</span>
            <span className="font-bold text-red-500">-{transaction.amount.toFixed(2)} NZDD</span>
          </div>
          {transaction.transactionHash && (
            <div className="text-sm text-gray-500 mt-1">
              TX: <a 
                href={`https://sepolia.etherscan.io/tx/${transaction.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {transaction.transactionHash.substring(0, 10)}...{transaction.transactionHash.substring(transaction.transactionHash.length - 6)}
              </a>
            </div>
          )}
        </div>
      ))
    )}
  </div>
</div>

    </div>
  );
}
