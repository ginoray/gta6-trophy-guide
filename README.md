[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ginoray/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ginoray/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Platinum — GTA VI Trophy Guide & Tracker

Leonida Platinum is an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01). It is plain static files: open `app/index.html` in a browser (or serve the `app/` folder with any static file server) and it runs fully offline — it loads nothing over the network.

## What it does

- **Tracker for the full official list.** Every one of the 55 trophies is shown with its official name, description and grade as PlayStation publishes them: 1 platinum, 2 gold, 6 silver and 46 bronze, worth 1,350 trophy points in total. Each trophy has an earned checkbox, and trophies that PlayStation tracks with a count (challenges, dollar amounts and the like) get a counter stepper. Progress is saved in the browser's localStorage, can be exported to a JSON file and imported back, and can be shared as a progress link that restores the same state when opened.
- **Filters and search.** Filter the list by kind — story, missable, collectibles, activities and online (the game lists no online trophies, so that filter explains itself rather than pretending) — by grade, and by earned or unearned state, or search names and descriptions as text.
- **Spoiler setting.** With spoiler mode on, the 28 hidden trophies stay masked as "Hidden Trophy", with their names and descriptions concealed, until you mark them earned.
- **Roadmap to the platinum.** A five-stage roadmap built from the official trophy descriptions — story first, then the collectibles sweep, the 100% checklist and big grinds, cleanup, and the platinum itself — with each stage listing its trophies. Exactly one trophy is missable: **Positive Mental Attitude**, the Chapter 1 balcony meditation, whose point of no return is the end of Chapter 1; the guide flags it in its own panel, in its detail view, and with a warning banner while it is unearned.
- **A guide for every trophy, with sources.** Each trophy carries a short guide in our own words — what to do, how, and when it can be missed — with its sources cited beside it: PowerPyx's GTA VI trophy guide and roadmap, GTABase's trophy list, Push Square's trophy guide, and GTA Spotter's list collected via PSNProfiles. The official names and descriptions follow the list as PlayStation publishes it, as listed by Exophase and PSNProfiles. Sources are cited, never copied.

## Layout

- `app/` — the guide itself: `index.html`, `style.css`, `app.js`, and `data/trophies.json` (the official list plus each trophy's kind, missable flag, roadmap stage, guide and sources).
- `screenshots/` — the four screenshots of the app, stored as base64 `.b64` text files; `main.ts` decodes them back to JPEG images when the entry is handed in.
- `main.ts` — the hand-in program (Node, standard library only): it validates that the data file holds all 55 trophies with a guide each, copies `app/` to the output, decodes the screenshots, and writes the dossier with the vendored library.
- `vendor/` — the kit's `makefun-frontend.ts` dossier library, kept unchanged.
- `serve.ts` — serves `app/` locally on port 8080 for trying the guide in a browser.

## License

MIT — see [LICENSE](LICENSE).
