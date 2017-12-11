var global = {
    "tokens": "",
    "totalUsd": "",
    "accounts": "",
    "output": "",
    "customTokens": "",
    "cryptoCompareTokens": null
};

//only allow save address if save total is selected
function checkAddress() {
    if (document.getElementById("saveTotal").checked === true) {
        document.getElementById("saveAddress").disabled = false;
    } else {
        document.getElementById("saveAddress").disabled = true;
        document.getElementById("saveAddress").checked = false;
    }

}

//token object
function tokenConstructor(symbol, balance, price, name, percentage, total) {
    this.symbol = symbol;
    this.balance = balance;
    this.price = price;
    this.name = name;
    this.percentage = percentage;
    this.total = total;
}

//get balance of BTC address
async function getBTCBalances(addresses) {
    try {

        var btctoken = new tokenConstructor();
        btctoken.symbol = "BTC";
        btctoken.name = "Bitcoin";
        btctoken.price = (await getPrice('BTC')).toString();
        btctoken.balance = 0;

        var addressesBar = "";
        for (var address in addresses) {
            addressesBar += addresses[address] + "|";
        }
        var response = await fetch("https://blockchain.info/balance?cors=true&active=" + addressesBar);
        var data = await response.json();

        for (var item in data) {
            btctoken.balance += data[item].final_balance / (Math.pow(10, 8));
        }

        return btctoken;

    } catch (error) {
        console.log(error)
        throw (error)
    }
}

//get the balance of a LTC address
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

        return ltctoken

    } catch (error) {
        console.log(error)
        throw (error)
    }
}

//get all tokens at an ETH address
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

//get the price of a coin by symbol
async function getPrice(coin) {
    var response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=' + coin + '&tsyms=USD')
    var price = await response.json()
    return price['USD']
}

//parse and collect all the eth tokens
async function collectTokens(balances) {
    var tokens = []
    var totalPrice = 0


    for (balance in balances) {
        for (bal in balances[balance]['tokens']) {
            let tok = balances[balance]['tokens'][bal]
            let price = tok['tokenInfo']['price']
            if (price != false) {
                if (price['rate'] != null) {
                    var symbol = tok['tokenInfo']['symbol']
                    let tokObj = new tokenConstructor()
                    tokObj.symbol = symbol
                    tokObj.price = price['rate']
                    tokObj.name = tok['tokenInfo']['name']
                    tokObj.balance = tok['balance'] / (Math.pow(10, tok['tokenInfo']['decimals']))
                    tokens.push(tokObj)
                }
            }
        }

        //eth itself is in a different layer of the returned json
        let ethObj = new tokenConstructor()
        ethObj.balance = balances[balance]['ETH']['balance']
        ethObj.symbol = "ETH"
        ethObj.name = "Ether"
        ethObj.price = (await getPrice('ETH')).toString()
        tokens.push(ethObj)
    }

    return tokens
}


//calculate the total price of all the tokens
function totalPrice(tokens) {
    let total = 0

    for (tok in tokens) {
        token = tokens[tok]
        total += token.total
    }

    return total
}

//sort tokens by relative price
function compareTotal(a, b) {

    if (a.total < b.total) {
        return 1;
    }
    if (a.total > b.total) {
        return -1;
    }
    return 0;
}



//Check address type
document.getElementById("inputs").addEventListener('input', function (event) {
    if (event.target.classList.contains('address-input')) {
        setAddressType(event.target)
    }
})

function setAddressType(element) {
    var addressType = discoverAddressType(element.value)
    if (element.nextElementSibling.tagName.toLowerCase() === 'span') {
        element.nextElementSibling.innerHTML = addressType
        if (addressType == 'BTC') {
            element.nextElementSibling.setAttribute("class", "input-group-addon bg-warning token-label")
        } else if (addressType == 'LTC') {
            element.nextElementSibling.setAttribute("class", "input-group-addon bg-info text-white token-label")
        } else if (addressType == 'ETH') {
            element.nextElementSibling.setAttribute("class", "input-group-addon bg-dark text-white token-label")
        } else {
            element.nextElementSibling.setAttribute("class", "input-group-addon token-label-2 bg-danger")
        }
    }
}

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
        if (total > 0) {
            token.percentage = token.total / total
        } else {
            token.percentage = 0
        }
    }
}

function showSubmission() {
    document.getElementById("submission").style.display = "unset"
}

