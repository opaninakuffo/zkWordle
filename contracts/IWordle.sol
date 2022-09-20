// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * Abstraction for Zero-Knowledge Wordle Game
 */
abstract contract IWordleGame {
    address public cv; // verifier for proving clue passed on to player

    struct Game {
        uint root; // root of game tree
        address player; // address of the player
        uint createdAt; // time at which game was created
    }

    mapping (uint => Game) public games; // map of game id to game data
    mapping (address => uint[]) public gamesByPlayer; // map of previous games played by player

    event GameCreated(uint indexed id, address indexed player);
    
    /**
     * Create a new game record on chain
     *
     * @param _id uint - unique game id / nonce
     * @param _root uint - game's solution merkle tree root
     * @param _player address - address of player
     * @param _createdAt uint - timestamp of game creation
     */
    function createGame(
        uint _id,
        uint _root,
        address _player,
        uint _createdAt
    ) external virtual;

    /**
     * Return game IDs of all games played by a player
     *
     * @param _player address - address of player
     * @return _gamesByPlayer uint[] - game IDs played by player
     */
    function getGamesByPlayer(address _player)external view virtual returns (uint[] memory _gamesByPlayer);

    /**
     * Return game details based on game id
     *
     * @param _id uint - game ID
     * @return _root uint - game's solution merkle tree root
     * @return _player address - address of player
     * @return _createdAt uint - timestamp of game creation
     */
    function getGameDetails(uint _id) 
        external 
        view 
        virtual 
        returns (
            uint _root, 
            address _player,
            uint _createdAt
        );
}