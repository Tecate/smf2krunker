# smf2krunker
Use sledge or hammer editor to make krunker maps.
Converts sledge map files to krunker map json strings. This probably should have been written in python or something

### What is working
* Converting smf to regular json
* Size of objects
* Position of objects 
* Position of spawn entities

### Planned
* Textures
* Point Entities
* Brush Entities
* Rotation of brushes

### Usage
1. Install [Sledge Editor](http://sledge-editor.com/)
2. In sledge editor go to settings (Window > Settings)
3. In settings window: select "Environment" and add a new environment named "Krunker"
4. In the same window under "Game Data Files" add krunker.fgd
5. Again in the same window under Textures, add krunker.wad.
6. Press ok and restart sledge.
7. Create your map, and save as .smf. 
8. Install node.js and run ```node path/to/smf2kmj.js path/to/map.smf```