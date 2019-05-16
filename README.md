# clh-bash

![screenshot from 2019-02-06 09-54-54](https://user-images.githubusercontent.com/3926730/52349830-53226480-29f5-11e9-82a9-783a04808e55.png)

## Development

Install dependencies.

    npm install

Extract the compressed MTL and OBJ files.

    npm run extract
    
NOTE: The above will not work on Windows or other OSs that don't have gunzip utility on the command line path.  To work around this please run "node src\unzip.js" on the commandline.

Start the dev server.

    npm start

If you need to make changes to MTL/OBJ files and want to preserve them, run this to compress them.  Only gzipped MTL/OBJ files are saved in the repo.

    npm run compress

## Leaderboard selection

Bash supports multiple options for leaderboard storage.  The default is in-browser `localStorage`.  A networked leaderboard is also supported, through sending leaderboard entries to a Parse server.

### Networked leaderboards with Parse

If you want a networked leaderboard, you must have a Parse instance up and running. Then, open `src/config.js` and change `PARSE_URL` to point to the URL of your parse server.

Finally, when you launch Bash, add `&storage=parse` to the end.

### Selecting a leaderboard namespace

Both `localStorage` and Parse leaderboard support namespacing.  In other words, you can give the leaderboard a name.  This is especially useful if you need to maintain multiple leaderboards, for tournament rounds, timed events at conferences, etc.  Switching between leaderboards is as easy as changing the namespace.

Then, when you launch Bash, add `&name=NAMESPACE` to the end of Bash's URL.  Note that you can change the word `NAMESPACE` to be anything you want.


### How to get Help

1. Post a question in the repo [issues](https://github.com/CommandLineHeroes/clh-bash/issues)
2. Ask a question in real-time in our [public Discord server](https://discord.gg/rpnmpVj)
3. Send a tweet to one of the twitter links below [social](#social)

## Community

Join our [public Discord server](https://discord.gg/rpnmpVj)!

## Social

 - Jared Sprague [@caramelcode](https://twitter.com/caramelcode)
 - Michael Clayton [@mwcz](https://twitter.com/mwcz)
 - [Command Line Heroes](https://www.redhat.com/en/command-line-heroes)
 - [#CommandLinePod](https://twitter.com/hashtag/CommandLinePod?src=hash)
