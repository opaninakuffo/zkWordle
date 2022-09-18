pragma circom 2.0.8;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "./tree.circom";

template CalculateCommitment() {
    signal input letter;
    signal input gameIdentifier;

    signal output out;

    component poseidon = Poseidon(2);

    poseidon.inputs[0] <== letter;
    poseidon.inputs[1] <== gameIdentifier;

    out <== poseidon.out;
}

template WordleSemaphore(nLevels, letterCount) {
    signal input letters[letterCount];
    signal input gameIdentifier;
    signal input treePathIndices[letterCount][nLevels];
    signal input treeSiblings[letterCount][nLevels];
    signal input clue[letterCount];
    signal input root;

    component calculateCommitment[letterCount];
    component inclusionProof[letterCount];
    component isEq[letterCount];

    for(var i = 0; i < letterCount; i++) {

      calculateCommitment[i] = CalculateCommitment();
      inclusionProof[i] = MerkleTreeInclusionProof(nLevels);
      isEq[i] = IsEqual(); 

      calculateCommitment[i].letter <== letters[i];
      calculateCommitment[i].gameIdentifier <== gameIdentifier;

      inclusionProof[i].leaf <== calculateCommitment[i].out;

      for (var j = 0; j < nLevels; j++) {
          inclusionProof[i].siblings[j] <== treeSiblings[i][j];
          inclusionProof[i].pathIndices[j] <== treePathIndices[i][j];
      }

      isEq[i].in[0] <== root;
      isEq[i].in[1] <== inclusionProof[i].root;

      // Binding constraint
      clue[i] === isEq[i].out;
    }
}

component main { public [letters, clue, root] } = WordleSemaphore(2, 4);