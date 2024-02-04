const hre = require("hardhat");
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const main = async() => {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = await deployer.getChainId();

  console.log("Deploying contracts with the account:", deployer.address); 
  console.log("Chain ID:", chainId.toString());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the Clue Veriffier contract
  const ClueVerifier = await hre.ethers.getContractFactory("ClueVerifier");
  const clueVerifier = await ClueVerifier.deploy();
  const clueVerifierAddress = clueVerifier.address;
  console.log("Clue Verifier On Chain Address:", clueVerifier.address);
  await clueVerifier.deployTransaction.wait();

  // Deploy the Wordle contract
  const Wordle = await hre.ethers.getContractFactory("Wordle");
  const wordle = await Wordle.deploy(clueVerifierAddress);

  console.log("Wordle On Chain Address:", wordle.address);

  // Store wordle on chain address in db
  await prisma.contract.upsert({
    where: {
      name: 'wordle',
    },
    update: {
      address: wordle.address,
      chainId: chainId.toString()
    },
    create: {
      name: "wordle",
      address: wordle.address,
      chainId: chainId.toString()
    },
  })

  await prisma.contract.upsert({
    where: {
      name: 'clueVerifier',
    },
    update: {
      address: clueVerifier.address,
      chainId: chainId.toString()
    },
    create: {
      name: "clueVerifier",
      address: clueVerifier.address,
      chainId: chainId.toString()
    },
  })
  console.log("Successfully stored Clue Verifier and Wordle Addresses in DB");
}

main()
  .then(async () => {
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
