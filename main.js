
console.log('app started')
var querystring = require('querystring')
var express = require('express')
var http = require('http')
var xmldoc = require("xmldoc")
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
						},
						agent: undefined
					}
					function callback(response) {
						var str = ""
					    console.log("In callback")
						response.on("data", function (chunk) {
							str += chunk
						})
						response.on("end", function () {
							console.log("data received from api")
							var price = {}
							var time = {}
							var info = new xmldoc.XmlDocument(str)
							console.log('parsed')
							info.eachChild(function (stock) {
								if(stock.childNamed('Outcome').val == "RequestError")
								{
									console.log(childNamed('Message').val)
									return;
								}
								var sym = stock.childNamed('Symbol').val
								price[sym] = []
								time[sym] = []
								ws.send('stock::' + sym)
								while (stock.childNamed('Quotes').childrenNamed('Quote').length > 0)
								{
									console.log(stock.childNamed('Quotes').childrenNamed('Quote').length)
									for (var i = 0; i < Math.min(stock.childNamed('Quotes').childrenNamed('Quote').length, 100); i++) {
										datum = stock.childNamed('Quotes').childrenNamed('Quote').length.splice(0, 1)
										price[sym][i] = +(datum.childNamed('BidPrice').val)
										time[sym][i] = datum.childNamed('EndTime').val
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