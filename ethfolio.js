var global = {
    "percents": "",
    "balances": "",
    "fullData": "",
    "display": ""
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
function tokenConstructor(symbol, balance, price, name, percentage, total, id) {
    //These are retrieved
    this.symbol = symbol;
    this.balance = balance;
    this.price = price;
    this.name = name;
    //These are calculated
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
    var coinDict = JSON.parse(sessionStorage.coinDict)
    if (coin in coinDict) {
        return parseFloat(coinDict[coin]['price_usd'])
    } else {
        return 0
    }
    
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
                    tokObj.price = await getPrice(symbol)
                    tokObj.balance = tok['balance'] / (Math.pow(10, tok['tokenInfo']['decimals']))
                    tokens.push(tokObj)
                }
            }
        }

        //eth itself is in a different layer of the returned json
        if (balances[balance]['ETH']['balance'] > 0) {
            let ethObj = new tokenConstructor()
            ethObj.balance = balances[balance]['ETH']['balance']
            ethObj.symbol = "ETH"
            ethObj.name = "Ether"
            ethObj.price = (await getPrice('ETH')).toString()
            tokens.push(ethObj)
        }
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
    document.getElementById("submission").style.display = "none"
    document.getElementById("shareLink").innerHTML = ""
    if (event.target.classList.contains('address-input')) {
        setAddressType(event.target)
    }
});

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
    let tokensOut = []
    for (tok in tokens) {
        var token = tokens[tok]
        if (total > 0) {
            token.percentage = (token.total / total).toPrecision(4)
        } else {
            token.percentage = 0
        }
        tokensOut.push(token)
    }

    return tokensOut
}

function showSubmission() {
    document.getElementById("submission").style.display = "unset"
    var saveText = document.getElementById("saveText")
    saveText.innerText = ""
    saveText.setAttribute("class", "")
}

function deleteInput(e) {
    e.parentNode.parentNode.removeChild(e.parentNode)
}

function addInput(value, disabled = false) {
    var inputGroup = document.createElement("div")
    inputGroup.setAttribute("class", "input-group address")
    var input = document.createElement("input")
    input.setAttribute("type", "text")
    input.setAttribute("class", "form-control address-input")
    input.setAttribute("placeholder", "ETH, BTC, or LTC Address")


    var span = document.createElement("span")
    span.setAttribute("class", "input-group-addon token-label-2")

    inputGroup.appendChild(input)
    inputGroup.appendChild(span)

    if (disabled) {
        input.disabled = true;
    } else {
        var del = document.createElement("span")
        del.setAttribute("class", "input-group-addon btn-danger thin-close text-center")
        del.innerHTML = "&times;"
        del.setAttribute("onclick", "deleteInput(this);")
        inputGroup.appendChild(del)
    }

    if (value) {
        input.setAttribute("value", value)
        setAddressType(input)
    }


    document.getElementById('inputs').appendChild(inputGroup)
}

async function getAllTokens() {
    //Get all token metadata from coinmarketcap
    var update = true;

    //only call once per minute
    if (sessionStorage.time) {
        let d = new Date();
        let timeDiff = d.getTime() - sessionStorage.time
        let minutes = Math.floor((timeDiff / 1000) / 60);
        if (minutes < 1) {
            update = false;
        }
    }

    if (!sessionStorage.coinDict || update) {
        var coinDict = {}
        try {
            let d = new Date();
            sessionStorage.time = d.getTime();
            console.log("Fetching price data from Coinmarketcap at:" + JSON.parse(sessionStorage.time))
            var response = await fetch('https://api.coinmarketcap.com/v1/ticker/?limit=0');
            var data = await response.json()

            for (tok in data) {
                let token = data[tok]
                if (token.symbol in coinDict) {
                    console.log("Hmm... two tokens with the same symbol: " + token.symbol)
                } else {
                    coinDict[token.symbol] = token
                }
            }
        } catch (error) {
            console.log(error)
        }
        return JSON.stringify(coinDict);
    } else {
        return sessionStorage.coinDict
    }
}

