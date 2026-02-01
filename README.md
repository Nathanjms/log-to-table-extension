# Log to Table (Laravel & More)

View your Log files in a easy-to-read table, with filters and pagination. Works with Laravel logs out the box, with the ability to add more regex patterns for other .log files.

## Commands:

- `Log to Table: Find and Open Log`
  - Can be ran from anywhere. This command identifies any `.log` files and lists them, then lets you pick one to open.
- `Log to Table: View as Table`
  - Can be ran from any `.log` file. This command will open the file in the table format.

## Features

- Find and list your `.log` files automatically and open them directly in a table.
- Easy to navigate table, with pagination and filters to search on date, severity and message
- Add custom regex to match different log formats, no longer just Laravel!
- ...more to come (make an issue if you have a request!)

### A button (and command) to open when you are in a `.log` file:

![First Demo](images/button-demo.gif)

### A command to search and find all .log files in your Workspace, and open any of them into the table:

![Second Demo](images/find-log-command.gif)

## Extension Settings

Currently there are no setting to configure.

## Known Issues

No known issues. This extension is new, so please create an issue if you encounter any issues, or have any feedback!

## Future Plans

- Add support for any regex pattern, not just Laravel Logs.
- Advanced searching/filtering on the log.
- Better pagination (eg. add 'First' and 'Last').
- Allow click-through to the file in a log message.
- Add a 'Per Page' option.
- ...any suggestions made on GitHub (make an issue if you have a request!)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete history of releases and changes.

---

## Development

When in VS Code, use the built-in Run and Debug functionality to run the `Run Extension` task, to test.

## Publishing

1. Run `npx @vscode/vsce publish` to publish the extension.
