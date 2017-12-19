# ethfolio
Securely create and share your Ethreum Token Portfolio


## Import.

You can easily load your token portfolio by importing an Ethereum, Bitcoin, or Litecoin wallet address. When you import your Ethereum address, we automatically discover all of your various Ethereum tokens.

If you need to add other tokens to your portfolio, you can add a custom token.

## Save.

Privacy is of primary importance to us. By default, you only save the relative percentage of each token in your portfolio. This means that no one will ever know exactly how much you own, or what your wallet addresses are.

This site runs entirely on the client-side, so you control what you want to share.

## Share.

Once you save your portfolio, we give you a link which you can share with your friends.

If you chose to save token balances, we can update the value of your portfolio over time.

If you chose to save wallet addresses, we can update your entire portfolio over time.
Keeping it simple.

### Our goal is not only to make it simple to create your portfolio, but make it easy to share it too.

Take a look at these example portfolios to see what sharing looks like. Note that these all represent the same token portfolio using the different save settings.

    Default save settings: http://ethfol.io/?r=2
    Save token balances: http://ethfol.io/?r=3
    Save wallet addresses: http://ethfol.io/?r=4

### We support ETH, BTC, and LTC wallets.

You only need to copy and paste your Ethereum, Bitcoin, or Litecoin wallet address to be able to get all of your token information.
You can add any number of custom tokens.

Using the Coinmarketcap price API, we are able to bring you access to hundreds of tokens which you can easily add to your portfolio. You just add the # of tokens you own, and we will calculate the total value.

If your token is not supported by the Coinmarketcap API, you can just use the dropdown to enter a $ value for your tokens, and we will seamlessly add it to your portfolio.

### Bookmark your wallets without sharing anything.

With the ?a= query string, you can create a URL with your different ETH, BTC, and LTC addresses separated by a comma (,). When you visit that link, your addresses will automatically get populated in the portfolio view.

You can use this same trick to add custom tokens aswell! Any other query string is treated as custom token. By default, the value of the query string will set the token balance, but you can set the USD amount by adding $ to the value.

Take a look at this example:
```
http://ethfol.io
?a=0x7eD1E469fCb3EE19C0366D829e291451bE638E59,LSFz3wyoFcqW2TKPCcj9gao4zPPuS3wUTS,1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX
&BCH=100,200
&XMR=$100000
```
## Find bugs? Have suggestions? Wanna say thanks?

I would love any and all comments and criticisms for this project. Feel free to point out issues on GitHub, or send me feedback directly via e-mail.

If you think this project is extra cool and want to say thanks, feel free to send me some fake money at:

    ETH: 0xD62835Fe2B40C8411A10E7980a290270e6A23cDA
    BTC: 3QQJLmgMJdWDThvWpbvmrKH9WVJyBM9TZy

