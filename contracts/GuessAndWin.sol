// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GuessAndWin {
    uint256 private secretNumber;
    uint256 public maxNumber = 256;
    uint256 public minNumber = 0;
    address public owner;
    uint256 public prizeAmount = 0.1 ether;  // Prize amount set to 0.1 ETH

    mapping (address => bool) public winners;

    event GuessMade(address indexed player, uint256 guess);
    event WinnerDeclared(address indexed winner);
    event PrizeClaimed(address indexed winner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(uint256 _secretNumber) payable {
        require(
            _secretNumber >= minNumber && _secretNumber <= maxNumber,
            "Secret number must be within range"
        );
        secretNumber = _secretNumber;
        owner = msg.sender;
    }

    function setPrizeAmount(uint256 _prizeAmount) external onlyOwner {
        prizeAmount = _prizeAmount;
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function makeGuess(uint256 _guess) external {

        require(winners[msg.sender] == false, "You have already won");

        require(
            _guess >= minNumber && _guess <= maxNumber,
            "Guess must be within range"
        );

        emit GuessMade(msg.sender, _guess);

        if (_guess == secretNumber) {

            winners[msg.sender] = true;

            // Transfer the prize amount (0.1 ETH) to the winner
            payable(msg.sender).transfer(prizeAmount);
            emit WinnerDeclared(msg.sender);
            emit PrizeClaimed(msg.sender, prizeAmount);
        }
    }

    // Allow the contract to accept ETH
    receive() external payable {}
}
