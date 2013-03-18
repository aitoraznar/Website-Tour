function postponeRankingTour(){
	alert("Postpone");
}
function endRankingTour(IdTour,Status){
	$.post(urlBase+'/tour/finishTour',{idTour:IdTour,status:Status});
}