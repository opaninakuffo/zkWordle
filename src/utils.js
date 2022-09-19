const BigNumber = require('ethers').BigNumber
const randomBytes = require('ethers').utils.randomBytes
const poseidon = require("circomlibjs").poseidon
const IncrementalMerkleTree = require('@zk-kit/incremental-merkle-tree').IncrementalMerkleTree
const snarkjs = require("snarkjs");
const path = require("path");
const { PrismaClient } = require('@prisma/client');
const { exit } = require('process');
const words = require('./words').words

const prisma = new PrismaClient()

module.exports = {
  setupGame: async (playerAddress, numberOfGuesses) => {
    // randomly pick word from list of words
    const solution = words[Math.floor(Math.random() * words.length)];
    console.log("word:", solution);
    // generate random identifier for game
    const gameIdentifier = generateRandomNumber();
  
    // set up merkle tree based on solution and identifier
    const tree = setupMerkleTree(solution, gameIdentifier)
    const stringTree = stringyTree(tree)

    // store id, identifier, tree, root, and number of tries left in db
    const game = await prisma.game.create({
      data: {
        root: tree.root.toString(),
        tree: stringTree,
        identifier: gameIdentifier.toString(),
        playerAddress,
        guessesLeft: numberOfGuesses,
      }
    })

    const wordleContract = await prisma.contract.findUnique({
      where: {
        name: 'wordle',
      }
    });

    const verifierContract = await prisma.contract.findUnique({
      where: {
        name: 'clueVerifier',
      }
    });

    return {
      id: game.id,
      root: BigNumber.from(game.root).toHexString(),
      playerAddress,
      timestamp: Math.round(game.createdAt.getTime() / 1000),
      wordleContractAddress: wordleContract.address,
      verifierContractAddress: verifierContract.address
    }
  },

  playerGuess: async (id, guess, playerAddress) => {
    const game = await prisma.game.findUnique({
      where: {
        id: Number(id),
      }
    })

    if (game.playerAddress !== playerAddress) {
      throw Error("Not authorized to play this game.")
    }

    // if (!words.includes(guess)) {
    //   throw Error("Word not in list!");
    // }

    if (game.guessesLeft > 0 && game.status != 'won') {
      const tree = jsonifyTree(game.tree);

      const gameIdentifier = BigInt(game.identifier);
      const clue = generateClue(tree, gameIdentifier, guess);
      const circuitInput = createInput(guess, gameIdentifier, clue, tree);
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInput,
        path.join(__dirname, "..", "zk", "wordle_js", "wordle.wasm"),
        path.join(__dirname, "..", "zk", "zkey", "wordle_final.zkey"),
      );

      const solidityCallData = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
      const a = JSON.parse(solidityCallData.slice(0, 140))
      const b = JSON.parse(solidityCallData.slice(141, 424))
      const c = JSON.parse(solidityCallData.slice(425, 565)) 
      const input = JSON.parse(solidityCallData.slice(566))

      let updatedGame;
      const guessesLeft = game.guessesLeft - 1;
      if (clue[0] == 1 && clue[1] == 1 && clue[2] == 1 && clue[3] == 1) {
        updatedGame = await prisma.game.update({
          where: {
            id: Number(id),
          },
          data: {
            guessesLeft: 0,
            status: "won"
          },
        })
      } else {
        if (guessesLeft == 0) {
          updatedGame = await prisma.game.update({
            where: {
              id: Number(id),
            },
            data: {
              guessesLeft,
              status: "lost"
            },
          })
        } else {
          updatedGame = await prisma.game.update({
            where: {
              id: Number(id),
            },
            data: {
              guessesLeft,
            },
          })
        }
      }


      return {
        id: game.id,
        clue, 
        guessesLeft: updatedGame.guessesLeft,
        status: updatedGame.status,
        solidityCallData: {
          a,
          b,
          c,
          input
        }
      }
    } else {
      let errors = [];

      if (game.status == 'won') {
        errors.push("already won");
      }

      if (game.guessesLeft <= 0) {
        errors.push("no more guesses left");
      }

      throw Error(errors.join(' and '));
    }
  },

  getGame: async (id) => {
    return await prisma.game.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        root: true,
        guessesLeft: true,
        createdAt: true,
        status: true,
        playerAddress: true,
      }
    })
  },

  deleteGame: async (id) => {
    return await prisma.game.delete({
      where: {
        id: Number(id),
      }
    })
  },
}

