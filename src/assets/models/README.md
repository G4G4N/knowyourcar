# Real 3D models

Drop a `.glb` here named after the generation id (e.g. `g80.glb`, `b9-rs4.glb`, `w463a.glb`) and the app
uses it instead of the procedural body for that car. X-ray, part picking and the animated internals all keep working.

Generation ids are the `id`s in `src/data/catalog.ts` (shown in the URL hash too: `#brand=bmw&model=m3&gen=g80`).

Attribution for each model goes in `credits.json` (the fetch script fills it in automatically):

```json
{
  "g80": { "name": "BMW M3 (G80)", "author": "Cherk", "license": "CC Attribution", "url": "https://sketchfab.com/3d-models/…", "flip": false }
}
```

`flip: true` turns the model around if it loads facing backwards; you can also do that live in the app.

To download from Sketchfab, see `scripts/fetch-model.mjs`.
