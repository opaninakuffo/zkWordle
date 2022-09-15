require("hardhat-circom");

// private environment information
// const { INFURA, MNEMONIC, ETHERSCAN, POLYGONSCAN } = process.env

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
    compilers: [makeCompiler('0.6.11'), makeCompiler('0.8.17')]
  },
  circom: {
    inputBasePath: "./zk/circuits/",
    ptau: "https://hermezptau.blob.core.windows.net/ptau/powersOfTau28_hez_final_12.ptau",
    circuits: [
      {
        name: "wordle"
      },
      {
        name: "tree"
      }
    ],
  },
};
