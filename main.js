
console.log('app started')
var querystring = require('querystring')
var express = require('express')
var http = require('http')
var xml2json = require("simple-xml2json")
var app = express()

app.use('/', express.static(__dirname+"/static"))
var port = (process.env.PORT || 5000);
var server = http.createServer(app)
server.listen(port)

var WebSocket = require("ws")
var ws = new WebSocket('wss://trading-genie.herokuapp.com/')
var WebSocketServer = require("ws").Server
var wss = new WebSocketServer({server: server})
console.log("websocket server created")

function setUpSocket() {
	wss.on("connection", function(ws) {
		console.log("websocket connection open")
		ws.on("message", function(data) {//data from webpage
			console.log('received data')
			var stuff = JSON.parse(data.split("::")[1])
			switch (data.split("::")[0]) {
				case "quote":
				{
					var data = querystring.stringify({	'_Token' : 'BC2B181CF93B441D8C6342120EB0C971',
										'Symbols' : stuff['symbols'],
										'StartDateTime' : stuff['start'],
										'EndDateTime' : stuff['end'],
										'MarketCenters' : stuff['markets']
									})
					var options = {
						host: 'ws.nasdaqdod.com',
						path: '/v1/NASDAQQuotes.asmx/GetQuotes',
						method: 'POST',
						headers: {
						    'Content-Type': 'application/x-www-form-urlencoded',
						    'Content-Length': Buffer.byteLength(data, 'utf8')
						}
					}
					function callback(response) {
						var str = ""
					    console.log("In callback")
						response.on("data", function (chunk) {
							str += chunk
						})
						response.on("end", function () {
							console.log("data received from api")
					    	price = {}
					    	time = {}
					    	var info = JSON.stringify(xml2json.parser(str))
							string = result.ArrayOfQuoteResults.QuoteResults.forEach(function (stock) {
								if(stock.Outcome[0] == "RequestError")
								{
									console.log(stock.Message[0])
									return;
								}
								var sym = stock.Symbol
								price[sym] = []
								time[sym] = []
								ws.send('stock::' + sym)
								while (stock.Quotes[0].Quote.length > 0)
								{
									console.log(stock.Quotes[0].Quote.length)
									for (var i = 0; i < Math.min(stock.Quotes[0].Quote.length, 100); i++) {
										datum = stock.Quotes[0].Quote.splice(0, 1)[0]
										price[sym][i] = +(datum[0].BidPrice)
										time[sym][i] = datum[0].EndTime[0]
									}
									var analys = [price[sym], time[sym]]
									console.log(JSON.stringify(analys))
									ws.send(JSON.stringify([price, time]))
								}
							})
							ws.send('end')
						})
					}
					var req = http.request(options, callback)
					console.log('about to call nasdaq api')
					req.end(data, 'utf8', function() {console.log('called api')})
					break
				}
				default:
				{
					console.log('crap')
				}
			}
			setInterval(function timeout() {
				ws.send('ping')
			}, 50)
		})
		ws.on("open", function() {
			setInterval(function timeout() {
				ws.send('pong')
			}, 50)
		})
		ws.on("close", function() {
			console.log("websocket connection closed")
		})
	})
}

setUpSocket()


function callQuery(data, callback) {
	client.post('analyzesentiment', data, function(err, resp) {
		if(err)
		{
			console.log('An error occured! ' + err)
			bail(err, callback)
		}
		else
		{
			console.log('We got ' + JSON.stringify(resp.body))
			callback(resp.body);
		}
	})
}

function bail(err, callback) {
	var error = {isError: true, error: err}
	callback(error)
}