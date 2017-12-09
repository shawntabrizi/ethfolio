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

async function getBTCBalances(addresses) {
    try {

        var btctoken = new tokenConstructor()
        btctoken.symbol = "BTC"
        btctoken.name = "Bitcoin"
        btctoken.price = (await getPrice('BTC')).toString()
        btctoken.balance = 0

        var addressesBar = ""
        for (address in addresses) {
            addressesBar += addresses[address] + "|"
        }
        var response = await fetch("https://blockchain.info/balance?cors=true&active=" + addressesBar)
        var data = await response.json()

        for (item in data) {
            btctoken.balance += data[item].final_balance / (Math.pow(10, 8))
        }

        console.log(btctoken.balance)

        return btctoken

    } catch (error) {
        console.log(error)
        throw (error)
    }
}

async function getLTCBalances(addresses) {
    try {

        var ltctoken = new tokenConstructor()
        ltctoken.symbol = "LTC"
        ltctoken.name = "Litecoin"
        ltctoken.price = (await getPrice('LTC')).toString()
        ltctoken.balance = 0

        var data = await Promise.all(
            addresses.map(
                address =>
                    fetch("https://api.blockcypher.com/v1/ltc/main/addrs/" + address + "/balance").then(
                        (response) => response.json()
                    )));

        for (item in data) {
            ltctoken.balance += data[item].final_balance / (Math.pow(10, 8))
        }

        console.log(ltctoken.balance)

        return ltctoken

    } catch (error) {
        console.log(error)
        throw (error)
    }
}

async function getETHBalances(addresses) {
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

async function getPrice(coin) {
    var response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=' + coin + '&tsyms=USD')
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
    ethObj.price = (await getPrice('ETH')).toString()
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

    if (aTotal < bTotal) {
        return 1;
    }
    if (aTotal > bTotal) {
        return -1;
    }
    return 0;
}



//Check address type
document.getElementById("inputs").addEventListener('keyup', function (event) {
    if (event.target.tagName.toLowerCase() === 'input') {
        var addressType = discoverAddressType(event.target.value)
        if (event.target.nextElementSibling.tagName.toLowerCase() === 'span')
        {
            event.target.nextElementSibling.innerHTML = addressType
            if (addressType == 'BTC') {
                event.target.nextElementSibling.setAttribute("class", "input-group-addon bg-warning token-label")
            } else if (addressType == 'LTC') {
                event.target.nextElementSibling.setAttribute("class", "input-group-addon bg-info text-white token-label")
            } else if (addressType == 'ETH') {
                event.target.nextElementSibling.setAttribute("class", "input-group-addon bg-dark text-white token-label")
            } else {
                event.target.nextElementSibling.setAttribute("class", "input-group-addon token-label-2")
            }
        }
        
    }
})

function discoverAddressType(address) {

    if (/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        //ETH
        return 'ETH';
    } else if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
        //BTC
        return 'BTC';
    } else if (/^L[a-zA-Z0-9]{26,33}$/.test(address)) {
        //LTC
        return 'LTC';
    } else {
        return '?'
    }
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
    var inputGroup = document.createElement("div")
    inputGroup.setAttribute("class", "input-group address")
    var input = document.createElement("input")
    input.setAttribute("type", "text")
    input.setAttribute("class", "form-control")
    var span = document.createElement("span")
    span.setAttribute("class", "input-group-addon token-label-2")

    inputGroup.appendChild(input)
    inputGroup.appendChild(span)

    document.getElementById('inputs').appendChild(inputGroup)
}

function collectAddresses(addresses) {

    var output = {}
    var inputgroups = document.getElementsByClassName("address");

    for (let i = 0; i < inputgroups.length; i++) {
        var address = inputgroups[i].getElementsByTagName('input')[0].value
        var addressType = inputgroups[i].getElementsByTagName('span')[0].innerHTML

        if (typeof address !== "undefined" && address !== "" && addressType !== '?' && addressType !== '') {
            if (!output[addressType]) {
                output[addressType] = []
            }
            output[addressType].push(address)
        }
    }

    console.log(output)

    return output
}

function addBTCandLTC(balances, btc, ltc) {

}

async function calculateAllBalances(addresses = [], newAddress = true) {
    try {

        if (addresses.length == 0) {
            var addresses = collectAddresses(addresses)
            var tokens = []
        }

        if (addresses.ETH) {
            var balances = await getETHBalances(addresses.ETH)
            tokens = await collectTokens(balances)
        }

        console.log(tokens)
        if (addresses.BTC) {
            tokens.push(await getBTCBalances(addresses.BTC))
        }

        if (addresses.LTC) {
            tokens.push(await getLTCBalances(addresses.LTC))
        }

        tokens.sort(compareTotal)

        var total = totalPrice(tokens)

        var output = []

        percentageOfTotal(tokens, total)


        for (symbol in tokens) {
            token = tokens[symbol]
            output.push([token.symbol, (token.percentage).toPrecision(4)])
        }

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
    document.getElementById("output").innerHTML = ""

    var output = JSON.parse(outputJSON)
    if (totalJSON) {
        var total = JSON.parse(totalJSON)
        if (parseFloat(total) < 1000) {
            total = '$' + parseFloat(total).toLocaleString(undefined, { maximumFractionDigits: 2 })
        } else {
            total = '$' + parseFloat(total).toLocaleString(undefined, { maximumFractionDigits: 0 })
        }
    }

    if (accountsJSON) {
        var accounts = JSON.parse(accountsJSON)
    }

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

    if (other[1] > 0) {
        view.push(other)
    }


    createGraph(view, total);

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


function createGraph(input, total) {

    document.getElementById("chartArea").style.display = "unset"

    var datasets = []
    var labels = []

    for (tok in input) {
        datasets.push((input[tok][1] * 100).toPrecision(4))
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

    if (!total) {
        total = ""
    }

    var ctx = document.getElementById("chart").getContext('2d');

    if (window.myDoughnutChart) {
        window.myDoughnutChart.destroy();
    }

    window.myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            legendCallback: function (chart) {
                return createLegend(chart);
            },
            legend: {
                display: false
            },
            tooltips: {
                mode: 'label',
                callbacks: {
                    label: function (tooltipItem, data) {
                        return data.labels[tooltipItem.index] + ': ' + data['datasets'][0]['data'][tooltipItem.index] + '%';
                    }
                }
            },
            maintainAspectRatio: false,
            responsive: true,
            elements: {
                center: {
                    text: total,
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