# smf2krunker
Use "hammer" to make krunker maps.
Converts sledge map files to krunker map json strings. This probably should have been written in python or something
Install [Sledge Editor](http://sledge-editor.com/), create your map, and save as .smf. 
Install node.js and run ```node path/to/smf2kmj.js path/to/map.smf```

### What is working
* Converting smf to regular json
* Size of objects
* Position of objects 
* Spawn entities

### Planned
* Textures
* Most Point Entities
* Brush Entities
* Rotation

### Converting
```node smf2kmj.js path/to/map.smf```
Returns a json string that you can paste into the krunker map editor.