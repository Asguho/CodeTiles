# CodeTiles

## For at køre client:
```bash
cd client
deno install
deno run dev
```

## For at køre server:
```bash
cd server
deno run dev
```


## API
```js
//basic
CodeTiles.onTurn((game)=>{
 for(let unit of game.units){
   unit.moveForward();
 }
});

//Pathfinding
CodeTiles.onTurn((game)=>{
 for(let unit of game.units){
    if(unit.type === 'miner'){
        if(unit.inventory.isFull()){
            unit.moveTowards(game.base.pos);
        }else{
            let ore = game.findClosestOre(unit.pos);
            if(ore){
                unit.moveTowards(ore.pos);
            }
        }
    } 
 }
});

```
