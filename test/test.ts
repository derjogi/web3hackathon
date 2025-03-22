import { expect } from "chai";
import { ethers } from "hardhat";
import { GuessAndWin } from "../typechain-types";

describe("GuessAndWin", function () {
  let contract: GuessAndWin;
  let owner: any, player1: any, player2: any;
  const secretNumber = 42;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const GuessAndWin = await ethers.getContractFactory("GuessAndWin");
    contract = (await GuessAndWin.deploy(secretNumber, {
      value: ethers.parseEther("1"),
    })) as GuessAndWin;
    await contract.waitForDeployment();
  });

  it("Should allow a player to make a guess", async function () {
    await expect(contract.connect(player1).makeGuess(10))
      .to.emit(contract, "GuessMade")
      .withArgs(player1.address, 10);
  });

  it("Should change address to win true and send 0.1 eth", async function () {
    const prizeAmount = ethers.parseEther("0.1");

    await expect(contract.connect(player1).makeGuess(secretNumber))
      .to.emit(contract, "PrizeClaimed")
      .withArgs(player1.address, prizeAmount);

    expect(await contract.winners(player1.address)).to.equal(true);
  });

  it("Should not allow a player to make a guess if they have already won", async function () {
    await contract.connect(player1).makeGuess(secretNumber);

    await expect(contract.connect(player1).makeGuess(10)).to.be.revertedWith(
      "You have already won"
    );
  });
});
