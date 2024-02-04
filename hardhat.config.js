require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

// private environment information
const { RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env

/**
 * Return a hardhat compiler for a given version
 * @param {string} version - solidity version ex: 0.8.11
 */
 const makeCompiler = (version) => {
  return {
      version,
      settings: {
          optimizer: {
              enabled: true,
              runs: 200,
          },
      },
  }
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [makeCompiler('0.6.11'), makeCompiler('0.8.17')],
  },
  networks: {
    sepolia: {
      url: RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY]
    }
  }
};
