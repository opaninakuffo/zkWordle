#!/bin/sh
set -e

# --------------------------------------------------------------------------------
# Phase 2
# ... circuit-specific stuff

# if zk/zkey does not exist, make folder
[ -d zk/zkey ] || mkdir zk/zkey

# Compile circuits
# circom zk/circuits/wordle.circom -o zk/ --r1cs --wasm

#Setup
yarn snarkjs groth16 setup zk/wordle.r1cs zk/ptau/pot12_final.ptau zk/zkey/wordle_final.zkey

# # Generate reference zkey
yarn snarkjs zkey new zk/wordle.r1cs zk/ptau/pot12_final.ptau zk/zkey/wordle_0000.zkey

# # Ceremony just like before but for zkey this time
yarn snarkjs zkey contribute zk/zkey/wordle_0000.zkey zk/zkey/wordle_0001.zkey \
    --name="First wordle contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
yarn snarkjs zkey contribute zk/zkey/wordle_0001.zkey zk/zkey/wordle_0002.zkey \
    --name="Second wordle contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
yarn snarkjs zkey contribute zk/zkey/wordle_0002.zkey zk/zkey/wordle_0003.zkey \
    --name="Third worlde contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"

# #  Verify zkey
yarn snarkjs zkey verify zk/wordle.r1cs zk/ptau/pot12_final.ptau zk/zkey/wordle_0003.zkey

# # Apply random beacon as before
yarn snarkjs zkey beacon zk/zkey/wordle_0003.zkey zk/zkey/wordle_final.zkey \
    0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Wordle FinalBeacon phase2"

# # Optional: verify final zkey
yarn snarkjs zkey verify zk/wordle.r1cs zk/ptau/pot12_final.ptau zk/zkey/wordle_final.zkey

# # Export verification key
yarn snarkjs zkey export verificationkey zk/zkey/wordle_final.zkey zk/wordle_verification_key.json

# Export clue verifier with updated name and solidity version
yarn snarkjs zkey export solidityverifier zk/zkey/wordle_final.zkey contracts/ClueVerifier.sol
# sed -i'.bak' 's/0.6.11;/0.8.11;/g' contracts/ClueVerifier.sol
sed -i'.bak' 's/contract Verifier/contract ClueVerifier/g' contracts/ClueVerifier.sol
rm contracts/*.bak