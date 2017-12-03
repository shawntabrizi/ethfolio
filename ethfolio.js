var global = {
    "tokens": "",
    "uniqueId": "",
    "totalUsd": "",
    "accounts": "",
    "output": ""
}

function checkAddress() {
    if (document.getElementById("saveTotal").checked == true) {
        document.getElementById("saveAddress").disabled = false
    } else {
        document.getElementById("saveAddress").disabled = true
        document.getElementById("saveAddress").checked = false
    }

}

function token(symbol, balance, price, name, percentage) {
    this.symbol = symbol;
    this.balance = balance;
    this.price = price;
    this.name = name;
    this.percentage = percentage;
}

async function getAllBalances(addresses) {
    try {
        var data = await Promise.all(
            addresses.map(
                address =>
                    fetch("https://api.ethplorer.io/getAddressInfo/" + address + "?apiKey=freekey").then(
                        (response) => response.json()
                    )));

        return (data)

    } catch (error) {
        console.log(error)

        throw (error)
    }
}

async function getETHPrice() {
    var response = await fetch("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD")
    var price = await response.json()
    return price['USD']
}

async function collectTokens(balances) {
    var tokens = []
    var tokenTracker = {}
    var totalPrice = 0

    tokenTracker['ETH'] = 0

    for (balance in balances) {
        for (bal in balances[balance]['tokens']) {
            let tok = balances[balance]['tokens'][bal]
            let price = tok['tokenInfo']['price']
            if (price != false) {
                if (price['rate'] != null) {
                    var symbol = tok['tokenInfo']['symbol']
                    if (symbol in tokenTracker) {
                        tokenTracker[symbol] += tok['balance'] / (Math.pow(10, tok['tokenInfo']['decimals']))
                    } else {
                        let tokObj = new token()
                        tokObj.symbol = symbol
                        tokObj.price = price['rate']
                        tokObj.name = tok['tokenInfo']['name']
                        tokenTracker[symbol] = tok['balance'] / (Math.pow(10, tok['tokenInfo']['decimals']))
                        tokens.push(tokObj)
                    }
                }
            }
        }
        tokenTracker['ETH'] += balances[balance]['ETH']['balance']
    }

    let ethObj = new token()
    ethObj.balance = tokenTracker['ETH']
    ethObj.symbol = "ETH"
    ethObj.name = "Ether"
    ethObj.price = await getETHPrice()
    tokens.push(ethObj)

    for (tok in tokens) {
        token = tokens[tok]
        token.balance = tokenTracker[token.symbol]
    }

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

    console.log("sorting")

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

function addInput() {
    var input = '<br><input type="text" size="70" class="address" />';
    document.getElementById('inputs').innerHTML += input;
}

async function displayAllBalances() {
    try {

        var inputs = document.getElementsByClassName("address");
        var addresses = []

        for (input in inputs) {
            if (typeof inputs[input].value !== "undefined" && inputs[input].value !== "") {
                addresses.push(inputs[input].value)
            }
        }

        console.log(addresses)

        var balances = await getAllBalances(addresses)

        document.getElementById("output").innerHTML = ""

        var tokens = await collectTokens(balances)

        tokens.sort(compareTotal)

        var total = totalPrice(tokens)

        var output = []

        percentageOfTotal(tokens, total)

        document.getElementById("output").innerHTML += "<h4>Total Price USD: $" + (total).toFixed(2) + "</h4><br>"

        var other = ["Other", 0]

        console.log(tokens)

        for (symbol in tokens) {
            token = tokens[symbol]
            document.getElementById("output").innerHTML += token.symbol + ": " + (token.percentage * 100).toFixed(2) + "% [$" + (token.price * token.balance).toFixed(2) + "]" + "<br>"
            if (token.percentage < .005) {
                other[1] += token.percentage
            } else {
                output.push([token.symbol, token.percentage])
            }
        }

        if (other[1] > 0) {
            output.push(other)
        }
        createGraph(JSON.stringify(output));

        global.tokens = JSON.stringify(tokens)
        global.accounts = JSON.stringify(addresses)
        global.totalUsd = JSON.stringify(total)
        global.output = JSON.stringify(output)

    } catch (error) {
        document.getElementById("output").innerHTML = error
    }
}


function createGraph(input) {

    var datasets = []
    var labels = []

    var inputJSON = JSON.parse(input)

    for (tok in inputJSON) {
        datasets.push(inputJSON[tok][1])
        labels.push(inputJSON[tok][0])
    }

    data = {
        datasets: [{
            data: datasets,
            backgroundColor: palette('tol-rainbow', datasets.length).map(function (hex) {
                return '#' + hex;
            })
        }],

        labels: labels
    };

    var ctx = document.getElementById("chart").getContext('2d');
    var myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: data
    });

}

async function submitToForm() {
    if (global.tokens != "" && global.tokens.length < 20000) {
        form = {
            formId: "1FAIpQLScUslukowSoxtDokclveTORdhmlEUHV1lTcaESbTCguuzwZxw",
            percentage: "500393463",
            totalUsd: "1940177998",
            accounts: "143080195"
        }

        let entries = ""

        entries += "&entry." + form.percentage + "=" + global.output
        if (document.getElementById("saveTotal").checked) {
            entries += "&entry." + form.totalUsd + "=" + global.totalUsd
        }
        if (document.getElementById("saveAddress").checked) {
            entries += "&entry." + form.accounts + "=" + global.accounts
        }

        try {
            console.log("Disregard the error related to 'Access-Control-Allow-Origin', submission should work.")
            var response = await fetch("https://docs.google.com/forms/d/e/" + form.formId + "/formResponse?" + entries,
                {
                    method: "post"
                })
        } catch (error) {
            console.log(error)
        }

        console.log("Done!")
    } else {
        console.log("Length Problem?")
    }
}