const generateRandomNumber = (numOfBytes=31) => {
  return BigNumber.from(randomBytes(numOfBytes)).toBigInt()
}

const setupMerkleTree = (solution, gameIdentifier) => {
    const hashedSolution = []
    const tree = new IncrementalMerkleTree(poseidon, 2, BigInt(0), 2) // Binary tree.
    for (let i = 0; i < solution.length; i++) {
      hashedSolution[i] = generateCommitment(solution.charCodeAt(i), gameIdentifier)
      tree.insert(hashedSolution[i])
    }
    return tree
}

const generateCommitment = (input, gameIndentifier) => {
  return poseidon([input, gameIndentifier])
}

const generateGuessProofs = (tree, guess, gameIdentifier) => {
  let proofs = []
  for (let i = 0; i < tree._depth ** 2; i++) {
    const leaf = generateCommitment(guess.charCodeAt(i), gameIdentifier)
    proofs[i] = createMerkleTreeProof(i, leaf, tree._depth, tree._arity, tree._nodes, tree._zeroes, tree._root)
  }
  return proofs
}

const generateClue = (tree, gameIdentifier, guess) => {
  const proofs = generateGuessProofs(tree, guess, gameIdentifier)
  
  let clue = []
  for (let i = 0; i < proofs.length; i++) {
    const verified = verifyProof(proofs[i], tree._hash)
    clue[i] = Number(verified)
  }
  return clue
}

const createInput = (guess, gameIdentifier, clue, tree) => {
  let guessProofs = generateGuessProofs(tree, guess, gameIdentifier)

  let letters = [];
  let treePathIndices = [];
  let treeSiblings = [];
  for (let i = 0; i < guess.length; i++) {
    letters.push(guess.charCodeAt(i))
  }

  for (const proof of guessProofs) {
    treePathIndices.push(proof.pathIndices)
    treeSiblings.push(proof.siblings)
  }
  
  return {  
    letters,
    gameIdentifier,
    clue,
    treePathIndices,
    treeSiblings,
    root: tree._root
  }
}

const createMerkleTreeProof = (index, leaf, depth, arity, nodes, zeroes, root) => {
  checkParameter(index, "index", "number");
  if (index < 0 || index >= nodes[0].length) {
      throw new Error("The leaf does not exist in this tree");
  }
  var siblings = [];
  var pathIndices = [];
  for (var level = 0; level < depth; level += 1) {
      var position = index % arity;
      var levelStartIndex = index - position;
      var levelEndIndex = levelStartIndex + arity;
      pathIndices[level] = position;
      siblings[level] = [];
      for (var i = levelStartIndex; i < levelEndIndex; i += 1) {
          if (i !== index) {
              if (i < nodes[level].length) {
                  siblings[level].push(nodes[level][i]);
              }
              else {
                  siblings[level].push(zeroes[level]);
              }
          }
      }
      index = Math.floor(index / arity);
  }
  return { root: root, leaf, pathIndices: pathIndices, siblings: siblings };
}

const checkParameter = (value, name, ...args) => {
  var types = [];
  for (var _i = 0; _i < args.length; _i++) {
      types[_i] = args[_i];
  }
  if (value === undefined) {
      throw new TypeError("Parameter '".concat(name, "' is not defined"));
  }
  if (!types.includes(typeof value)) {
      throw new TypeError("Parameter '".concat(name, "' is none of these types: ").concat(types.join(", ")));
  }
}

const verifyProof = (proof, hash) => {
  checkParameter(proof, "proof", "object");
  checkParameter(proof.root, "proof.root", "number", "string", "bigint");
  checkParameter(proof.leaf, "proof.leaf", "number", "string", "bigint");
  checkParameter(proof.siblings, "proof.siblings", "object");
  checkParameter(proof.pathIndices, "proof.pathElements", "object");
  var node = proof.leaf;
  for (var i = 0; i < proof.siblings.length; i += 1) {
      var children = proof.siblings[i].slice();
      children.splice(proof.pathIndices[i], 0, node);
      node = hash(children);
  }
  return proof.root === node;
}

const stringyTree = (tree) => {
  const stringTree = JSON.stringify(tree, (key, value) =>
      typeof value === 'bigint'
          ? value.toString()
          : value // return everything else unchanged
  );
  return stringTree
}

const jsonifyTree = (tree) => {
  const merkleTree = JSON.parse(tree, (key, value) =>
  typeof value === 'string'
      ? BigNumber.from(value).toBigInt()
      : value // return everything else unchanged
  );
  merkleTree._hash = poseidon

  return merkleTree
}