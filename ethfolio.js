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

function tokenConstructor(symbol, balance, price, name, percentage) {
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
                        let tokObj = new tokenConstructor()
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

    let ethObj = new tokenConstructor()
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
    var br = document.createElement("br")
    var input = document.createElement("input")
    input.setAttribute("type", "text")
    input.setAttribute("size", "70")
    input.setAttribute("class", "address")
    document.getElementById('inputs').appendChild(br);
    document.getElementById('inputs').appendChild(input)
}

async function calculateAllBalances() {
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

        console.log(tokens)

        for (symbol in tokens) {
            token = tokens[symbol]
            output.push([token.symbol, (token.percentage).toPrecision(4)])
        }

        console.log(tokens, addresses,total,output)

        global.tokens = JSON.stringify(tokens)
        global.accounts = JSON.stringify(addresses)
        global.totalUsd = JSON.stringify(total)
        global.output = JSON.stringify(output)

        displayAllBalances(global.output, global.totalUsd, global.accounts)

    } catch (error) {
        document.getElementById("output").innerHTML = error
        console.error(error)
    }
}

function displayAllBalances(outputJSON, totalJSON, accountsJSON) {

    var output = JSON.parse(outputJSON)
    if (totalJSON) {
        var total = JSON.parse(totalJSON)
        total = "$" + total.toFixed(2)
    } else {
        var total = "HIDDEN"
    }
    if (accountsJSON) {
        var accounts = JSON.parse(accountsJSON)
    }
    

    document.getElementById("output").innerHTML += "<h3>Total Price USD: " + total + "</h3>"

    document.getElementById("output").innerHTML += "<b>Accounts: </b><br>"
    for (account in accounts) {
        document.getElementById("output").innerHTML += accounts[account] + "<br>"
    }

    var view = []
    var other = ["Other", 0]

    for (symbol in output) {
        token = output[symbol][0]
        percentage = parseFloat(output[symbol][1])

        document.getElementById("output").innerHTML += "<br>" + token + ": " + (percentage * 100).toPrecision(4) + "%"
        if (percentage < .005) {
            other[1] += percentage
        } else {
            view.push([token, percentage])
        }
    }

    console.log(other[1])

    if (other[1] > 0) {
        view.push(other)
    }


    createGraph(view);

}


function createGraph(input) {

    var datasets = []
    var labels = []

    for (tok in input) {
        datasets.push(input[tok][1])
        labels.push(input[tok][0])
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
    if (global.tokens != "" && global.output.length < 20000) {
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
            console.error(error)
        }

        try {
            //plz don't try to understand this, it makes no sense
            var range = "A:A"
            extra = "P2tleT1BSXphU3lDSlVham9"
            extra += "XdWI0aElBdzM3dUZUaWZBMFB2emI3V2dtQ28"

            var response = await fetch("https://sheets.googleapis.com/v4/spreadsheets/1EVToo4kogqGNrQ-lLgl9iXJ4759p5PCbI0HxhqCCQek/values/" + range + atob(extra + "="))
            var sheet = await response.json()

            var url = [location.protocol, '//', location.host, location.pathname].join('');

            var foliourl = url + "?row=" + sheet.values.length

            document.getElementById("output").innerHTML = "Your ethfolio can be found at: <a href='" + foliourl + "'>" + foliourl + "</a>"  

        } catch (error) {
            console.error(error)
        }



        console.log("Done!")
    } else {
        document.getElementById("output").innerHTML = "Make sure to load your address first!"
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function getRow(rowNumber) {
    try {

        //plz don't try to understand this, it makes no sense
        var range = "A" + rowNumber + ":D" + rowNumber
        extra = "P2tleT1BSXphU3lDSlVham9"
        extra += "XdWI0aElBdzM3dUZUaWZBMFB2emI3V2dtQ28"

        var response = await fetch("https://sheets.googleapis.com/v4/spreadsheets/1EVToo4kogqGNrQ-lLgl9iXJ4759p5PCbI0HxhqCCQek/values/" + range + atob(extra + "="))
        var sheet = await response.json()

        var values = sheet.values[0]

        console.log(values)

        if (values.length >= 2 && values.length < 5) {
            var time = values[0]
            var percentage = values[1]
            if (values[2]) {
                var totalUSD = values[2]
            }
            if (values[3]) {
                var addresses = values[3]
            }
        } else {
            console.log("Hmm... something wrong with google sheet response.")
        }

        displayAllBalances(percentage, totalUSD, addresses)

    } catch (error) {
        console.error(error)
        document.getElementById("output").innerHTML = error
    }
}

window.onload = function () {
    var row = getParameterByName('row')
    if (row) {
        if (row > 1) {
            console.log("Getting Row " + row)
            getRow(row)
        } else {
            document.getElementById("output").innerHTML = "Not a valid row"
        }
    }
}