function addInput(value) {
    var inputGroup = document.createElement("div")
    inputGroup.setAttribute("class", "input-group address")
    var input = document.createElement("input")
    input.setAttribute("type", "text")
    input.setAttribute("class", "form-control address-input")

    var span = document.createElement("span")
    span.setAttribute("class", "input-group-addon token-label-2")

    inputGroup.appendChild(input)
    inputGroup.appendChild(span)
    if (value) {
        input.setAttribute("value", value)
        setAddressType(input)
    }


    document.getElementById('inputs').appendChild(inputGroup)
}

async function fetchCustomTokens() {
    var response = await fetch('https://min-api.cryptocompare.com/data/all/coinlist');
    var data = await response.json()

    return data['Data']
}

async function addCustomToken(customToken) {

    if (customToken) {
        var type = customToken[0]
        var value = customToken[1]
        var symbol = customToken[2]
    }


    var inputGroup = document.createElement("div")
    inputGroup.setAttribute("class", "input-group custom-token")

    var dropdown = document.createElement("select")
    dropdown.setAttribute("class", "btn input-group-addon custom-type")
    var dollar = document.createElement("option")
    dollar.innerText = "$"
    dollar.value = "dollar"
    var number = document.createElement("option")
    number.innerText = "#"
    number.value = "number"

    dropdown.appendChild(number)
    dropdown.appendChild(dollar)

    var input = document.createElement("input")
    input.setAttribute("type", "text")
    input.setAttribute("class", "form-control")


    // This code makes a drop down list of all the tokens available on CryptoCompare
    /*
    var sym = document.createElement("select")
    sym.setAttribute("class", "input-group-addon symbol-select")

    if (!global.cryptoCompareTokens) {
        global.cryptoCompareTokens = await fetchCustomTokens();
    }

    var options = []

    
    for (token in global.cryptoCompareTokens) {
        let option = document.createElement("option")
        option.innerText = token;
        option.value = token;
        option.setAttribute('data-sort-order', global.cryptoCompareTokens[token]['SortOrder'])
        options.push(option)
    }

    options = options.sort(sortOrder)

    for (option in options) {
        sym.appendChild(options[option])
    }
    */

    var sym = document.createElement("input")
    sym.setAttribute("class", "input-group-addon token-label")
    sym.setAttribute("type", "text")
    sym.value = "SYM"

    inputGroup.appendChild(dropdown)
    inputGroup.appendChild(input)
    inputGroup.appendChild(sym)

    if (type) {
        dropdown.value = type;
    }
    if (value) {
        input.value = value;
    }
    if (symbol) {
        sym.value = symbol;
    }


    document.getElementById('inputs').appendChild(inputGroup)
}

function sortOrder(a, b) {

    if (a.value < b.value) {
        return -1;
    }
    if (a.value > b.value) {
        return 1;
    }

    return 0;
}

function collectAddresses(addresses) {

    var output = {}
    var inputgroups = document.getElementsByClassName("address");

    //looping backwards because we are removing elements at the same time
    for (let i = inputgroups.length - 1; i >= 0; i--) {
        var address = inputgroups[i].getElementsByTagName('input')[0].value
        var addressType = inputgroups[i].getElementsByTagName('span')[0].innerHTML

        if (typeof address !== "undefined" && address !== "" && addressType !== '?' && addressType !== '') {
            if (!output[addressType]) {
                output[addressType] = []
            }
            //does address already exist in list?
            if (output[addressType].indexOf(address) === -1) {
                output[addressType].push(address)
            } else {
                //if it does, then remove that input element
                inputgroups[i].remove();
            }
        }
    }


    return output
}

function storeCustomTokens() {
    var output = []

    var inputgroups = document.getElementsByClassName("custom-token");

    for (let i = 0; i < inputgroups.length; i++) {
        var type = inputgroups[i].getElementsByClassName("custom-type")[0].value
        var value = inputgroups[i].getElementsByTagName("input")[0].value
        var sym = inputgroups[i].getElementsByClassName("token-label")[0].value

        output.push([type, value, sym])

    }

    return output

}

async function collectCustomTokens() {
    var inputgroups = document.getElementsByClassName("custom-token");

    var customTokens = []

    for (let i = inputgroups.length - 1; i >= 0; i--) {
        var type = inputgroups[i].getElementsByTagName("select")[0].value;
        var value = inputgroups[i].getElementsByClassName("form-control")[0].value
        var sym = inputgroups[i].getElementsByClassName("token-label")[0].value

        if (type && value && sym) {

            var token = new tokenConstructor()

            if (type == 'dollar') {
                token.symbol = sym
                token.total = parseFloat(value)
                if (global.cryptoCompareTokens) {
                    if (global.cryptoCompareTokens[sym]) {
                        token.name = global.cryptoCompareTokens[sym]['CoinName']
                    }
                }
            } else if (type == 'number') {
                token.symbol = sym
                if (global.cryptoCompareTokens) {
                    if (global.cryptoCompareTokens[sym]) {
                        token.name = global.cryptoCompareTokens[sym]['CoinName']
                    }
                }
                token.balance = parseFloat(value)
                token.price = await getPrice(sym)
            }

            customTokens.push(token)
        }
    }


    return customTokens;
}

