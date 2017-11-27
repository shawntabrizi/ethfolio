function token(symbol, balance, price, name, percentage) {
    this.symbol = symbol;
    this.balance = balance;
    this.price = price;
    this.name = name;
    this.percentage = percentage;
}

async function getAllBalances(address) {
    try {
        var response = await fetch("https://api.ethplorer.io/getAddressInfo/" + address + "?apiKey=freekey")
        var data = await response.json()
        console.log(data)

        return (data)

    } catch (error) {
        console.log(error)

        throw (error)
    }
}

async function getETHPrice() {
    var response = await fetch("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD")
    var price = await response.json()
    console.log(price['USD'])
    return price['USD']
}

async function collectTokens(balances) {
    var tokens = []
    var totalPrice = 0

    for (bal in balances['tokens']) {
        let tok = balances['tokens'][bal]
        let price = tok['tokenInfo']['price']
        if (price != false) {
            if (price['rate'] != null) {
                let tokObj = new token()
                tokObj.price = price['rate']
                tokObj.symbol = tok['tokenInfo']['symbol']
                tokObj.name = tok['tokenInfo']['name']
                tokObj.balance = tok['balance'] / (Math.pow(10, tok['tokenInfo']['decimals']))

                tokens.push(tokObj)
            }
        }
    }

    let ethObj = new token()
    ethObj.balance = balances['ETH']['balance']
    ethObj.name = "Ether"
    ethObj.symbol = "ETH"
    ethObj.price = await getETHPrice()
    tokens.push(ethObj)
   
    return tokens
}

function totalPrice(tokens) {
    let total = 0

    for (tok in tokens) {
        token = tokens[tok]
        total += token.price * token.balance
    }

    return total
}

function compareTotal(a, b) {
    aTotal = a.price * a.balance
    bTotal = b.price * b.balance

    if (aTotal < bTotal) {
        return 1;
    }
    if (aTotal > bTotal) {
        return -1;
    }
    return 0;
}

function percentageOfTotal(tokens, total) {
    for (tok in tokens) {
        token = tokens[tok]
        token.percentage = token.price * token.balance / total
    }
}

async function displayAllBalances() {
    try {
        var address = document.getElementById("address").value;
        var balances = await getAllBalances(address)

        document.getElementById("output").innerHTML = ""

        var tokens = await collectTokens(balances)

        tokens.sort(compareTotal)

        var total = totalPrice(tokens)

        percentageOfTotal(tokens, total)

        document.getElementById("output").innerHTML += "Total Price USD: " + total + "<br>"
        
        for (tok in tokens) {
            token = tokens[tok]
            //document.getElementById("output").innerHTML += token.balance + " " + token.symbol + " (" + token.name + ") @ $" + token.price + " [" + (token.price * token.balance) + "]" + "<br>"
            document.getElementById("output").innerHTML += token.symbol + " " + (token.percentage * 100).toFixed(2) + " [" + token.price * token.balance + "]" + "<br>"
        }

    } catch (error) {
        document.getElementById("output").innerHTML = error
    }
}

function submitToForm() {
    form = {
        formId: "1HQNQqOybNGYBwp1HPYcGDYJ9KvXVAaOSwl16wgNntfQ",
        date: {
            year: "1307050871_year",
            month: "1307050871_month",
            day: "1307050871_day",
        },
        time: {
            hour: "1572539166_hour",
            minute: "1572539166_minute"
        },
        percentage: "500393463",
        uniqueId: "894745516",
        totalUsd: "1940177998",
        accounts: "143080195"
    }

    fetch("",
        {
            method: "post"
        })

}