import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "", // Sepolia RPC URL from .env
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // Wallet private key
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "", // Etherscan API key for verification
  },
};

export default config;
