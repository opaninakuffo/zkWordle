const NUMBER_OF_GUESSES = 6;
const NUMBER_OF_LETTERS = 4;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let id;
let root; 
let wordleContractAddress;
let verifierContractAddress;
let provider;
let signer;
let playerAddress;
let createdAt;
let wordleAbi = [
    "function createGame(uint _id, uint _root, address _player, uint _createdAt)"
]
let verifierAbi = [
    "function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[9] memory input) view returns (bool r)"
]

async function connnectPlayerWallet() {
    const showAccount = document.getElementById("show-account")
    provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner()
    playerAddress = await signer.getAddress();
    showAccount.innerHTML = playerAddress;
}

function initBoard() {
    let board = document.getElementById("game-board");

    for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
        let row = document.createElement("div")
        row.className = "letter-row"
        
        for (let j = 0; j < NUMBER_OF_LETTERS; j++) {
            let box = document.createElement("div")
            box.className = "letter-box"
            row.appendChild(box)
        }

        board.appendChild(row)
    }

    axios({
        method: 'post',
        url: 'http://127.0.0.1:3000/api/game/setup',
        data: {
            playerAddress,
            numberOfGuesses: NUMBER_OF_GUESSES
        }
    })
      .then((response) => {
        let gameInfo = document.getElementById("game-info")

        id = response.data.id
        let para = document.createElement("p");
        para.innerHTML = "Game ID: " + id.toString();
        gameInfo.appendChild(para)

        root = response.data.root
        para = document.createElement("p");
        para.innerHTML = "Game Root: " + root;
        gameInfo.appendChild(para)

        wordleContractAddress = response.data.wordleContractAddress
        para = document.createElement("p");
        para.innerHTML = "Wordle On Chain Address: " + wordleContractAddress;
        gameInfo.appendChild(para)

        verifierContractAddress = response.data.verifierContractAddress
        para = document.createElement("p");
        para.innerHTML = "ZK Verifier Chain Address: " + verifierContractAddress;
        gameInfo.appendChild(para)

        createdAt = response.data.timestamp

        const wordleContract = new ethers.Contract(wordleContractAddress, wordleAbi, signer);
        wordleContract.createGame(id, root, playerAddress, createdAt).then((response) => {
            toastr.success("Successfully logged game on chain. Tx Hash: " + response.hash);
        }).catch(() => {
            axios({
                method: 'delete',
                url: `http://127.0.0.1:3000/api/game/${id}`,
            }).then((response) => {
                toastr.success(response.data)
            }) .catch((error) => {
                toastr.error(error)
            })
        })
      })
      .catch((error) => {
        toastr.error(error.response.data.message)
      })
}

function shadeKeyBoard(letter, color) {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        if (elem.textContent === letter) {
            let oldColor = elem.style.backgroundColor
            if (oldColor === 'green') {
                return
            } 

            elem.style.backgroundColor = color
            break
        }
    }
}

function deleteLetter () {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let box = row.children[nextLetter - 1]
    box.textContent = ""
    box.classList.remove("filled-box")
    currentGuess.pop()
    nextLetter -= 1
}

