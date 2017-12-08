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

function showSubmission() {
    document.getElementById("submission").style.display = "unset"
}

function addInput() {
    var input = document.createElement("input")
    input.setAttribute("type", "text")
    input.setAttribute("class", "address form-control")
    document.getElementById('inputs').appendChild(input)
}

async function calculateAllBalances(addresses = [], newAddress = true) {
    try {
        if (addresses.length == 0) {
            var inputs = document.getElementsByClassName("address");

            for (input in inputs) {
                if (typeof inputs[input].value !== "undefined" && inputs[input].value !== "") {
                    addresses.push(inputs[input].value)
                }
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

        console.log(tokens, addresses, total, output)

        global.tokens = JSON.stringify(tokens)
        global.accounts = JSON.stringify(addresses)
        global.totalUsd = JSON.stringify(total)
        global.output = JSON.stringify(output)

        displayAllBalances(global.output, global.totalUsd, global.accounts);
        if (newAddress) {
            showSubmission();
        }

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

    var table = ""

    table += `<table class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Token Symbol</th>
                            <th scope="col">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>`

    for (symbol in output) {
        token = output[symbol][0]
        percentage = parseFloat(output[symbol][1])

        table += `<tr>
                        <th scope="row">${parseInt(symbol) + 1}</th>
                        <td>${token}</td>
                        <td>${(percentage * 100).toPrecision(4) + "%"}</td>
                    </tr>`

        if (percentage < .005) {
            other[1] += percentage
        } else {
            view.push([token, percentage])
        }
    }

    table += `</tbody>
                </table>`

    document.getElementById("output").innerHTML = table

    console.log(other[1])

    if (other[1] > 0) {
        view.push(other)
    }


    createGraph(view);

}

function createLegend (chart) {
    var text = [];
    text.push('<ul class="' + chart.id + '-legend">');

    var data = chart.data;
    var datasets = data.datasets;
    var labels = data.labels;

    if (datasets.length) {
        for (var i = 0; i < datasets[0].data.length; ++i) {
            text.push('<li><span style="background-color:' + datasets[0].backgroundColor[i] + '"></span>');
            if (labels[i]) {
                text.push(labels[i] + ' (' + datasets[0].data[i] + '%)');
            }
            text.push('</li>');
        }
    }
    text.push('</ul>');
    return text.join('');
}


function createGraph(input) {

    document.getElementById("chartArea").style.display = "unset"

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

    var usdtext = '$' + parseFloat(global.totalUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })

    var ctx = document.getElementById("chart").getContext('2d');
    var myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            legendCallback: function (chart) {
                return createLegend(chart);
            },
            legend: {
                display: false
            },
            maintainAspectRatio: false,
            responsive: true,
            elements: {
                center: {
                    text: usdtext,
                    fontStyle: 'Helvetica',
                    sidePadding: 15
                }
            }
        }
    });

    //var legend = myDoughnutChart.generateLegend();
    //document.getElementById("legend").innerHTML = legend;

}

Chart.pluginService.register({
    beforeDraw: function (chart) {
        if (chart.config.options.elements.center) {
            //Get ctx from string
            var ctx = chart.chart.ctx;

            //Get options from the center object in options
            var centerConfig = chart.config.options.elements.center;
            var fontStyle = centerConfig.fontStyle || 'Arial';
            var txt = centerConfig.text;
            var color = centerConfig.color || '#000';
            var sidePadding = centerConfig.sidePadding || 20;
            var sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2)
            //Start with a base font of 30px
            ctx.font = "30px " + fontStyle;

            //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
            var stringWidth = ctx.measureText(txt).width;
            var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

            // Find out how much the font can grow in width.
            var widthRatio = elementWidth / stringWidth;
            var newFontSize = Math.floor(30 * widthRatio);
            var elementHeight = (chart.innerRadius * 2);

            // Pick a new font size so it will not be larger than the height of label.
            var fontSizeToUse = Math.min(newFontSize, elementHeight);

            //Set font settings to draw it correctly.
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
            var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
            ctx.font = fontSizeToUse + "px " + fontStyle;
            ctx.fillStyle = color;

            //Draw text in center
            ctx.fillText(txt, centerX, centerY);
        }
    }
});

async function submitToForm() {
    var shareConfirmation

    if (document.getElementById("saveAddress").checked) {
        shareConfirmation = confirm("Are you sure you want to share your Ethereum Address?");
    } else {
        shareConfirmation = true
    }

    if (shareConfirmation) {
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
                var range = "A:A"

                var sheet = await getSheetRange(range)

                var url = [location.protocol, '//', location.host, location.pathname].join('');

                var foliourl = url + "?row=" + (sheet.values.length + 1)

                document.getElementById("shareLink").innerHTML = `<div class="alert alert-success" role="alert">Your ethfolio can be found at: <a href="${foliourl}">${foliourl}</a></div>`

            } catch (error) {
                console.error(error)

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

            console.log("Done!")
        } else {
            document.getElementById("output").innerHTML = "Make sure to load your address first!"
        }
    } else {
        console.log("Didn't save your information.")
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

async function getSheetRange(range)
{
    extra = "P2tleT1BSXphU3lDSlVham9"
    extra += "XdWI0aElBdzM3dUZUaWZBMFB2emI3V2dtQ28"

    var response = await fetch("https://sheets.googleapis.com/v4/spreadsheets/1EVToo4kogqGNrQ-lLgl9iXJ4759p5PCbI0HxhqCCQek/values/" + range + atob(extra + "="))
    var sheet = await response.json()

    return sheet
}

async function getRow(rowNumber) {
    try {
        var range = "A" + rowNumber + ":D" + rowNumber

        var sheet = await getSheetRange(range)

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

        if (addresses) {
            console.log('recalculating')
            console.log(addresses)
            calculateAllBalances(JSON.parse(addresses), false)
        } else {
            displayAllBalances(percentage, totalUSD, addresses)
        }

    } catch (error) {
        console.error(error)
        document.getElementById("output").innerHTML = error
    }
}

window.onload = function () {
    var row = getParameterByName('row')
    var a = getParameterByName('a')
    if (row) {
        if (row > 1) {
            console.log("Getting Row " + row)
            getRow(row)
        } else {
            document.getElementById("output").innerHTML = "Not a valid row"
        }
    }

    if (a) {
        var addresses = a.split(',')
        calculateAllBalances(addresses)
    }
}