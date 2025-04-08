# buyMiner

```ts
game.shop.buy("miner", 1);
```

# moveUnit

```ts
for (const unit of game.units) {
	unit.move("south");
}
```

# moveToOre

```ts
for (const unit of game.units) {
	if (unit.isMiner() && unit.isOwnedBy(game.playerId)) {
		const ore = game.map.findNearest(unit.position, (tile) => tile.type == "ore");
		
		unit.moveTowards(ore.position, game.map.tiles);
	}
}
```

# mineOre

```ts
//helper function
function arePositionsEqual(pos1, pos2) {
	return pos1.x === pos2.x && pos1.y === pos2.y;
}

for (const unit of game.units) {
	if (unit.isMiner()) {
		const ore = game.map.findNearest(unit.position, (tile) => tile.type == "ore");

		if (arePositionsEqual(unit.position, ore.position)) {
			unit.mine(ore);
		}
	}
}
```

# returnResources

```ts
for (const unit of game.units) {
	if (unit.inventory.ore >= 1) {
		if (!arePositionsEqual(unit.position, game.base.position)) {
			unit.moveTowards(game.base.position, game.map.tiles);
		} else {
			unit.sell();
		}
	}
}
```

# buyAttackUnit

Der findes mange typer `units`. f.eks.

- `miner`
- `melee`
- `ranged`

Prøv at købe en `melee`!

# attackEnemyUnit

1. Først skal finde fjenderne:

```ts
const enemies = game.units.filter((unit) => !unit.isOwnedBy(game.playerId));
```

2. Derefter skal du bevæge din melee mod deres fjende

3. angrib fjenden

```ts
for (const unit of game.units) {
	if (unit.isMelee()) {
		// Vælger den første fjende. I fremtiden kan du måske vælge den der er tættest på din base.
		const enemy = enemies[0];

		unit.attack(enemy.position);
	}
}
```

# attackEnemyBase

```ts
const enemyBase = game.map.findNearest(unit.position, (tile) => {
	return tile.isBase() && tile.owner != game.playerId;
});

for (const unit of game.units) {
	if (unit.isMelee()) {
		// Ryk mod basen og når du er inde for afstand. Så angrib

		unit.attack(enemyBase.position);
	}
}
```

# winGame

Bliv ved med at slå på basen ind til den er død og så har du vundet.
