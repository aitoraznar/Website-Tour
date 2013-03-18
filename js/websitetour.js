(function($) {

	$.fn.websitetour = function(options){
		/*
		the json config obj.
		name: the class given to the element where you want the tooltip to appear
		bgcolor: the background color of the tooltip
		color: the color of the tooltip text
		text: the text inside the tooltip
		time: if automatic tour, then this is the time in ms for this step
		position: the position of the tip. Possible values are
			TL	top left
			TR  top right
			BL  bottom left
			BR  bottom right
			LT  left top
			LB  left bottom
			RT  right top
			RB  right bottom
			T   top
			R   right
			B   bottom
			L   left
		 */
		var defaultTours={
			name 		: ".tour_1",
			bgcolor		: "black",
			color		: "white",
			position	: "TL",
			text		: "You can create a tour to explain the functioning of your app",
			time 		: 5000,
			highlight 	: "",
			previousClick:function(){}//it's fire before tooltip show
		};
		var defaults = {
			tourcontrols:{
				tag:		"<div>",
				id:			"tourcontrols",
				class:		"tourcontrols"
			},
			tooltip:{
				tag:		"<div>",
				id:			"tour_tooltip",
				class:		"tooltip"
			},
			mainText:{
				tag:		"<p>",
				id:			"tourmaintext",
				text:		"First time here?",
				class:		"tourmaintext"
			},
			tournav:{
				tag:		"<div>",
				id:			"tournav",
				class:		"tournav"
			},
			overlay:{
				enable:		true,
				tag:		"<div>",
				id:			"tour_overlay",
				class:		"touroverlay"
			},
			buttons:{
				btnStart:{//Start Step by Step
					tag:	"<span>",
					id:		"activatetour",
					text:	"Start the tour",
					class:	"tourbutton",
					dClick:	function(){that.startTour();},//Default click
					cClick:function(){}//custom click
				},
				btnStartAuto:{//Start with autoplay
					tag:	"<span>",
					id:		"activatetourautoplay",
					text:	"Self-guided tour",
					class:	"tourbutton",
					dClick:	function(){ config.autoplay=true;that.startTour();},//Default click
					cClick:function(){}//custom click
				},
				btnClose:{
					tag:	"<span>",
					id:		"canceltour",
					text:	"",
					class:	"tourclose",
					dClick:	function(){that.cancelTour();},
					cClick:function(){}
				},
				btnPrevStep:{
					tag:	"<span>",
					id:		"prevstep",
					text:	"< Previous",
					class:	"tourbutton stepbutton",
					dClick:	function(){that.prevStep();},
					cClick:function(){}
				},
				btnNextStep:{
					tag:	"<span>",
					id:		"nextstep",
					text:	"Next >",
					class:	"tourbutton stepbutton",
					dClick:	function(){that.nextStep();},
					cClick:function(){}
				}
			},
			actions:{
				btnRestart:{
					tag:	"<a>",
					id:		"restarttour",
					text:	"Restart the tour",
					class:	"action",
					dClick:	function(){that.restartTour();},
					cClick:function(){}
				},
				btnCancel:{
					tag:	"<a>",
					id:		"canceltour",
					text:	"Skip the tour",
					class:	"action",
					dClick:	function(){that.cancelTour();},
					cClick:function(){}
				},
				btnEnd:{
					tag:	"<a>",
					id:		"endtour",
					text:	"I'm too old for this shit!",
					class:	"action",
					dClick:	function(){that.endTour();},
					cClick:function(){}
				}
			},
			tours:[
			    {
					//There are no tour by default
			    }
			],
			start_step: 0,   //Start step of the tour
			autoplay:false, //define if steps should change automatically
			onFinishTour:function(){} //Event fired when all steps are finished or the user definitely skips the tour(btnEnd)  
		};
		var config = $.extend(true,{},defaults, options);/* merge defaults and options, without modifying defaults */

		//timeout for the step
		var showtime;
		//current step of the tour
		var step = 0;
		//current step tooltip
		var currentTooltip;
		//total number of steps
		var total_steps	= config.tours.length;
		//the instance of websitetour
		var that;
		//The object that represents tourcontrol element
		var tc;
		//The object that represents main text element
		var mt;
		//The object that represents tournav element
		var tn;
		//The object that represents overlay element
		var o;
		
		var instance = {
				init: function(){
					that=this;
					
					//Initializating tour default settings
					$.each(config.tours,function(i,tour){
						config.tours[i]=$.extend({},defaultTours,tour);
					});
					
					step=config.start_step;
					//show the tour controls
					that.showControls();
				},
				startTour: function(){					
					$('#'+config.buttons.btnStart.id).remove();
					$('#'+config.buttons.btnStartAuto.id).remove();
					
					$('#'+config.actions.btnEnd.id,'#'+config.actions.btnRestart.id).show();
					$('#'+config.tourcontrols.id+' a.action').show();
					if(!config.autoplay && total_steps > 1){
						$('#'+config.tournav.id).show();
						$('#'+config.buttons.btnNextStep.id).show();
					}
					if(config.overlay.enable)
						that.showOverlay();
					that.nextStep();
					//Fire custom btnStart click function
					config.buttons.btnStart.cClick();
				},
				nextStep: function(){
					if(!config.autoplay){
						if(step > 0)
							$('#'+config.buttons.btnPrevStep.id).show();
						else
							$('#'+config.buttons.btnPrevStep.id).hide();
						if(step == total_steps-1)
							$('#'+config.buttons.btnNextStep.id).hide();
						else
							$('#'+config.buttons.btnNextStep.id).show();	
					}	
					if(step >= total_steps){
						//if last step then end tour
						that.endTour();
						//Fire custom onFinishTour function
						config.onFinishTour();
						return false;
					}
					++step;
					that.showTooltip();
					//Fire custom btnNextStep click function
					config.buttons.btnNextStep.cClick();
				},
				prevStep: function(){
					if(!config.autoplay){
						if(step > 2)
							$('#'+config.buttons.btnPrevStep.id).show();
						else
							$('#'+config.buttons.btnPrevStep.id).hide();
						if(step == total_steps)
							$('#'+config.buttons.btnNextStep.id).show();
					}		
					if(step <= 1)
						return false;
					--step;
					that.showTooltip();
					//Fire custom btnPrevStep click function
					config.buttons.btnPrevStep.cClick();
				},
				cancelTour: function(){
					step = 0;
					if(config.autoplay) clearTimeout(showtime);
					that.removeTooltip();
					that.hideControls();
					if(config.overlay.enable)
						that.hideOverlay();
					//Fire custom btnCancel click function
					config.actions.btnCancel.cClick();
				},
				endTour: function(){
					step = 0;
					if(config.autoplay) clearTimeout(showtime);
					that.removeTooltip();
					that.hideControls();
					if(config.overlay.enable)
						that.hideOverlay();
					//Fire custom btnEnd click function
					config.actions.btnEnd.cClick();
				},
				restartTour: function(){
					that.reset();
					//Fire custom btnRestart click function
					config.actions.btnRestart.cClick();
				},
				showTooltip: function(){
					//remove current tooltip
					that.removeTooltip();
					
					var step_config		= config.tours[step-1];
					//Fire custom previousClick function
					config.tours[step-1].previousClick();
					
					var elem			= $(step_config.name);
					
					if(config.autoplay)
						showtime	= setTimeout(that.nextStep,step_config.time);
					
					step_config.highlight=(step_config.highlight!="")?step_config.highlight:step_config.name;
					var bgcolor 		= step_config.bgcolor;
					var color	 		= step_config.color;
					var zindex			= $(step_config.highlight).css('z-index');
					var position		= $(step_config.highlight).css('position');
					
					//Highlighting the tooltip
					$(step_config.highlight).css({'z-index':'100','position':'relative'});
					
					var tooltip		= $(config.tooltip.tag,{
						id			: config.tooltip.id,
						class 		: config.tooltip.class,
						html		: '<p>'+step_config.text+'</p><span class="tooltip_arrow"></span>',
					}).css({
						'display'			: 'none',
						'background-color'	: bgcolor,
						'color'				: color
					});
					
					//position the tooltip correctly:
					
					//the css properties the tooltip should have
					var properties		= {};
					
					var tip_position 	= step_config.position;
					
					//append the tooltip but hide it
					$('body').prepend(tooltip);
					
					//get some info of the element
					var e_w				= elem.outerWidth();
					var e_h				= elem.outerHeight();
					var e_l				= elem.offset().left;
					var e_t				= elem.offset().top;
					
					
					switch(tip_position){
						case 'TL'	:
							properties = {
								'left'	: e_l,
								'top'	: e_t + e_h + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_TL');
							break;
						case 'TR'	:
							properties = {
								'left'	: e_l + e_w - tooltip.width() + 'px',
								'top'	: e_t + e_h + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_TR');
							break;
						case 'BL'	:
							properties = {
								'left'	: e_l + 'px',
								'top'	: e_t - tooltip.height() + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_BL');
							break;
						case 'BR'	:
							properties = {
								'left'	: e_l + e_w - tooltip.width() + 'px',
								'top'	: e_t - tooltip.height() + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_BR');
							break;
						case 'LT'	:
							properties = {
								'left'	: e_l + e_w + 'px',
								'top'	: e_t + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_LT');
							break;
						case 'LB'	:
							properties = {
								'left'	: e_l + e_w + 'px',
								'top'	: e_t + e_h - tooltip.height() + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_LB');
							break;
						case 'RT'	:
							properties = {
								'left'	: e_l - tooltip.width() + 'px',
								'top'	: e_t + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_RT');
							break;
						case 'RB'	:
							properties = {
								'left'	: e_l - tooltip.width() + 'px',
								'top'	: e_t + e_h - tooltip.height() + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_RB');
							break;
						case 'T'	:
							properties = {
								'left'	: e_l + e_w/2 - tooltip.width()/2 + 'px',
								'top'	: e_t + e_h + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_T');
							break;
						case 'R'	:
							properties = {
								'left'	: e_l - tooltip.width() + 'px',
								'top'	: e_t + e_h/2 - tooltip.height()/2 + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_R');
							break;
						case 'B'	:
							properties = {
								'left'	: e_l + e_w/2 - tooltip.width()/2 + 'px',
								'top'	: e_t - tooltip.height() + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_B');
							break;
						case 'L'	:
							properties = {
								'left'	: e_l + e_w  + 'px',
								'top'	: e_t + e_h/2 - tooltip.height()/2 + 'px'
							};
							tooltip.find('span.tooltip_arrow').addClass('tooltip_arrow_L');
							break;
					}
					/*
					if the element is not in the viewport
					we scroll to it before displaying the tooltip
					 */
					var w_t	= $(window).scrollTop();
					var w_b = $(window).scrollTop() + $(window).height();
					//get the boundaries of the element + tooltip
					var b_t = parseFloat(properties.top,10);
					
					if(e_t < b_t)
						b_t = e_t;
					
					var b_b = parseFloat(properties.top,10) + tooltip.height();
					if((e_t + e_h) > b_b)
						b_b = e_t + e_h;
						
					//saving the state of current tooltip
					currentTooltip={
							tooltip: tooltip,
							zindex: zindex,
							position: position,
							highlight: step_config.highlight
						};
					
					if((b_t < w_t || b_t > w_b) || (b_b < w_t || b_b > w_b)){
						$('html, body').stop()
						.animate({scrollTop: b_t}, 500, 'easeInOutExpo', function(){
							//need to reset the timeout because of the animation delay
							if(config.autoplay){
								clearTimeout(showtime);
								showtime = setTimeout(that.nextStep,step_config.time);
							}
							//show the new tooltip
							tooltip.css(properties).show();
						});
					}
					else
					//show the new tooltip
						tooltip.css(properties).show();
				},
				removeTooltip: function(){
					//Un-highlighting the tooltip
					if(typeof(currentTooltip)!='undefined'){
						$(currentTooltip.highlight).css({
							'z-index':currentTooltip.zindex,
							'position':currentTooltip.position
						});
					}
					$('#'+config.tooltip.id).remove();
				},
				showControls: function(){
					/*
					we can restart or stop the tour,
					and also navigate through the steps
					 */
					//Creating tourcontrol element
					tc=$(config.tourcontrols.tag,
						{
							'id':config.tourcontrols.id,
							'class':config.tourcontrols.class
						}).prependTo('body');
					
					//Creating main text element
					mt=$(config.mainText.tag,
						{
							'id':config.mainText.id,
							'class':config.mainText.class
						}).text(config.mainText.text).appendTo(tc);
					
					//Adding buttons
					$.each(config.buttons,function(i,btn){
						//Creating element
						var e=$(btn.tag,
							{
								'id':btn.id,
								'class':btn.class
							})
							.text(btn.text)
							.appendTo(tc)
							.click(btn.dClick);//Associating event to buttons
					});
					//Inserting tournav if autoplay
					if(!config.autoplay){
						tn=$(config.tournav.tag,
							{
								'id':config.tournav.id,
								'class':config.tournav.class
							}).appendTo(tc);
						$('#'+config.buttons.btnPrevStep.id).appendTo(tn);
						$('#'+config.buttons.btnNextStep.id).appendTo(tn);
					}
					//Adding actions
					$.each(config.actions,function(i,action){
						//Creating element
						var e=$(action.tag,
							{
								'id':action.id,
								'class':action.class
							})
							.text(action.text)
							.appendTo(tc)
							.click(action.dClick);//Associating event to buttons
					});
					
					tc.animate({'right':'30px'},500);
				},
				hideControls: function(){
					$('#'+config.tourcontrols.id).remove();
				},
				showOverlay:function(){
					o=$(config.overlay.tag,{
						'id':config.overlay.id,
						'class':config.overlay.class,
					});
					$('body').prepend(o);
				},
				hideOverlay: function(){
					o.remove();
				},
				reset: function(){
					that.cancelTour();
					$().websitetour(config);
				}
				
			};
			
			instance.init();
		
	};

})(jQuery);