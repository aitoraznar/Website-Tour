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
			bgcolor		: "",
			color		: "",
			position	: "TL",
			text		: "You can create a tour to explain the functioning of your app",
			time 		: 8000,
			highlight 	: "",
			previousAction:function(){},//it's fires before tooltip show
			postAction:function(){}		//it's fires before tooltip hide
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
				class:		"tour_tooltip"
			},
			mainText:{
				tag:		"<p>",
				id:			"tourmaintext",
				text:		"First time here?",
				class:		"tourmaintext"
			},
			step_counter:{
				tag:		"<p>",
				id:			"stepcounter",
				text:		"Step: ",
				class:		"stepcounter"
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
			controls_container: $('body'),
			buttons:{
				btnStart:{//Start Step by Step
					tag:	"<span>",
					id:		"activatetour",
					text:	"Start the tour",
					class:	"tourbutton",
					dClick:	function(){ config.autoplay=false;that.startTour();},//Default click
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
				}
			},
			navbuttons:{
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
					//There are no tours by default
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
		//The object that represents the container of the tourcontrol div
		var cc;
		//The object that represents the step counter element
		var sc;

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
					$('a.action','#'+config.tourcontrols.id).show();
					$('#'+config.step_counter.id,'#'+config.tourcontrols.id).show();
					if(!config.autoplay && total_steps > 1){
						$('#'+config.tournav.id).show();
						$('#'+config.navbuttons.btnNextStep.id).show();
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
							$('#'+config.navbuttons.btnPrevStep.id).show();
						else
							$('#'+config.navbuttons.btnPrevStep.id).hide();
						if(step == total_steps-1)
							$('#'+config.navbuttons.btnNextStep.id).hide();
						else
							$('#'+config.navbuttons.btnNextStep.id).show();	
					}	
					if(step >= total_steps){
						//if last step then end tour
						that.closeTour();
						//Fire custom onFinishTour function
						config.onFinishTour();
						return false;
					}
					++step;
					that.showTooltip();
					//Fire custom btnNextStep click function
					config.navbuttons.btnNextStep.cClick();
				},
				prevStep: function(){
					if(!config.autoplay){
						if(step > 2)
							$('#'+config.navbuttons.btnPrevStep.id).show();
						else
							$('#'+config.navbuttons.btnPrevStep.id).hide();
						if(step == total_steps)
							$('#'+config.navbuttons.btnNextStep.id).show();
					}		
					if(step <= 1)
						return false;
					--step;
					that.showTooltip();
					//Fire custom btnPrevStep click function
					config.navbuttons.btnPrevStep.cClick();
				},
				cancelTour: function(){
					that.closeTour();
					//Fire custom btnCancel click function
					config.actions.btnCancel.cClick();
				},
				endTour: function(){
					that.closeTour();
					//Fire custom btnEnd click function
					config.actions.btnEnd.cClick();
				},
				restartTour: function(){
					that.reset();
					//Fire custom btnRestart click function
					config.actions.btnRestart.cClick();
				},
				closeTour: function(){
					step = 0;
					if(config.autoplay) clearTimeout(showtime);
					that.removeTooltip();
					that.hideControls();
					if(config.overlay.enable)
						that.hideOverlay();
				},
				showTooltip: function(){
					//remove current tooltip
					that.removeTooltip();

					var step_config		= config.tours[step-1];
					//Fire custom previousClick function
					config.tours[step-1].previousAction();

					var elem			= $(step_config.name);

					if(config.autoplay)
						showtime	= setTimeout(that.nextStep,step_config.time);

					step_config.highlight=(step_config.highlight!="")?step_config.highlight:step_config.name;
					var zindex			= $(step_config.highlight).css('z-index');
					var position		= $(step_config.highlight).css('position');

					//Highlighting the tooltip
					$(step_config.highlight).css({'z-index':'100','position':'relative'});

					var tooltip		= that.prepareTooltip(step_config);

					//Updating Step counter
					that.updateStepCounter();
					
					//append the tooltip but hide it
					$('body').prepend(tooltip);

					//saving the state of current tooltip
					currentTooltip={
							tooltip: tooltip,
							zindex: zindex,
							position: position,
							step_config:step_config
						};
					
					//Check if is needed to move the screen to show the element
					that.checkElementPosition(elem);
					//Check if is needed to move the controls to the correctly show of the element
					that.checkControlsPosition(elem);
				},
				prepareTooltip: function(step_config){
					var t = $(config.tooltip.tag,{
						id			: config.tooltip.id,
						class 		: config.tooltip.class
					}).css({
						'display'			: 'none',
						'background-color'	: step_config.bgcolor,
						'color'				: step_config.color
					});
					
					var tooltip_div=$('<div>',{
						html		: '<div class="text"><p>'+step_config.text+'</p><span class="tour_tooltip_arrow"></span></div><hr>',
					}).appendTo(t);
					
					//Inserting tournav if manual step by step
					if(!config.autoplay){
						tn=$(config.tournav.tag,
							{
								'id':config.tournav.id,
								'class':config.tournav.class
							}).appendTo(tooltip_div);
						//Adding nav buttons
						$.each(config.navbuttons,function(i,btn){
							//Creating element
							var e=$(btn.tag,
								{
									'id':btn.id,
									'class':btn.class
								})
								.text(btn.text)
								.appendTo(tn)
								.click(btn.dClick);//Associating event to buttons
						});
					}
					
					
					return t;
				},
				removeTooltip: function(){
					//Un-highlighting the tooltip
					if(typeof(currentTooltip)!='undefined'){
						$(currentTooltip.step_config.highlight).css({
							'z-index':currentTooltip.zindex,
							'position':currentTooltip.position
						});
						//Fire custom postAction
						currentTooltip.step_config.postAction();
					}
					$('#'+config.tooltip.id).remove();
				},
				showControls: function(){
					/*
					we can restart or stop the tour,
					and also navigate through the steps
					 */
					cc=$(config.controls_container);
					//Creating tourcontrol element
					tc=$(config.tourcontrols.tag,
						{
							'id':config.tourcontrols.id,
							'class':config.tourcontrols.class
						}).prependTo(cc);

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
					//Adding Step counter
					sc=$(config.step_counter.tag,
							{
								'id':config.step_counter.id,
								'class':config.step_counter.class
							})
							.text(config.step_counter.text)
							.appendTo(tc);
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

					tc.animate({'right':$(cc).offset().left},750);
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
					if(typeof(o)!='undefined')
						o.remove();
				},
				reset: function(){
					//Empty temporal variables
					var tc=null;
					var mt=null;
					var tn=null;
					var o=null;
					var cc=null;
					var sc=null;
					that.cancelTour();
					$().websitetour(config);
				},
				updateStepCounter:function(){
					//i.e.: Step: 1/12
					sc.text(config.step_counter.text+" "+step+"/"+config.tours.length);
				},
				checkElementPosition: function(e){
					var t = currentTooltip.tooltip;
					var p = that.getElementPosition(e,t);
					
					/*
					if the element is not in the viewport
					we scroll to it before displaying the tooltip
					 */
					var w_t	= $(window).scrollTop();
					var w_b = $(window).scrollTop() + $(window).height();
					//get the boundaries of the element + tooltip
					var b_t = parseFloat(p.properties.top,10);

					if(p.e_t < b_t)
						b_t = p.e_t;

					var b_b = parseFloat(p.properties.top,10) + t.height();
					if((p.e_t + p.e_h) > b_b)
						b_b = p.e_t + p.e_h;
					
					if((b_t < w_t || b_t > w_b) || (b_b < w_t || b_b > w_b)){
						$('html, body').stop()
						.animate({scrollTop: b_t}, 500, 'easeInOutExpo', function(){
							//need to reset the timeout because of the animation delay
							if(config.autoplay){
								clearTimeout(showtime);
								showtime = setTimeout(that.nextStep,currentTooltip.step_config.time);
							}
							//show the new tooltip
							t.css(p.properties).show();
						});
					}
					else
					//show the new tooltip
						t.css(p.properties).show();
				},
				checkControlsPosition: function(e){
					var t = currentTooltip.tooltip;
					//Checking if Element and Controls are in the same place
					//var hitElement = that.hittest(e,tc);
					var hitTooltip = that.hittest(t,tc);
					
					if(hitTooltip){
						/*
						var moveHeight=-($(t).outerHeight()+$(tc).offset().top)+'px';//The height in px that we must scroll the screen to see the full tooltip
						$('html, body').stop().animate({scrollTop: moveHeight}, 500, 'easeInOutExpo');
						*/
						var offset=$(cc).offset().left;
						if($(tc).offset().left>($(cc).outerWidth()/2)){
							//Tourcontrols in the right hand
							$(tc).stop().animate({left: $(cc).offset().left}, 1000, 'easeInOutExpo');
						}else{
							//Tourcontrols in the left hand
							$(tc).stop().animate({direction:'right' ,left: offset}, 1000, 'easeInOutExpo');
						}
						var moveHeight=-($(t).outerHeight()+$(tc).offset().top)+'px';//The height in px that we must scroll the screen to see the full tooltip
						$('html, body').stop().animate({scrollTop: moveHeight}, 1000, 'easeInOutExpo');
					}
				},
				getElementPosition: function(e,t){
					var p				= {};
					var properties		= {};
					var tip_position 	= currentTooltip.step_config.position;
					//get some info of the element
					var e_w				= e.outerWidth();
					var e_h				= e.outerHeight();
					var e_l				= e.offset().left;
					var e_t				= e.offset().top;

					switch(tip_position){
						case 'TL'	:
							properties = {
								'left'	: e_l,
								'top'	: e_t + e_h + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_TL');
							break;
						case 'TR'	:
							properties = {
								'left'	: e_l + e_w - t.width() + 'px',
								'top'	: e_t + e_h + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_TR');
							break;
						case 'BL'	:
							properties = {
								'left'	: e_l + 'px',
								'top'	: e_t - t.height() + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_BL');
							break;
						case 'BR'	:
							properties = {
								'left'	: e_l + e_w - t.width() + 'px',
								'top'	: e_t - t.height() + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_BR');
							break;
						case 'LT'	:
							properties = {
								'left'	: e_l + e_w + 'px',
								'top'	: e_t + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_LT');
							break;
						case 'LB'	:
							properties = {
								'left'	: e_l + e_w + 'px',
								'top'	: e_t + e_h - t.height() + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_LB');
							break;
						case 'RT'	:
							properties = {
								'left'	: e_l - t.width() + 'px',
								'top'	: e_t + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_RT');
							break;
						case 'RB'	:
							properties = {
								'left'	: e_l - t.width() + 'px',
								'top'	: e_t + e_h - t.height() + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_RB');
							break;
						case 'T'	:
							properties = {
								'left'	: e_l + e_w/2 - t.width()/2 + 'px',
								'top'	: e_t + e_h + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_T');
							break;
						case 'R'	:
							properties = {
								'left'	: e_l - t.width() + 'px',
								'top'	: e_t + e_h/2 - t.height()/2 + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_R');
							break;
						case 'B'	:
							properties = {
								'left'	: e_l + e_w/2 - t.width()/2 + 'px',
								'top'	: e_t - t.height() + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_B');
							break;
						case 'L'	:
							properties = {
								'left'	: e_l + e_w  + 'px',
								'top'	: e_t + e_h/2 - t.height()/2 + 'px'
							};
							t.find('span.tour_tooltip_arrow').addClass('tour_tooltip_arrow_L');
							break;
					}
					
					p={
							properties:properties,
							e_w:e_w,
							e_h:e_h,
							e_l:e_l,
							e_t:e_t
					};
					
					return p;
				},
				hittest: function(elmA,elmB){
					/*Hittest para Jquery por Salvador Gonzalez (@sgb004)*/
					var elmA_Obj = $(elmA);
					var elmA_pos = elmA_Obj.offset();
					var elmA_posTop = elmA_pos.top;	
					var elmA_hei = elmA_posTop + elmA_Obj.height();
					var elmA_posLeft = elmA_pos.left;
					var elmA_Wid = elmA_posLeft + elmA_Obj.width();

					var elmB_Obj = $(elmB);
					var elmB_pos = elmB_Obj.offset();
					var elmB_posTop = elmB_pos.top;
					var elmB_hei = elmB_posTop + elmB_Obj.height();
					var elmB_posLeft = elmB_pos.left;
					var elmB_Wid = elmB_posLeft + elmB_Obj.width();

					var choque = false;
					var choTop = false;
					var choLeft = false;
					
					if((elmB_posTop >= elmA_posTop && elmB_posTop <= elmA_hei) || (elmB_hei >= elmA_posTop && elmB_hei <= elmA_hei)){
						choTop = true; 
					}else if((elmA_posTop >= elmB_posTop && elmA_posTop <= elmB_hei) || (elmA_hei >= elmB_posTop && elmA_hei <= elmB_hei)){
						choTop = true; 
					}
					if((elmB_posLeft >= elmA_posLeft && elmB_posLeft <= elmA_Wid) || (elmB_Wid >= elmA_posLeft && elmB_Wid <= elmA_Wid)){
						choLeft = true;
					}else if((elmA_posLeft >= elmB_posLeft && elmA_posLeft <= elmB_Wid) || (elmA_Wid >= elmB_posLeft && elmA_Wid <= elmB_Wid)){
						choLeft = true;
					}
					if(choTop == true && choLeft == true){choque = true;}
					return choque;
				}

			};

			instance.init();

	};

})(jQuery);