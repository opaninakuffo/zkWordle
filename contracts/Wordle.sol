// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWordle.sol";


contract Wordle is IWordleGame, Ownable {
    constructor(uint8 _treeLevel, address _cv) {
        treeLevels = _treeLevel;
        cv = IClueVerifier(_cv);
    }

    function createGame(
        uint _root,
        bytes32 _tree,
        address _player,
        uint _createdAt
    ) external override onlyOwner {
        require(_player != address(0), "Player cannot be 0 address");

        uint _id;

        _id = ++gameId;
        games[_id].root = _root;
        games[_id].tree = _tree;
        games[_id].player = _player;
        games[_id].createdAt = _createdAt;

        gamesByPlayer[_player].push(_id);

        emit GameCreated(_id, _player);
    }

    function getGamesByPlayer(address _player) external view override returns (uint[] memory _gamesByPlayer) {
        _gamesByPlayer = gamesByPlayer[_player];
    }

    function getGameDetails(uint _id) external view override returns (uint root, bytes32 tree, address player, uint createdAt) {
        root = games[_id].root;
        tree = games[_id].tree;
        player = games[_id].player;
        createdAt = games[_id].createdAt;
    }

    function verifyClue(
            uint[1] memory _clue,
            uint[2] memory _a,
            uint[2] memory _b_0,
            uint[2] memory _b_1,
            uint[2] memory _c
        ) public view override returns (bool _r) {
            return cv.verifyProof(_a, [_b_0, _b_1], _c, _clue);
    }
}