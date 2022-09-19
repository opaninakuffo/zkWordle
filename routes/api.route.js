const router = require('express').Router();
const { PrismaClient } = require('@prisma/client')
const utils = require("../src/utils")

const prisma = new PrismaClient()

router.post('/game/setup', async (req, res, next) => {
  try {
    const playerAddress = req.body.playerAddress;
    const numberOfGuesses = req.body.numberOfGuesses
    const game = await utils.setupGame(playerAddress, numberOfGuesses);
    res.json(game)
  } catch (error) {
    next(error)
  }
});

router.post('/game/guess/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const guess = req.body.guess
    const playerAddress = req.body.playerAddress
    const payload = await utils.playerGuess(id, guess, playerAddress);
    res.json(payload)
  } catch (error) {
    next(error)
  } 
});

router.get('/game/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const game = await utils.getGame(id);
    res.json(game)
  } catch (error) {
    next(error)
  }
});

router.delete('/game/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await utils.deleteGame(id);
    res.json(`Successfuly deleted game #${id}`)
  } catch (error) {
    next(error)
  }
});

module.exports = router;
