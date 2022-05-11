***Setup:***

**THE BOT APPLICATION NEEDS TO INCLUDE THE SCOPE APPLICATIONS.COMMANDS**


Create file in same folder as index.js called config.json.

Edit config.json to include the data you need.

```
{
    "clientId": "DISCORD_BOT_CLIENTID",
    "guildId": "DISCORD_SERVER_ID",
    "token": "DISCORD_BOT_TOKEN"
}
```

Now to install dependencies do the following in the terminal.
```
 npm install @latest
```

Once you have done both of these you need to run this command in the terminal.
```
node deploy-commands.js
```

Now you can run the bot by running this command in the terminal.
```
node index.js
```

now if you look in discord your bot should be running