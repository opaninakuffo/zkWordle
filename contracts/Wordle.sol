// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWordle.sol";


contract Wordle is IWordleGame, Ownable {
    constructor(address _cv) {
        cv = _cv;
    }

    function createGame(
        uint _id,
        uint _root,
        address _player,
        uint _createdAt
    ) external override onlyOwner {
        require(_player != address(0), "Player cannot be 0 address");

        games[_id].root = _root;
        games[_id].player = _player;
        games[_id].createdAt = _createdAt;

        gamesByPlayer[_player].push(_id);

        emit GameCreated(_id, _player);
    }

    function getGamesByPlayer(address _player) external view override returns (uint[] memory _gamesByPlayer) {
        _gamesByPlayer = gamesByPlayer[_player];
    }

    function getGameDetails(uint _id) external view override returns (uint root, address player, uint createdAt) {
        root = games[_id].root;
        player = games[_id].player;
        createdAt = games[_id].createdAt;
    }
}