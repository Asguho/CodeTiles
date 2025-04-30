# buyMiner

Codetiles er et spil, hvor man skal styre en masse `units` og samle `resources` op. Derfor er det essentielt, at du køber din første `miner` så hurtigt som muligt!

```ts
game.shop.buy("miner", 1);
```

Senere i spillet bliver du introduceret for flere forskellige slags `units`, så du kan lave din helt egen taktik.

# moveUnit

En vigtig del af spillet er at flytte dine `units` rundt på kortet. Du kan flytte dem i en retning ved at kalde `move` metoden og give den en retning som parameter.

Her løber vi en liste af alle units på mappet igennem og flytter dem alle sammen en retning mod `south`.

```ts
for (const unit of game.units) {
	unit.move("south");
}
```

Senere lære du om mere advanceret pathfinding og hvordan du kan flytte dine `units` mod en bestemt position.

# moveToOre

For at du kan få flere `resources` skal du hen til en `ore` og mine den. Det kan du gøre ved at finde den nærmeste `ore` og så flytte hen til den.

I dette eksempel løber vi en liste af alle `units` igennem og så testes det om den er en `miner` og du ejer den. Hvis det er tilfældet, så finder vi den nærmeste `ore` og flytter hen til den.

```ts
for (const unit of game.units) {
	if (unit.isMiner() && unit.isOwnedBy(game.playerId)) {
		const ore = game.map.findNearest(unit.position, (tile) => tile.type == "ore");

		unit.moveTowards(ore.position, game.map.tiles);
	}
}
```

# mineOre

I forrige afsnit lærte du at flytte dine `units` hen til en `ore`. Nu skal du lære at mine den. Det kan du gøre ved at kalde `mine` metoden på din `unit` og give den `ore` som parameter.

I eksemplet herunder introducerer vi en helper funktion `areCordinatesEqual`, som tjekker om to positioner er ens. Det er vigtigt at tjekke, da det kan være at din `unit` ikke er nået hen til `ore` endnu og derfor ikke kan mine den.

```ts
for (const unit of game.units) {
	if (unit.isMiner()) {
		const ore = game.map.findNearest(unit.position, (tile) => tile.type == "ore");

		// Flyt unit hen til ore, som beskrevet i forrige afsnit

		if (areCordinatesEqual(unit.position, ore.position)) {
			unit.mine(ore);
		}
	}
}
```

# returnResources

Når vi i forrige afsnit har mined en `ore`, så skal vi tilbage til vores base og sælge den. Det kan vi gøre ved at flytte hen til vores base.

```ts
for (const unit of game.units) {
	if (unit.inventory.ore >= 1) {
		if (!areCordinatesEqual(unit.position, game.base.position)) {
			unit.moveTowards(game.base.position);
		} else {
			unit.sell();
		}
	}
}
```

# buyAttackUnit

Der findes mange typer `units`. F.eks. `miner`, `melee` og `ranged`. Du kan købe dem i din `shop` ved at kalde `buy` metoden og give den typen af unit som parameter. Du kan også give den et antal som parameter.

Prøv at købe en `melee`!

# attackEnemyUnit

En vigtig del af at vinde spillet er at angribe dine modstandere. Det kan du gøre ved at finde den nærmeste fjende og så angribe den.

Her er er en lille guide til hvordan du f.eks. kan angribe en fjende.

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
		if (unit.isWithinRange(enemy.position)) {
			unit.attack(enemy.position);
		}
	}
}
```

# attackEnemyBase

For at vinde spillet skal man har dræbt alle modspilleres baser. Det kan du gøre ved at finde den nærmeste base og så angribe den.

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