function consolidateTokens(tokens) {
    tokenTracker = {}
    outputTokens = []

    for (tok in tokens) {
        var token = tokens[tok]
        if (!token.total) {
            token.total = token.price * token.balance
        }

        if (isNaN(token.total)) {
            token.total = 0;
        }

        if (token.symbol in tokenTracker) {
            console.log("Consolidating: " + token.symbol)
            tokenTracker[token.symbol].total += token.total;
        } else {
            tokenTracker[token.symbol] = token
        }
    }

    for (token in tokenTracker) {
        outputTokens.push(tokenTracker[token])
    }

    return outputTokens
}

async function calculateAllBalances(newAddress = true) {
    try {
        var tokens = []

        //Addresses should always be populated in the inputs section
        var addresses = collectAddresses(addresses)

        //get ETH info
        if (addresses.ETH) {
            var balances = await getETHBalances(addresses.ETH)
            tokens = await collectTokens(balances)
        }

        //get BTC info
        if (addresses.BTC) {
            tokens.push(await getBTCBalances(addresses.BTC))
        }

        //get LTC info
        if (addresses.LTC) {
            tokens.push(await getLTCBalances(addresses.LTC))
        }

        //get custom tokens
        var customTokens = await collectCustomTokens()

        if (customTokens) {
            tokens = tokens.concat(customTokens)
        }

        tokens = consolidateTokens(tokens)

        //find total value of all tokens, also calculate total per token
        var total = totalPrice(tokens)

        //sort tokens by relative value
        tokens.sort(compareTotal)

        //This stores the main data that will be saved, tokens and percentages
        var output = []

        //calculate the percentage each token represents of the USD total
        percentageOfTotal(tokens, total)

        //tokens has more data than we need, so we cut it down to save space on sheets
        for (symbol in tokens) {
            token = tokens[symbol]
            output.push([token.symbol, (token.percentage).toPrecision(4)])
        }

        //store custom tokens
        var customTokensOut = storeCustomTokens()

        //convert to JSON to be stored
        global.tokens = JSON.stringify(tokens)
        global.accounts = JSON.stringify(addresses)
        global.totalUsd = JSON.stringify(total)
        global.output = JSON.stringify(output)
        global.customTokens = JSON.stringify(customTokensOut)

        displayAllBalances(global.output, global.totalUsd);
        if (newAddress) {
            showSubmission();
        }

    } catch (error) {
        document.getElementById("output").innerHTML = error
        console.error(error)
    }
}

function displayAllBalances(outputJSON, totalJSON) {
    document.getElementById("output").innerHTML = ""

    var output = JSON.parse(outputJSON)
    var totalString = ""

    if (totalJSON) {
        var total = JSON.parse(totalJSON)
        //if you have more than $1000, who cares about cents?
        if (parseFloat(total) < 1000) {
            // add a comma to thousands place, ensure that it is 2 running decimals
            totalString = '$' + parseFloat(total).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
        } else {
            totalString = '$' + parseFloat(total).toLocaleString(undefined, { maximumFractionDigits: 0 })
        }
    }

    var table = ""

    //note we check if total is available, if so, add it to the table
    table += `<table class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col" class="col-color"></th>
                            <th scope="col">#</th>
                            <th scope="col">Token</th>
                            <th scope="col">%</th>
                            ${ total ? '<th scope="col">USD</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>`

    var view = []
    var other = ["Other", 0]

    for (symbol in output) {
        token = output[symbol][0]
        percentage = parseFloat(output[symbol][1])
        if (percentage < .005) {
            other[1] += percentage
        } else {
            view.push([token, percentage])
        }
    }

    if (other[1] > 0) {
        view.push(other)
    }

    createGraph(view, totalString);
    var legend = createLegend(window.myDoughnutChart)


    for (symbol in output) {
        token = output[symbol][0]
        percentage = parseFloat(output[symbol][1])

        table += `<tr>
                        <td class="col-color" style="background-color: ${legend[token] ? legend[token] : legend['Other']}" ></td>
                        <th scope="row">${parseInt(symbol) + 1}</th>
                        <td>${token}</td>
                        <td>${(percentage * 100).toPrecision(4) + "%"}</td>
                        ${ total ? '<td>$' + (percentage * total).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + '</td>' : ''}
                    </tr>`


    }

    table += `</tbody>
                </table>`

    document.getElementById("output").innerHTML = table



}

