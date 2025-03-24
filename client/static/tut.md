# Codetiles Tutorial

### Intro

Welcome to CodeTiles! In this game, you compete against other players by writing scripts to control your robot army. Your goal is to collect resources, build your army, and eventually dominate the map. This tutorial will guide you through the basics of the game and help you write your first script.

### Game Mechanics

_Units_

- **Miners**: These units can move around the map and mine ores to collect coins.
- **Melee Units**: ...
- **Ranged Units**: ...

_Tiles_

- **Ore**: Contains resources that miners can extract.
- **Wall**: Impassable terrain.
- **Base**: Your home base, which you need to protect.
- **Unknown**: Hidden tiles that can be revealed by moving over them.

_Coins and Shop_

- **Coins**: Earned by mining ores. Used to buy new units from the shop.
- **Shop**: Allows you to purchase new miners (and other units in the future).

### Writing a Script

Your script will be executed each turn using the `CodeTiles.onTurn` function in the browser editor. This function takes a callback that receives the current game state as an argument.

```javascript
CodeTiles.onTurn((game) => {
	// Your code here
});
```

Inside this callback, you can access the game state through the game object, which provides information about the map, your units, your base, your coins, and the current turn.

### Docs and reference

- [Game API](/docs.html): A comprehensive guide to the game API, including all available functions and properties.

## Tasks:

To get the hang of the game, you will need to complete the following tasks:
