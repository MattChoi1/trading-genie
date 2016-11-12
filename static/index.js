var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
$(document).ready(function() {
	$("button#submit").click(submitQuery);
	$("#comment").keypress(function(e){
		if(e.which == 13) {
			e.preventDefault()
			submitQuery()
		}
	})
	ws.onmessage = function(event){
		if(event.data == 'ping')
		{
			console.log('staying alive')
		}
		else
		{
			console.log(event.data)
			arr = JSON.parse(event.data)
			arr.forEach(function(e, which) {
				for(var stock in e)
				{
					e[stock].forEach(function(entry, i) {
						$('#review').append('<p class="review">' + stock + ' Quote ' + i + (!which ? "'s price: " : "'s time: ") + entry + '</p>')
					})
				}
			})
		}
	}
})
function submitQuery() {
	if($("#comment").val() == "")
		return "";
	var query = {symbols: $('#symbols').val(), start: ($('#start').val() +':00').replace(/T/g, ' ').replace(/-/g, '/'), end: ($('#end').val() +':00').replace(/T/g, ' ').replace(/-/g, '/'), markets: $('#markets').val()}
	//$("#comment").val();
	$("#comment").val("");
	ws.send("quote::" + JSON.stringify(query));
	console.log("emitted " + JSON.stringify(query));
}