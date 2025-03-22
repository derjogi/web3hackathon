import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GuessAndWinModule = buildModule("GuessAndWinModule", (m) => {
  const secretNumber = 100; // Set your desired secret number

  const guessAndWin = m.contract("GuessAndWin", [secretNumber]);

  return { guessAndWin };
});

export default GuessAndWinModule;