function createLegend(chart) {
    var legend = {}
    for (let i = 0; i < chart.data.labels.length; i++) {
        legend[chart.data.labels[i]] = chart.data.datasets[0].backgroundColor[i]
    }

    return legend
}

//create the donught chart
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
                    //add % to the label
                    label: function (tooltipItem, data) {
                        return data.labels[tooltipItem.index] + ': ' + data['datasets'][0]['data'][tooltipItem.index] + '%';
                    }
                }
            },
            maintainAspectRatio: false,
            responsive: true,
            elements: {
                //add total amount to the center
                center: {
                    text: total,
                    fontStyle: 'Helvetica',
                    sidePadding: 15
                }
            }
        }
    });

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

//submit data to the google form
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
                accounts: "143080195",
                customTokens: "1637198069"
            }

            let entries = ""

            entries += "&entry." + form.percentage + "=" + global.output
            if (document.getElementById("saveTotal").checked) {
                entries += "&entry." + form.totalUsd + "=" + global.totalUsd
            }
            if (document.getElementById("saveAddress").checked) {
                entries += "&entry." + form.accounts + "=" + global.accounts
                entries += "&entry." + form.customTokens + "=" + global.customTokens
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

//detect querystrings
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

//call the google sheets api
async function getSheetRange(range) {
    extra = "P2tleT1BSXphU3lDSlVham9"
    extra += "XdWI0aElBdzM3dUZUaWZBMFB2emI3V2dtQ28"

    var response = await fetch("https://sheets.googleapis.com/v4/spreadsheets/1EVToo4kogqGNrQ-lLgl9iXJ4759p5PCbI0HxhqCCQek/values/" + range + atob(extra + "="))
    var sheet = await response.json()

    return sheet
}

//retrieve data from google sheets
async function getRow(rowNumber) {
    try {
        var range = "A" + rowNumber + ":E" + rowNumber

        var sheet = await getSheetRange(range)

        if (sheet.values) {

            var values = sheet.values[0]

            if (values.length >= 2 && values.length < 6) {
                var time = values[0]
                var percentage = values[1]
                if (values[2]) {
                    var totalUSD = values[2]
                }
                if (values[3]) {
                    var addresses = values[3]
                }
                if (values[4]) {
                    var customTokens = values[4]
                }
            } else {
                console.log("Hmm... something wrong with google sheet response.")
            }

            if (addresses) {
                console.log('recalculating')
                setAddresses(JSON.parse(addresses))
                if (customTokens) {
                    setCustomTokens(JSON.parse(customTokens))
                }
                calculateAllBalances(false)
            } else {
                displayAllBalances(percentage, totalUSD)
            }
        } else {
            document.getElementById('output').innerHTML = "No data found at that row... if you just saved, wait a second and refresh the page."
        }

    } catch (error) {
        console.error(error)
        document.getElementById("output").innerHTML = error
    }
}

function setCustomTokens(customTokens) {
    var inputs = document.getElementById("inputs");

    for (token in customTokens) {
        addCustomToken(customTokens[token])
    }
}

function setAddresses(addresses, depth = 2) {
    //removing the first blank line
    var inputs = document.getElementById('inputs')
    while (inputs.firstChild) {
        inputs.removeChild(inputs.firstChild)
    }
    //add an input field with value for each address we loaded
    if (depth == 2) {
        for (addresstype in addresses) {
            //remove duplicates in array
            addresses[addresstype] = [...new Set(addresses[addresstype])]
            for (address in addresses[addresstype]) {
                addInput(addresses[addresstype][address])
            }
        }
    } else if (depth == 1) {
        addresses = [...new Set(addresses)]
        for (address in addresses) {
            addInput(addresses[address])
        }
    }
}

window.onload = async function () {
    //Get a ton of token metadata
    //global.cryptoCompareTokens = await fetchCustomTokens();
    //check for 'row' querystring
    var row = getParameterByName('row')
    //check for 'a' querystring
    var a = getParameterByName('a')
    if (row) {
        if (row > 1) {
            console.log("Getting Row " + row)
            document.getElementById("output").innerHTML = "<h2 class='text-center'>Loading portfolio...</h2>"
            getRow(row)
        } else {
            document.getElementById("output").innerHTML = "Not a valid row"
        }
    } else if (a) {
        var addresses = a.split(',')
        document.getElementById("output").innerHTML = "<h2 class='text-center'>Loading portfolio...</h2>"
        setAddresses(addresses, 1)
        calculateAllBalances(false)
    } else {
        document.getElementsByClassName("walkthrough")[0].style.display = "unset"
    }
}