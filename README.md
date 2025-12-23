# Toad Data Modeler Packages

This repository hosts a growing collection of add-ons for **Quest Toad Data Modeler**.  Each package bundles the macros, helper scripts, and example assets needed to streamline day-to-day modeling tasks such as keeping SQL sources in sync with your logical or physical models.

## Repository Layout

| Path | Description |
| --- | --- |
| `Ozum Extras/` | Complete toolkit that demonstrates how to script against the Toad automation APIs, including macros, reusable JScript helpers, and a miniature sample model. |

## Packages

### Ozum Extras
This package focuses on round-tripping PostgreSQL function definitions between the Toad model and a filesystem-backed `db-lib` folder.  It contains three key parts:

- **Macros (`Ozum Extras/macros/`)**
	- `sync-functions-to-db-lib.js` locks the active model, parses every `.sql` file under `db-lib/functions` and `db-lib/procedures`, updates their inline `@GUID` markers, and deletes orphaned functions/procedures from the model when no matching SQL file remains.
- **Reusable Scripts (`Ozum Extras/scripts/`)**
	- A suite of JScript utilities (`array.js`, `fs.js`, `functionParser.js`, `list.js`, `object.js`, `path.js`, `sql.js`, `string.js`, `toad.js`) that polyfill modern language features and wrap common Toad automation patterns—ideal starting points for your own macros.
- **Example Project (`Ozum Extras/example/`)**
	- Includes a `model.txp` and a sample `db-lib/` tree so you can test the synchronization flow without touching production repositories.

## Getting Started

1. **Clone the repo** somewhere that Toad can access (or download a ZIP from GitHub).
2. **Import a package**:
	 - Copy the `macros/*.js` files into your Toad Data Modeler `Macros` directory.
	 - Copy the `scripts/` helpers anywhere on disk and update the macro include paths, or add them to your global script library.
3. **Open the sample model** located under `Ozum Extras/example/model.txp` to experiment safely before pointing the macro at your own repository.

## Running the Sync Macro

1. Open Toad Data Modeler and load the model you want to synchronize.
2. Ensure the model folder contains `db-lib/functions` and `db-lib/procedures` populated with `.sql` files.
3. Execute the `sync-functions-to-db-lib` macro from the Macros window.
4. Watch the Message Explorer for log output; when the macro finishes it reports how many model items were refreshed or removed.

## Contributing

Have your own productivity macros or helper scripts?  Feel free to open a pull request or submit an issue describing the package you would like to share.  Consistent documentation and a small example model make it easier for other modelers to get value from your contribution.

## License

Unless a subdirectory specifies otherwise, the contents of this repository are released under the MIT License.