async function addCustomToken(customToken, disabled = false) {

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
    input.setAttribute("placeholder", "# or total $ of token")

    var sym = document.createElement("input")
    sym.setAttribute("class", "input-group-addon token-label")
    sym.setAttribute("type", "text")
    sym.setAttribute("placeholder", "SYM")

    inputGroup.appendChild(dropdown)
    inputGroup.appendChild(input)
    inputGroup.appendChild(sym)

    if (disabled) {
        dropdown.disabled = true;
        input.disabled = true;
        sym.disabled = true;
    } else {
        var del = document.createElement("span")
        del.setAttribute("class", "input-group-addon btn-danger thin-close text-center")
        del.innerHTML = "&times;"
        del.setAttribute("onclick", "deleteInput(this);")
        inputGroup.appendChild(del)
    }

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

function collectCustomTokens() {
    var output = []

    var inputgroups = document.getElementsByClassName("custom-token");

    for (let i = 0; i < inputgroups.length; i++) {
        var type = inputgroups[i].getElementsByClassName("custom-type")[0].value
        var value = inputgroups[i].getElementsByTagName("input")[0].value
        var sym = inputgroups[i].getElementsByClassName("token-label")[0].value

        if (value != "" && sym != "") {
            value = value.split(",").join("")
            sym = sym.toUpperCase();
            output.push([type, value, sym])
        }

    }

    return output

}

async function getCustomTokens(customTokensInput) {

    var customTokens = []

    for (tok in customTokensInput) {

        var type = customTokensInput[tok][0]
        var value = customTokensInput[tok][1]
        var sym = customTokensInput[tok][2]

        var token = new tokenConstructor()
        //take into account commas in the value

        token.symbol = sym

        if (type == 'dollar') {
            token.price = await getPrice(sym)
            if (token.price) {
                token.balance = value / token.price;
            } else {
                token.total = parseFloat(value);
            }
        } else if (type == 'number') {
            token.balance = parseFloat(value);
            token.price = await getPrice(sym);
        }

        customTokens.push(token)
    }

    return customTokens;
}

function consolidateTokens(tokens) {
    var tokenDict = {}
    var orderedTokens = []

    for (tok in tokens) {
        var token = tokens[tok]
        if (token.balance && token.price) {
            token.total = token.price * token.balance
        }

        //catch any problems with the total
        if (isNaN(token.total)) {
            token.total = 0;
        }

        if (token.symbol in tokenDict) {
            console.log("Consolidating: " + token.symbol)
            tokenDict[token.symbol].total += token.total;
            tokenDict[token.symbol].balance += token.balance;
        } else {
            tokenDict[token.symbol] = token
        }
    }

    for (token in tokenDict) {
        orderedTokens.push(tokenDict[token])
    }

    //order the tokens by relative percentage of the total
    orderedTokens.sort(compareTotal)

    return orderedTokens
}

async function calculateAllBalances(newAddress = true) {
    try {
        //All tokens, raw
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

        //get custom tokens from inputs
        var customTokensInput = collectCustomTokens()
        if (customTokensInput) {
        //get custom token prices, populate the token objects
            var customTokens = await getCustomTokens(customTokensInput)
            tokens = tokens.concat(customTokens)
        }

        //Combining all duplicate tokens, their balance, and total value, then ordering by total value
        //This is a sorted array
        var consolidatedTokens = consolidateTokens(tokens)

        //find total value of all tokens, also calculate total per token
        var total = totalPrice(consolidatedTokens)

        //calculate the percentage each token represents of the USD total
        consolidatedTokens = percentageOfTotal(consolidatedTokens, total)

        //At this point, we have all the data we need to create our various outputs.
        //Need to transform data to have the right amount of info per save settings

        //1. Array of Token Symbol + Percentage
        var percentOut = []
        for (tok in consolidatedTokens) {
            let token = consolidatedTokens[tok]
            percentOut.push([token.symbol, token.percentage])
        }

        //2. Array of Tokens as Custom Inputs ([type,value,symbol])
        var balanceOut = []
        for (tok in consolidatedTokens) {
            let token = consolidatedTokens[tok]
            if (token.balance) {
                balanceOut.push(['number', token.balance, token.symbol])
            } else {
                balanceOut.push(['dollar', token.total, token.symbol])
            }
        }

        //3. Address + Custom Token Information... all the data that was inputted into the site, not condensed
        var addressOut = [];
        for (addressType in addresses) {
            addressOut = addressOut.concat(addresses[addressType]);
        }
        var customInputsOut = customTokensInput;

        fullDataOut = [addressOut, customInputsOut]

        //4. The information we ultimately want to display as a whole
        var displayOut = []
        for (tok in consolidatedTokens) {
            let token = consolidatedTokens[tok];
            displayOut.push([token.symbol, token.percentage, token.balance, token.price, token.total])
        }


        //convert to JSON to be stored in sheets
        global.percents = JSON.stringify(percentOut)
        global.balances = JSON.stringify(balanceOut)
        global.fullData = JSON.stringify(fullDataOut)

        displayAllBalances(displayOut, total);

        if (newAddress) {
            showSubmission();
        }

    } catch (error) {
        document.getElementById("output").innerHTML = error
        console.error(error)
    }
}

function displayAllBalances(tokens, total) {
    document.getElementById("output").innerHTML = ""

    //check there is at least one element
    if (total) {
        var totalString
        //if you have more than $1000, who cares about cents?
        if (parseFloat(total) < 1000) {
            // add a comma to thousands place, ensure that it is 2 running decimals
            totalString = '$' + parseFloat(total).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
        } else {
            totalString = '$' + parseFloat(total).toLocaleString(undefined, { maximumFractionDigits: 0 })
        }
    }

    var table = ""

    //Check if we have extended data, or just percentages
    var extendedTable = false;
    if (tokens[0].length > 2) {
        extendedTable = true;
    }

    //note we check if total is available, if so, add it to the table
    table += `<table class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col" class="col-color"></th>
                            <th scope="col"></th>
                            <th scope="col">Token</th>
                            <th scope="col">%</th>
                            ${ extendedTable ? '<th scope="col">$</th>' : ''}
                            ${ extendedTable ? '<th scope="col">#</th>' : ''}
                            ${ extendedTable ? '<th scope="col">$/#</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>`

    var view = []
    var other = ["Other", 0]

    for (tok in tokens) {
        let token = tokens[tok]
        let symbol = token[0]
        let percentage = parseFloat(token[1])

        if (percentage < .005) {
            other[1] += percentage
        } else {
            view.push([symbol, percentage])
        }
    }

    if (other[1] > 0) {
        view.push(other)
    }

    createGraph(view, totalString);
    var legend = createLegend(window.myDoughnutChart)

    var count = 0;
    for (tok in tokens) {
        count++;

        let token = tokens[tok];
        let symbol = token[0]
        let percentage = parseFloat(token[1])

        console.log(token[3],(token[3]).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }))

        table += `<tr>
                        <td class="col-color" style="background-color: ${legend[symbol] ? legend[symbol] : legend['Other']}" ></td>
                        <th scope="row">${count}</th>
                        <td>${symbol}</td>
                        <td>${(percentage * 100).toPrecision(4) + "%"}</td>
                        ${ extendedTable ? (token[4] ? '<td>$' + (token[4] < 1 ? (token[4]).toPrecision(4) : (token[4]).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })) + '</td>' : '<td>?</td>') : ''}
                        ${ extendedTable ? (token[2] ? '<td>' + (token[2] < 1 ? (token[2]).toPrecision(4) : token[2] < 1000 ? (token[2]).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : (token[2]).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })) + '</td>' : '<td>?</td>') : ''}
                        ${ extendedTable ? (token[3] ? '<td>$' + (token[3] < 1 ? (token[3]).toPrecision(4) : (token[3]).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })) + '</td>' : '<td>?</td>') : ''}
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
    var shareConfirmation = true

    var saveText = document.getElementById("saveText")

    if (global.percents == "") {
        saveText.setAttribute("class", "text-danger no-margin")
        saveText.innerText = "It doesn't look like you have any tokens in your portfolio."
    } else {
        if (document.getElementById("saveAddress").checked) {
            shareConfirmation = confirm("Are you sure you want to share your Ethereum Address?");
        }

        if (shareConfirmation) {

            form = {
                formId: "1FAIpQLScUslukowSoxtDokclveTORdhmlEUHV1lTcaESbTCguuzwZxw",
                dataType: "500393463",
                data: "1940177998",
                extra1: "143080195",
                extra2: "1637198069"
            }

            var datatype
            var data

            if (document.getElementById("saveAddress").checked) {
                datatype = 3
                data = global.fullData
            } else if (document.getElementById("saveTotal").checked) {
                datatype = 2
                data = global.balances
            } else {
                datatype = 1
                data = global.percents
            }

            let payload = "entry." + form.dataType + "=" + datatype + "&entry." + form.data + "=" + data;

            //testing the limits of google form payload
            if (payload.length < 32700) {
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
                    var response = await fetch("https://docs.google.com/forms/d/e/" + form.formId + "/formResponse",
                        {
                            method: "POST",
                            headers: new Headers({
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }),
                            body: payload
                        })
                } catch (error) {
                    console.error(error)
                }

                console.log("Done!")
            } else {
                saveText.setAttribute("class", "text-danger no-margin")
                saveText.innerText = "Too much data to save... message shawntabrizi@gmail.com, and tell him you saw this error."
            }
        } else {
            saveText.innerText = "Didn't save your information."
            saveText.setAttribute("class", "no-margin")
        }
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

function parseQueryStrings() {
    var queryStrings = {};
    var url = window.location.search.substring(1);
    if (url) {
        var pairs = url.split("&");
        for (pair in pairs) {
            pairArray = pairs[pair].split("=");
            let name = pairArray[0]
            let value = pairArray[1]

            if (name in queryStrings) {
                queryStrings[name].push(value)
            } else {
                queryStrings[name] = [value]
            }
        }
    }
    
    return queryStrings;
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
        var values = sheet.values[0]

        if (sheet.values) {
            if (values.length >= 2 && values.length < 6) {
                var time = values[0]
                var dataType = parseInt(values[1])
                var data = JSON.parse(values[2])

                if (dataType == 1) {
                    //expecting just percent data
                    displayAllBalances(data)
                }else if (dataType == 2) {
                    //expecting custom data input consolidated
                    setCustomTokens(data)
                    document.getElementById("inputs").style.display = 'none';
                    calculateAllBalances(false);
                } else if (dataType == 3) {
                    //expecting custom data input and addresses
                    console.log(data)
                    if (data[0]) {
                        setAddresses(data[0])
                    }
                    if (data[1]) {
                        setCustomTokens(data[1])
                    }
                    document.getElementById("inputs").setAttribute("class", "condensed-input");
                    calculateAllBalances(false);
                } else {
                    document.getElementById('output').innerHTML = "Unknown data type..."
                }
            } else {
                document.getElementById('output').innerHTML = "Hmm... something wrong with google sheet response."
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
        addCustomToken(customTokens[token], true)
    }
}

function setAddresses(addresses) {
    //add a disabled input field with value for each address we loaded
    addresses = [...new Set(addresses)]
    for (address in addresses) {
        addInput(addresses[address], true)
    }
}

function addCallToAction() {
    var buttons = document.getElementById("actionButtons")
    buttons.innerHTML = '<div class="text-center"><br><a class="btn btn-success" role="button" href=".">Create your own portfolio ></a><div>'
}

window.onload = async function () {

    var queryStrings = parseQueryStrings();

    if (Object.keys(queryStrings).length > 0) {
        //Get data from coinmarketcap data
        sessionStorage.coinDict = await getAllTokens();
        if ('row' in queryStrings) {
            let row = queryStrings['row'][0]
            if (row > 1) {
                console.log("Getting Row " + row);
                document.getElementById("output").innerHTML = "<h2 class='text-center'>Loading portfolio...</h2>";
                getRow(row);
                addCallToAction();
            } else {
                document.getElementById("output").innerHTML = "Not a valid row";
            }
        } else {
            document.getElementById("output").innerHTML = "<h2 class='text-center'>Loading portfolio...</h2>";
            for (name in queryStrings) {
                if (name == 'a'){
                    let a = queryStrings['a'].join()
                    var addresses = a.split(',')
                    setAddresses(addresses, 1);
                } else {
                    let tokenValues = queryStrings[name].join()
                    tokenValues = tokenValues.split(',')
                    for (token in tokenValues) {
                        var value = tokenValues[token]
                        var sym = name
                        var type
                        if(value[0] == '$') {
                            type = 'dollar'
                            value = value.slice(1)
                        } else {
                            type = 'number'
                        }
                        addCustomToken([type,value,sym],true)
                    }
                }

            }
            calculateAllBalances(false);
            addCallToAction();

        }
    } else {
        document.getElementsByClassName("walkthrough")[0].style.display = "unset";
        //Get data from coinmarketcap after loading the page
        sessionStorage.coinDict = await getAllTokens();
    }
}