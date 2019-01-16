# Building a shell command database

We pull from several sources to populate the command database.

*Note: all commands to be run from this directory, `assets/commands/`.*

## From $PATH (Fedora)

Get all executables from the $PATH and all built-in bash functions.

    compgen -bc > from-path-fedora.txt

Get all DNF packages (this does not get executable names).

    dnf list all
