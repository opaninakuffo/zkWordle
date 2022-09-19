const hre = require("hardhat");
const { assert } = require("chai");

describe("wordle circuit", () => {
  let circuit;
  let gameIdentifier = 29150614749387184043387219971263557698760458196189935422933546578031225912n;

  const sampleInput = {
    letters: [
      6593403479551632167340824945835173196808254996897114921429971060245653209894n,
      46035725389219043963032057611081995832299103232747348342053558695288603472594n,
      58950432432975814727330150495812516852205624354772471794033072556055009430906n,
      11159837076962333191061022530120819165602563890003519397264714176721379981540n
    ],
    gameIdentifier,
    clue: [1, 1, 0, 1],
    treePathIndices: [ [ 0, 0 ], [ 1, 0 ], [ 0, 1 ], [ 1, 1 ] ],
    root: 3041343298739618533229697001114055720865909125606041379044511250045069744721n,
    treeSiblings: [
      [
        [6438145220753599037921496404976199313354022032769466833828671866998453617002n], [3689099264412458026559344789293544897340493300599970565399684827290423207314n]
      ],
      [
        [6336595030309003771468332302172289593633656346155580397732246389155833704162n], [3689099264412458026559344789293544897340493300599970565399684827290423207314n]
      ],
      [
        [16493356764583528002566209412635009560598257464318040891756057800683405596375n], [21027440488223398156449368739108363353737665007011224647097723070219101813289n]
      ],
      [
        [6680258049916053286750756082476287578337378020138787911284705660474227620336n], [21027440488223398156449368739108363353737665007011224647097723070219101813289n]
      ]
    ]
  };
  const sanityCheck = true;

  before(async () => {
    circuit = await hre.circuitTest.setup("wordle");
  });

  it("produces a witness with valid constraints", async () => {
    const witness = await circuit.calculateWitness(sampleInput, sanityCheck);
    await circuit.checkConstraints(witness);
  });

  it("has expected witness values", async () => {
    const witness = await circuit.calculateLabeledWitness(
      sampleInput,
      sanityCheck
    );
    assert.propertyVal(witness, "main.letters", sampleInput.letterIdentifier);
    assert.propertyVal(witness, "main.gameIdentifier", sampleInput.gameIdentifier);
    assert.propertyVal(witness, "main.treePathIndices", sampleInput.treePathIndices);
    assert.propertyVal(witness, "main.treeSiblings", sampleInput.treeSiblings);
    assert.propertyVal(witness, "main.clue", sampleInput.clue);
    assert.propertyVal(witness, "main.root", sampleInput.root);
  });
});
