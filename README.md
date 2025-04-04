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

## Release Notes

### 0.2.2

- Fixed a bug where a small log file would fail to load.

### 0.2.1

- Updated to only load up to 5MB of a log file, ordered latest first, to ensure the file is load-able.
  - Perhaps this could be overridden in the settings in future?

### 0.2.0

- Rebranded the Laravel Log Viewer extension to 'Log to Table', now we support any `.log` file formats.
- Added the ability to create your own regex patterns to match different Log Files, and save these new pattern matches.
  - Related to issue https://github.com/Nathanjms/laravel-log-viewer-extension/issues/1
  - We may want to have a set of 'defaults' here, let me know if you have feedback!
- Added a refresh button to update the table when a new log is added to the file.
- Severities are now a dropdown instead of freetext.
- Added a manu bar button to open a .log file as a table.

### 0.1.1

- Fix README gifs not loading

### 0.1.0

- Added a second command which finds you `.log` files for you and let's you open any of them.
- Added menu button when in `.log` file to open the log as a table.
- Styling updates for better handling of expanding a log message.
- Option to view expanded log message wrapped or unwrapped.
- Copy to clipboard button.

### 0.0.1

Initial release of the extension. Command to open a laravel .log file in a table format.

---

## Development

When in VS Code, use the built-in Run and Debug functionality to run the `Run Extension` task, to test.

## Publishing

1. Run `npx @vscode/vsce publish` to publish the extension.
