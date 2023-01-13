# ZK Wordle

This project presents a zero-knowledge version of the popular word guessing game called Wordle. 

# Wordle in a nutshell

Wordle is a game where a player is presented with a hidden random word and has a fixed number of attempts to successfully guess the hidden word. On each attempt, the player is given a clue to let them know if the letters of the word they're guessing match up with those of the real word. More info on how it works here: https://youtu.be/cGLL6i39_50 

# Problems / Loopholes with current Wordle Implementations

- Players must trust that game master does not cheat them by not changing their word during gameplay
- Players must also trust that the clue being provided by the game master is right. 

# Goal

As a ZK game master, the goal is to convert this game from a trusted setup to a completely trustless setup using ZK and blockchain technologies (solidity, circom and snarkJS).
- By Merkilizing the solution and storing on chain, the player can be sure that game master will not switch up word during gameplay.
- By providing a ZK proof of the clue, game master can prove to player that clue is right without having to reveal the solution in the process.

# Assumptions, constraints and changes to original game that have been made in this POC:

- Each game consists of only 4 letter words. 
- Clue provided tells user whether the letters in their guess is in the right place or not.

# Usage
```bash
# Clone the repo
git clone https://github.com/opaninakuffo/zkWordle.git

# Install packages
yarn install

# Perform powers of tau ceremony
yarn run ptau

# Compile circom cirtuits
yarn run compile-circuits

# Generate Solidity verifier
yarn run setup

# Apply migrations to db
yarn run migrate-db

# Deploy game and verifier contracts to chain
yarn run deploy-contracts

# Run development server
yarn run dev
```

**BEWARE**

**Whiles running locally access the application from http://127.0.0.1:3000/ instead of http://localhost:3000/ else the api calls would not work since express serving both front and back end concurrently**
