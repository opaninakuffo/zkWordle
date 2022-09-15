const BigNumber = require('ethers').BigNumber
const randomBytes = require('ethers').utils.randomBytes
const poseidon = require("circomlibjs").poseidon
const IncrementalMerkleTree = require('@zk-kit/incremental-merkle-tree').IncrementalMerkleTree

const zk = require('@zk-kit/incremental-merkle-tree')
zk.IncrementalMerkleTree

const crypto = require('crypto');

module.exports = {
  generateRandomNumber: (numOfBytes=31) => {
    return BigNumber.from(randomBytes(numOfBytes)).toBigInt()
  },

  // Creates and returns merkle tree for game
  setupMerkleTree: (solution, gameIdentifier) => {
    const hashedSolution = []
    const tree = new IncrementalMerkleTree(poseidon, 2, BigInt(0), 2) // Binary tree.
    solution = solution.split('');
    for (let i = 0; i < solution.length; i++) {
      hashedSolution[i] = generateCommitment(hashInput(solution[i]), gameIdentifier)
      tree.insert(hashedSolution[i])
    }
    return tree
  },

  saveTreeToDB: (tree) => {
    stringTree = JSON.stringify(tree, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value // return everything else unchanged
    );

    // insert string version to db (stringTree, root)

    return stringTree
  },

  getTree: (root, tree) => {
    merkleTree = JSON.parse(tree, (key, value) =>
    typeof value === 'string'
        ? BigNumber.from(value).toBigInt()
        : value // return everything else unchanged
    );
    merkleTree._hash = poseidon

    return merkleTree
  },

  generateGuessProofs: (tree, guess, gameIdentifier) => {
    let proofs = []
    for (let i = 0; i < tree.leaves.length; i++) {
      const proof = tree.createProof(tree.indexOf(tree.leaves[i]))
      proof.leaf = generateCommitment(hashInput(guess[i]), gameIdentifier)
      proofs[i] = proof
    }
    return proofs
  },

  generateGuessProofs1: (tree, guess, gameIdentifier) => {
    let proofs = []
    for (let i = 0; i < tree._depth ** 2; i++) {
      const leaf = generateCommitment(hashInput(guess[i]), gameIdentifier)
      proofs[i] = createMerkleTreeProof(i, leaf, tree._depth, tree._arity, tree._nodes, tree._zeroes, tree._root)
    }
    return proofs
  },

  generateClue: (tree, gameIdentifier, guess) => {
    const proofs = generateGuessProofs1(tree, guess, gameIdentifier)
    
    let clue = []
    for (let i = 0; i < proofs.length; i++) {
      const verified = verifyProof(proofs[i], tree._hash)
      clue[i] = BigInt(verified)
    }
    return clue
  },
  hashInput: (input) => {
    return BigInt("0x" + crypto.createHash('sha256').update(input).digest('hex'))
  }
}


const generateCommitment = (input, gameIndentifier) => {
  return poseidon([input, gameIndentifier])
}

const hashInput = (input) => {
  return BigInt("0x" + crypto.createHash('sha256').update(input).digest('hex'))
}

function createMerkleTreeProof(index, leaf, depth, arity, nodes, zeroes, root) {
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

function checkParameter(value, name) {
  var types = [];
  for (var _i = 2; _i < arguments.length; _i++) {
      types[_i - 2] = arguments[_i];
  }
  if (value === undefined) {
      throw new TypeError("Parameter '".concat(name, "' is not defined"));
  }
  if (!types.includes(typeof value)) {
      throw new TypeError("Parameter '".concat(name, "' is none of these types: ").concat(types.join(", ")));
  }
}

const generateGuessProofs = (tree, guess, gameIdentifier) => {
  let proofs = []
  for (let i = 0; i < tree.leaves.length; i++) {
    const proof = tree.createProof(tree.indexOf(tree.leaves[i]))
    proof.leaf = generateCommitment(hashInput(guess[i]), gameIdentifier)
    proofs[i] = proof
  }
  return proofs
}

const generateGuessProofs1 = (tree, guess, gameIdentifier) => {
  let proofs = []
  for (let i = 0; i < tree._depth ** 2; i++) {
    const leaf = generateCommitment(hashInput(guess[i]), gameIdentifier)
    proofs[i] = createMerkleTreeProof(i, leaf, tree._depth, tree._arity, tree._nodes, tree._zeroes, tree._root)
  }
  return proofs
}

function verifyProof(proof, hash) {
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