function checkGuess () {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let guessString = ''

    for (const val of currentGuess) {
        guessString += val
    }

    if (guessString.length != NUMBER_OF_LETTERS) {
        toastr.error("Not enough letters!")
        return
    }

    axios({
        method: 'post',
        url: `http://127.0.0.1:3000/api/game/guess/${id}`,
        data: {
            guess: guessString,
            playerAddress: "0xd033F1e4DdF5E6FD9031504c0f28d3C0aA881e3a"
        }
    })
      .then((response) => {
        const clue = response.data.clue
        guessesRemaining = response.data.guessesLeft

        for (let i = 0; i < NUMBER_OF_LETTERS; i++) {
            let letterColor = ''
            let box = row.children[i]
            let letter = currentGuess[i]
            
            // is letter in the correct guess
            if (clue[i] === 0) {
                letterColor = 'grey'
            } else {
                letterColor = 'green'
            }
    
            let delay = 250 * i
            setTimeout(()=> {
                //flip box
                animateCSS(box, 'flipInX')
                //shade box
                box.style.backgroundColor = letterColor
                shadeKeyBoard(letter, letterColor)
            }, delay)
        }

        let clueProof = response.data.solidityCallData
        let proofDiv = document.getElementById("clue-proof")
        proofDiv.innerHTML = ''

        let para = document.createElement("p");
        para.innerHTML = "Clue Proof Solidity Calldata [Pass the following values into verifier contract to prove clue is right]";
        proofDiv.appendChild(para)

        let a = clueProof.a
        para = document.createElement("p");
        para.innerHTML = "a: " + JSON.stringify(a);
        proofDiv.appendChild(para)

        let b = clueProof.b
        para = document.createElement("p");
        para.innerHTML = "b: " + JSON.stringify(b);
        proofDiv.appendChild(para)

        let c = clueProof.c
        para = document.createElement("p");
        para.innerHTML = "c: " + JSON.stringify(c);
        proofDiv.appendChild(para)

        let input = clueProof.input
        para = document.createElement("p");
        para.innerHTML = "Input: " + JSON.stringify(input);
        proofDiv.appendChild(para)

        if (clue[0] == 1 && clue[1] == 1 && clue[2] == 1 && clue[3] == 1) {
            toastr.success("You guessed right! Game over!")
            return
        } else {
            currentGuess = [];
            nextLetter = 0;
    
            if (guessesRemaining === 0) {
                toastr.error("You've run out of guesses! Game over!")
                return
            }
        }
      })
      .catch((error) => {
        toastr.error(error.response.data.message)
      })
}

function insertLetter (pressedKey) {
    if (nextLetter === NUMBER_OF_LETTERS) {
        return
    }
    pressedKey = pressedKey.toLowerCase()

    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let box = row.children[nextLetter]
    animateCSS(box, "pulse")
    box.textContent = pressedKey
    box.classList.add("filled-box")
    currentGuess.push(pressedKey)
    nextLetter += 1
}

function verifyProof() {
    let a = JSON.parse(document.getElementById("a").value)
    let b = JSON.parse(document.getElementById("b").value)
    let c = JSON.parse(document.getElementById("c").value)
    let input = JSON.parse(document.getElementById("input").value)

    const verifierContract = new ethers.Contract(verifierContractAddress, verifierAbi, signer)
    verifierContract.verifyProof(a, b, c, input).then((response) => {
            if (response == true) {
                toastr.success("Clue verification passed");
            } else {
                toastr.error("Clue verification failed");
            }
        }).catch((error) => {
            toastr.error(error)
        })
}

const animateCSS = (element, animation, prefix = 'animate__') =>
  // We create a Promise and return it
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    // const node = document.querySelector(element);
    const node = element
    node.style.setProperty('--animate-duration', '0.3s');
    
    node.classList.add(`${prefix}animated`, animationName);

    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
});

document.addEventListener("keyup", (e) => {

    if (guessesRemaining === 0) {
        return
    }

    let pressedKey = String(e.key)
    if (pressedKey === "Backspace" && nextLetter !== 0) {
        deleteLetter()
        return
    }

    if (pressedKey === "Enter") {
        checkGuess()
        return
    }

    let found = pressedKey.match(/[a-z]/gi)
    if (!found || found.length > 1) {
        return
    } else {
        insertLetter(pressedKey)
    }
})

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
    const target = e.target
    
    if (!target.classList.contains("keyboard-button")) {
        return
    }
    let key = target.textContent

    if (key === "Del") {
        key = "Backspace"
    } 

    document.dispatchEvent(new KeyboardEvent("keyup", {'key': key}))
})

connnectPlayerWallet().then(() => {
    initBoard()
}).catch((error) => {
    toastr.error(error.message + " Please reload page and connect wallet to play ZK Wordle.")
})
