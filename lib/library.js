//@HDR@	$Id$
//@HDR@		Copyright 2024 by
//@HDR@		Christopher Caldwell/Brightsands
//@HDR@		P.O. Box 401, Bailey Island, ME 04003
//@HDR@		All Rights Reserved
//@HDR@
//@HDR@	This software comprises unpublished confidential information
//@HDR@	of Brightsands and may not be used, copied or made available
//@HDR@	to anyone, except in accordance with the license under which
//@HDR@	it is furnished.
// This is split out so it could be included and cached.
// It would be now if it wasn't for the embedded XL translations
// which need to processed by $COMMON::xprint.

var p			= new Array();
var user_agent		= ( genform ? genform : navigator.userAgent );

var IE_agents		= ["MSIE"];
var IOS_agents		= ["iPhone","iTouch","iPad"];
var small_agents	= ["iTouch","iPhone"];
var Android_agents	= ["Android"];

var is_IE		= anywhere_in( user_agent, IE_agents );
var is_IOS		= anywhere_in( user_agent, IOS_agents );
var is_Android		= anywhere_in( user_agent, Android_agents );
var is_small		= anywhere_in( user_agent, small_agents );

var ONE_MINUTE		= Date.parse("1/1/2010 01:01")
			- Date.parse("1/1/2010 01:00");
var ONE_HOUR		= ONE_MINUTE * 60;
var ONE_DAY		= ONE_HOUR * 24;
var ONE_MONTH		= ONE_DAY * 30.416666;
var ONE_YEAR		= ONE_DAY * 365.25;
var DIGITS		= (LEGAL_LABELS+"").split("");

var NEEDED_FOR_GRID	= 300;

var const_ind		= 0;
var PRIORITIES		=
    {
    input_ok:		const_ind++,	// Only show if filled in and OK
    input_unanswered:	const_ind++,	// Show if not answered but not required
    input_abnormal:	const_ind++,	// Show if filled in but shows error
    input_required:	const_ind++	// Show if not filled in and required
    };

var read_only		= false;

var ACTION		= "%%ACTION%%";

// For grouping into a grid
var last_header_line;	// If the header line we built up is the same as
			// the last one, then we can do a grid (assuming
			// nothing has been added to the HTML string).
var num_in_grid;	// Number of oneof/anyofs in grid so far.
var html_grid;		// HTML so far for grid version
var html_nongrid;	// HTML so far for non grid version
var html_ro;		// HTML so far for read-only version
var html_value;		// HTML we'll send back to server

var section_ind		= 0;		// Which section we're drawing now
var section_displaying	= 0;		// Which section we should be displaying
var section_stack_ind;			// Sections this section is in
var section_stack_title;		// Titles of sections this section is in
var section_stack_class;		// OK, Unanswered, Abnormal
var section_stack_page;			// Page number within current section

var next_page_exists	= 0;
var last_var_displayed	= 0;
var page_ind		= 0;
var page_displaying	= 0;

var zip_to_citystate	= {};
var address_cache	= {};

var debug_flag		= false;
var last_referred_value;		// Value of "this" in expressions

var EVENT_LIST=
    [
    "onMouseMove","onMouseOut","onMouseUp","onMouseDown","onMouseOver",
    "onClick",
    "onTouchEvent", "onLongClick", "onTouch", "onScroll", "onTouchCancel",
    "onGestureStart", "onGestureChange", "onGestureEnd",
    "onTouchStart","onTouchMove","onTouchEnd",
    "onSelectStart", "onDragStart"
    ];
var imageinfo		= {};		// Information about images
					// indexed by partial URL of image
var imagecontexts	= {};		// canvases that depend on image

var varinfo		= {};		// All kinds of information about
					// variable, mostly set as arguments
					// by do_var

var varcontexts;			// Used for list
var tripvar;
var space_over;

var something_changed	= false;	// If set, remind user to save work

var current_focus;			// Variable where we're focused
var set_focus_to_next	= 0;		// 1 if we're supposed to change
					// 2 if we've found current focus
					// and looking for next.
					// 0 if we're not looking.
var focus_id		= 0;		// id of object we'll focus on

var QUOTES		= ['"',"'"];

var current_column	= 0;
var table_columns	= 2;		// Default for very simple table

var current_image;			// Variable of image we're marking up
var varinfop;				// varinfo object for variable

var need_redraw		= false;

var LIT_BUTTON		= "#d0e5ff";

var needs_input;

var file_list		= {};

var default_params	= {};

var seen_input;

var is_phonegap		= ( typeof(PhoneGap)!="undefined"
			 || typeof(Cordova) !="undefined"
			 || typeof(cordova) !="undefined"
			  );

var prefixes		= "";

var new_html		= "";		// Last HTML actually sent to screen

var accelerometer;

var form_is_done = 0;

var USE_DATETIME	= 0;
var DATETIME_AVAILABLE	= ( is_IOS && USE_DATETIME );
var VIRTUAL_KEYBOARD	= is_IOS;
//VIRTUAL_KEYBOARD = 1;

var start_html		= "";

var nows		= new Array();	// List of values claiming to be now

var leave_unfocused;

var clear_on_submit	= 1;

var nice_errors = new Array();

var table_dims;

var trip_vc_next	= 0;

//////////////////////////////////////////////////////////////////////////
//	Extremely specialized sprintf, returns "" if val is null.	//
//////////////////////////////////////////////////////////////////////////
function sprint0f( fmt, val )
    {
    return ( val ? fmt.replace("%s",val) : "" );
    }

//////////////////////////////////////////////////////////////////////////
//	Returns true if all chars in first string exist in second.	//
//////////////////////////////////////////////////////////////////////////
function is_subset( to_check_string, check_against_string )
    {
    var to_check = (to_check_string+"").split("");
    var ret = true;
    for( var i=0; ret && i<to_check.length; i++ )
	{
        if( check_against_string.indexOf( to_check[i] ) < 0 )
	    { ret = false; }
	}
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	True if any of strings appears in check_in string		//
//////////////////////////////////////////////////////////////////////////
function anywhere_in( check_in, strings )
    {
    for( var i=0; i<strings.length; i++ )
        {
	if( check_in.indexOf( strings[i] ) >= 0 )
	    { return true; }
	}
    return false;
    }

//////////////////////////////////////////////////////////////////////////
//	Substitution for indexOf for Internet Explorer for non strings.	//
//////////////////////////////////////////////////////////////////////////
function ArrayIndex( a, v )
    {
    var i;
    for( i=0; i<a.length; i++ )
        {
	if( a[i] == v ) { return i; }
	}
    return -1;
    }

//////////////////////////////////////////////////////////////////////////
//	Output debug information (assuming it is available).		//
//////////////////////////////////////////////////////////////////////////
var debugtried;
var debug_data = new Array();
var debug_ind = 0;
function debug( msg )
    {
    var clr="<input type=button onClick='debug();' value=Clear><br>";

//    if( current_image &&
//	(debptr = document.getElementById("debug_"+current_image) ) )
    if( (debptr = document.getElementById("debug_X") ) )
        {
	if( typeof(msg) == "undefined" )
	    {
	    debug_data = new Array("(Clear) ... ");
	    msg = "";
	    }
	if( msg == "" )
	    {
	    debug_data.push("(Redraw)<br>");
	    debptr.innerHTML = clr + debug_data.join("");
	    }
	else
	    {
	    msg = debug_ind++ + ": " + msg + "<br>\n";
	    debug_data.push( msg );
	    debptr.innerHTML += msg;
	    debptr.scrollTop = debptr.scrollHeight
	    }
	}
    }

var _unid = 0;
//////////////////////////////////////////////////////////////////////////
//	Return an ID that is guaranteed to be unique.			//
//////////////////////////////////////////////////////////////////////////
function unique_id( prefix )
    {
    if( !(typeof(prefix)!="undefined") ) { prefix = "U"; }
    return prefix + (_unid++);
    }

//////////////////////////////////////////////////////////////////////////
//	Return a string that will look like you expect in HTML.		//
//////////////////////////////////////////////////////////////////////////
function sanitize( s )
    {
    s += "";				// Force it to be a string
    s = s.replace(/&/g,"&amp;");
    s = s.replace(/</g,"&lt;");
    s = s.replace(/>/g,"&gt;");
    s = s.replace(/\r/g,"");
    s = s.replace(/\n/g,"<br>");
    return s;
    }

//////////////////////////////////////////////////////////////////////////
//	Return a string based on the current level of spacing.		//
//////////////////////////////////////////////////////////////////////////
function spacing()
    {
    var ret = "";
    if( current_column == 0 )
	{
	var ctr = space_over;
	// while( ctr-- > 0 ) { ret += "&nbsp;"; }
	while( ctr-- > 0 ) { ret += "&nbsp;"; }
	}
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	This is nasty.  We're building up a string that will end	//
//	up becoming the displayed table.  We don't directly add		//
//	to the innerHTML for performance reasons (better to do it	//
//	all at once).  Even worse, we're working on two different	//
//	versions of the table - one is if we're displaying the last	//
//	few one/anyofs as a grid (html_grid) and the other if not.	//
//	When we try to print something else, we decide which		//
//	one is better and change the other one to look like it.		//
//	Only when we are in oneof/anyof logic do we ever add html	//
//	with anything other than this.					//
//////////////////////////////////////////////////////////////////////////
const_ind = 0;
var AH_GRID	= (1<<(const_ind++));	// Only add to html_grid
var AH_NONGRID	= (1<<(const_ind++));	// Only add to html_nongrid
var AH_RWS	= (AH_GRID+AH_NONGRID);	// Only add to html_grid & html_nongrid
var AH_RO	= (1<<(const_ind++));	// Only add to html_ro
var AH_VALUE	= (1<<(const_ind++));	// Only add to html_value
var AH_ROS	= (AH_RO+AH_VALUE);	// Only add to html_ro, html_value
var AH_ALL	= (AH_ROS+AH_RWS);	// Add to all html_ variables
function add_html( html_type, h )
    {
    if( section_ind==section_displaying && page_ind==page_displaying )
        {
	if( (html_type & AH_GRID) > 0 )		{ html_grid += h; }
	if( (html_type & AH_NONGRID) > 0 )	{ html_nongrid += h; }
	}
    if( (html_type & AH_RO) > 0 )		{ html_ro += h; }
    if( (html_type & AH_VALUE) > 0 )		{ html_value += h; }
    }

//////////////////////////////////////////////////////////////////////////
//	Map a name out of context to a name with contexts.		//
//////////////////////////////////////////////////////////////////////////
function real_name( varname )
    {
    var ret = varname;
    if( ! intersects( varname, "this,now" ) && ! varinfo[varname] )
	{
	ret = prefixes + ret;
        if(varcontexts.length > 0) { ret += "_" + varcontexts.join("_"); }
	}
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	Called to get value of variable by expressions			//
//////////////////////////////////////////////////////////////////////////
function lookup( varname, ctx )
    {
    var ret;
    if( typeof(ctx) == "undefined" ) { ctx = ""; }
    var lupname = varname;
    if( lupname == "this" )
        { ret = last_referred_value; }
    else if( lupname == "now" )
        {
	nows[ ret = formatted_date( new Date(), true ) ] = 1;
	}
    else
        {
	if( ctx != "" )
	    { lupname = lupname + ctx; }
	else
	    { lupname = real_name(lupname); }
        ret = values[ lupname ];
	if( /date/.test(varname) )
	    { debug( varname + " => " + lupname + " => " + ret ); }
	}
    ret = ( !(typeof(ret)!="undefined") ? "" : ret+"" );
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	Called to get value of variable by expressions			//
//////////////////////////////////////////////////////////////////////////
function ctxlup( ctx, varname )
    {
    return lookup(varname,ctx);
    }

//////////////////////////////////////////////////////////////////////////
//	Set a value (rather than get it from the user)			//
//////////////////////////////////////////////////////////////////////////
function setvar( relname, value )
    {
    var absname = real_name( relname );
    values[absname] = value;
    if( debug_flag ) alert("Setting ["+relname+"]=>["+absname+"] to ["+value+"]");
    }

//////////////////////////////////////////////////////////////////////////
//	Return true if the specified variable needs to be shown in	//
//	a list.								//
//////////////////////////////////////////////////////////////////////////
function listitem( vname )
    {
    var curv = lookup( vname );
    var current_index = varcontexts.pop();
    var numitems_name = real_name( "num_"+vname );
    varcontexts.push( current_index );
    var numitems = values[numitems_name];
    if( !numitems ) { numitems = 0; }
    if( curv != "" && curv != "Unanswered" )
	{
	if( current_index >= numitems ) {values[numitems_name]=current_index+1;}
	return true;
	}
    if( current_index < numitems ) { return false; }
    tripvar[tripvar.length-1] = true;
    return ! read_only;
    }

//////////////////////////////////////////////////////////////////////////
//	Return true if any member (element separated by commas) of the	//
//	first list appears in the second list.				//
//////////////////////////////////////////////////////////////////////////
function intersects( s1, s2 )
    {
    if( typeof(s1)=="undefined" || typeof(s2)=="undefined" )
	{
	var st1 = ( typeof(s1)=="undefined" ? "undefined" : s1 );
	var st2 = ( typeof(s2)=="undefined" ? "undefined" : s2 );
	}
    var s1parts = (s1+"").split(",");
    var s2parts = (s2+"").split(",");
    for( var s1ind=s1parts.length; s1ind-- > 0; )
        {
	for( var s2ind=s2parts.length; s2ind-- > 0; )
	    {
	    if( s1parts[s1ind] == s2parts[s2ind] ) { return 1; }
	    }
	}
    return 0;
    }

//////////////////////////////////////////////////////////////////////////
//	Something wants to add HTML that is not part of an anyof/oneof.	//
//	This will therefore end any grid being worked on.		//
//////////////////////////////////////////////////////////////////////////
function force_end_grid()
    {
    if( num_in_grid < NEEDED_FOR_GRID )
        { html_grid = html_nongrid; }
    else
        {
	add_html(AH_GRID,"<tr><th class=spacer colspan=2></th></tr>");
	html_nongrid = html_grid;
	}
    num_in_grid = 0;
    return html_nongrid;
    }

//////////////////////////////////////////////////////////////////////////
//	Display a new section						//
//////////////////////////////////////////////////////////////////////////
function display_section( sectnum )
    {
    if( sectnum == -2 )
        { section_displaying--; }
    else if( sectnum == -1 )
        { section_displaying++; }
    else
        { section_displaying = sectnum; }
    if( section_displaying < 0 )
        { section_displaying = number_sections-1; }
    else if( section_displaying >= number_sections )
        { section_displaying = 0; }

    page_displaying = 0;

    redraw_wrapper();
    }

//////////////////////////////////////////////////////////////////////////
//	Change page							//
//////////////////////////////////////////////////////////////////////////
function display_page( inc )
    {
    page_displaying += inc;
    redraw_wrapper();
    }

//////////////////////////////////////////////////////////////////////////
//	We're beginning a new page.					//
//////////////////////////////////////////////////////////////////////////
function new_page( prev_text, next_text )
    {
    if( typeof(next_text)=="undefined" || next_text=="" )
        { next_text = "Next"; }
    if( typeof(prev_text)=="undefined" || prev_text=="" )
        { prev_text = "Previous"; }
    if( is_small )
	{
	force_end_grid();
	add_html( AH_RWS,
	    "<tr class=section><th class='section section_next' colspan=" + table_columns +
	    "><button class='section section_next'" +
	    " onClick='display_page(1);'>"+next_text+"</button></th></tr>" );
	next_page_exists = 1;
	page_ind++;
	add_html( AH_RWS,
	    "<tr class=section><th class='section section_previous' colspan=" + table_columns +
	    "><button class='section section_previous'" +
	    " onClick='display_page(-1);'/>"+prev_text+"</button></th></tr>" );
	}
    }

//////////////////////////////////////////////////////////////////////////
//	We're beginning a new section.					//
//////////////////////////////////////////////////////////////////////////
function section( section_title )
    {
    force_end_grid();
    var previous_section_ind = section_ind;
    section_stack_title.push( section_title );
    section_stack_ind.push( section_ind );
    section_stack_page.push( page_ind );
    section_ind = number_sections++;
    page_ind = 0;
    section_stack_class.push( "input_ok" );
    add_html(AH_ROS, "<tr class=section><th class=section colspan="
	+ table_columns
	+"><center>" + section_title + "</center></th></tr>" );
    add_html(AH_RWS, "<tr class=section>"
        +	"<th class=section width=100% colspan="
	+table_columns +">"
	+	"<table class=section width=100%>"
	+	"<tr class=section>"
	+	"<th class=section style='border:0px;vertical-align:text-top;text-align:left' width=33%>"
	+	( section_ind
	    ? ("<button class=section"
		+ " onClick='display_section("+previous_section_ind+");'>"
		+ "XL(Menu)</button>")
	    : "" )
	+	"</th><th width=33% style='border:0px;vertical-align:text-top;text-align:center' class=section>"
	+	sanitize(section_title) + "</td>"
	+	"<th style='border:0px;vertical-align:text-top;text-align:right' width=33% class=section>"
	+	( section<=1 ? ""
	    : ('<button class=section'
		+ " onClick='display_section(-2);'>XL(Previous)</button><br>") )
	+	('<button class=section'
		+ " onClick='display_section(-1);'>XL(Next)</button>")
	+	"</td></tr></table></th></tr>" );
    }

//////////////////////////////////////////////////////////////////////////
//	We're ending the last section.					//
//////////////////////////////////////////////////////////////////////////
function end_section()
    {
    force_end_grid();
    var section_title = section_stack_title.pop();
    var section_class = section_stack_class.pop();
    var old_section_ind = section_ind;
    section_ind = section_stack_ind.pop();
    page_ind = section_stack_page.pop();
    seen_input[ section_class ] = 1;
    if( default_params.sectionclass )
	{
	section_class += " " + default_params.sectionclass;
	}
    add_html(AH_RWS, "<tr>"
	+ "<td width=100% style='text-align:center' colspan="
	+ table_columns + " class=\"" + section_class + " section\">"
	+ "<input type=button class='fixed_width_button section'"
	+ " value='" + section_title + "'"
	+ " onClick='display_section("+old_section_ind+");'></td></tr>" );
    }

//////////////////////////////////////////////////////////////////////////
//	Adding another cell, insert <tr> as required.			//
//////////////////////////////////////////////////////////////////////////
function start_cell()
    {
    if( current_column==0 ) { add_html( AH_ALL, "<tr class=dataline>" ); }
    }

//////////////////////////////////////////////////////////////////////////
//	Keep track of where we are and add tr's as required.		//
//////////////////////////////////////////////////////////////////////////
function add_columns( cols )
    {
    current_column += cols;
    if( current_column >= table_columns )
        {
	add_html( AH_ALL, "</tr>\n" );
	current_column = 0;
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Javascript interface to library to set various values		//
//////////////////////////////////////////////////////////////////////////
function set_to(args)
    {
    if( args.what == "start" )
        { start_html = args.value; }
    else if( args.what == "table_columns" )
        { table_columns = args.value; }
    else if( args.what == "default" )
        { default_params[ args.field ] = args.value; }
    else if( args.what == "form" )
	{
	varname = real_name( args.field );
	values[varname] = args.value;
	if( debug_flag ) alert("Setting ["+varname+"] to ["+value+"]");
	}
    else
        { alert("XL(Unknown set_to argument:)  "+args.what); }
    }

//////////////////////////////////////////////////////////////////////////
//	Script is asking to display some HTML.				//
//////////////////////////////////////////////////////////////////////////
function do_html( s, cols, use_class )
    {
    force_end_grid();
    if( ! use_class ) { use_class="exposition"; }
    if( ! cols ) { cols = table_columns - current_column; }
    start_cell();
    add_html( AH_ALL, "<td colspan="+cols+" class="+use_class+">"
	+ spacing() + s + "</td>" );
    add_columns( cols );
    }

//////////////////////////////////////////////////////////////////////////
//	Packing up drawing information.					//
//	Character 0: " "=means move, "-" means draw, "/" means text	//
//	Characters 1-2: X position in base 62.				//
//	Characters 3-4: Y position in base 62.				//
//	Characters 5-:  Name of label (if char 0 is "/")		//
//////////////////////////////////////////////////////////////////////////
function pack_xyl( fnc, x, y, label )
    {
    var ret =
        fnc +
        DIGITS[Math.floor(x/DIGITS.length)] + DIGITS[x % DIGITS.length] +
	DIGITS[Math.floor(y/DIGITS.length)] + DIGITS[y % DIGITS.length] +
	( ((typeof(label)!="undefined") ) ? label : "" );
    // debug("pack_xyl("+fnc+","+x+","+y+") returns ["+ret+"]");
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	Return position of child by adding all relative positions of	//
//	parents.
//////////////////////////////////////////////////////////////////////////
function parentoffset( fldname )
    {
    var obj = varinfop.canvas;
    var res = obj[fldname];
    try	{					// Internet Explorer bug
	while ( obj = obj.offsetParent )
	    { res += obj[fldname]; }
	}
    catch( ex ) { }
    // debug("parentoffset("+fldname+") returning "+res);
    return res;
    }

//////////////////////////////////////////////////////////////////////////
//	Put a label down where we currently are.			//
//////////////////////////////////////////////////////////////////////////
function make_mark( action, name, lbl )
    {
    var let = add_choice( name, lbl );
    if( ! values[current_image] )
        {
	values[current_image] = "";
	need_redraw = true;
	}
    values[current_image] += pack_xyl("/",mouse_x,mouse_y,lbl);
    //debug(action+" calls make_mark("+name+","+lbl+")");
    varinfo[name].canvas.ctx.strokeText( let, mouse_x, mouse_y );
    varinfo[name].canvas.ctx.stroke();
    varinfo[current_image].might_be_click = false;
    trigger_change(true);
    if( need_redraw ) { redraw_wrapper(); }
    }

//////////////////////////////////////////////////////////////////////////
//	Return a choice array split with default as it should be.	//
//////////////////////////////////////////////////////////////////////////
function choice_array( name, ind )
    {
    var choice_split = varinfo[name].choices[ind];
    if( typeof(choice_split[1])=="undefined" )
        { choice_split[1] = token_to_text( choice_split[0] ); }
    if( typeof(choice_split[2])=="undefined" )
        { choice_split[2] = token_to_text( choice_split[0] ); }
    return choice_split;
    }

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
var last_object_focused;
var last_object_focused_name;
function setfocus( obj, name )
    {
    var kbd_table_var;
//    if( last_object_focused_name )
//        {
//	// debug("setfocus last("+last_object_focused_name+") obj type="+last_object_focused.type+", last_value=["+last_object_focused.value+"]");
//	if( kbd_table_var =
//	    document.getElementById( last_object_focused_name + "_kbdtbl" ) )
//	    { kbd_table_var.style.display = 'none'; }
//	if( text_trigger && (text_trigger == last_object_focused ) )
//	    {
//	    text_trigger = "";
//	    var_changed(last_object_focused,last_object_focused_name,"Refocus");
//	    }
//	}
//    text_trigger = "";
    last_object_focused = obj;
    last_object_focused_name = name;
    if( varinfo[name].keyboard )
        {
	obj.blur();
	p.popups.innerHTML = varinfo[name].keyboard;
	open_text_widget = document.getElementsByName(name)[0];
	open_text_display = document.getElementById( name + "_display" );
	open_text_display.value = open_text_widget.value;
	window.scrollBy( -1000, 0 );
	p.popups.style.display = "";
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Somebody struck a key while the mouse was over an image/canvas.	//
//	Probably won't happen on a touch screen device.  Probably.	//
//////////////////////////////////////////////////////////////////////////
function image_keyboard(evt)
    {
    var evt = (evt) ? evt : ((event) ? event : null);
    var keycode = evt.keyCode;
    var keyname = String.fromCharCode(keycode);
    if( (keyname>='0' && keyname<='9')
     ||	(keyname>='A' && keyname<='Z')
     || (keyname>='a' && keyname<='z') )
        {
	for( var i in varinfo[current_image].choices )
	    {
	    var split_choices = choice_array(current_image,i);
	    if( split_choices[2] == keyname )
	        {
		make_mark( "keyboard", current_image, split_choices[0] );
		return true;
		}
	    }
	}
    else
        {
	return true;
	}
    return false;
    }

//////////////////////////////////////////////////////////////////////////
//	Figures out where the mouse is or where the finger touched.	//
//	Unfortunately, very browser dependent.				//
//////////////////////////////////////////////////////////////////////////
function get_position( e )
    {
    if( !e ) { e = window.event; }
    if( e.preventDefault ) { e.preventDefault(); }
    // if( e.targetTouches && e.targetTouches[0] )
	// { e = e.targetTouches[0]; }		// Android
    // else
    if( e.touches && e.touches[0] )
	{ e = e.touches[0]; }			// iPhone/iPad
    if( (typeof(e.pageX)!="undefined") )	// Mozilla, opera, etc.
	{
	mouse_x=e.pageX;	// +window.pageXOffset;
	mouse_y=e.pageY;	// +window.pageYOffset;
	}
    else if( (typeof(e.clientX)!="undefined") )	// Internet Explorer
	{
	mouse_x=e.clientX + document.body.scrollLeft;
	mouse_y=e.clientY + document.body.scrollTop;
	}
    else
	{
	alert("XL([[get_position()]] called but can't find a coordinate.)");
	return false;
	}
    //debug("mouse="+mouse_x+","+mouse_y+", base="+varinfop.base_x+","+varinfop.base_y);
    mouse_x -= varinfop.base_x;
    mouse_y -= varinfop.base_y;
    return true;
    }

//////////////////////////////////////////////////////////////////////////
//	Figure out where the base of the image we're in is.		//
//////////////////////////////////////////////////////////////////////////
function set_base( action )
    {
    var tmp = parentoffset("offsetLeft");
    if( tmp <= 0 )
	{
	// debug(action+" failed to set base.");
	}
    else
	{
	varinfop.base_x = tmp;
	varinfop.base_y = parentoffset( "offsetTop"  );
	//debug(action+" sets base="+varinfop.base_x+","+varinfop.base_y);
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Quick version of image_keyboard so we don't save function body	//
//	in event handler, just something that calls it.			//
//////////////////////////////////////////////////////////////////////////
function image_keyboard_s(e) { image_keyboard(e); }

//////////////////////////////////////////////////////////////////////////
//	Used as even handler for things that are ignoring events.	//
//////////////////////////////////////////////////////////////////////////
function return_false()
    {
    return false;
    }

//////////////////////////////////////////////////////////////////////////
//	Document body loaded.						//
//////////////////////////////////////////////////////////////////////////
function body_loaded()
    {
    document.body.ondragstart = return_false;
    document.body.onlongclick = return_false;
    }

//////////////////////////////////////////////////////////////////////////
//	Set whether we are handling image events or not.		//
//////////////////////////////////////////////////////////////////////////
var event_handlers =
    {
    onkeydown:		{ ref:document, handler:image_keyboard_s },
    ondragstart:	{ ref:document.body, handler:return_false },
    onlongclick:	{ ref:document.body, handler:return_false }
    //ondragstart:	{ ref:document.body, handler:return_false }
    };
event_handlers[ (is_IE?"onmousemove":"onselectstart") ]
    = { ref:document.body, handler:return_false };

function image_mode( action, on_off )
    {
    //debug(action+" sets image_mode( on_off="+on_off+" )");
    for( var event_name in event_handlers )
        {
	var ev = event_handlers[event_name];
	if( ! on_off )
	    { ev.ref[event_name] = ev.old; }
	else
	    {
	    ev.old = ev.ref[event_name];
	    ev.ref[event_name] = ev.handler;
	    }
	// debug(event_name+"=["+ev.ref[event_name]+"]");
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Add suffix to a variable that has an index.			//
//////////////////////////////////////////////////////////////////////////
function add_suffix( name, suff )
    {
    var ret = name + "" + suff;
    if( /^(.*?)([_\d]*)$/.test( name ) )
        { ret = RegExp.$1 + "" + suff + RegExp.$2; }
    debug("add_suffix("+name+","+suff+") returning ["+ret+"]");
    return ret;
    }

var last_x = -1;
var last_y = -1;
//////////////////////////////////////////////////////////////////////////
//	Called when user causes event over an image/canvas.		//
//////////////////////////////////////////////////////////////////////////
function image_event( obj, action, vname, e )
    {
    if( !e ) { e = window.event; }
    // if( is_Android && e.preventDefault ) { e.preventDefault(); }

    //debug("image_event("+action+"), mousemove="+obj.onmousemove+", touchstart="+obj.ontouchstart);

    if( last_object_focused && last_object_focused != obj )
        {
	var_changed( last_object_focused, last_object_focused_name, action );
	return false;
	}

    varinfop = varinfo[current_image = vname];

    if( action != "onMouseMove" && action != "onTouchMove" )
	{
//	debug(vname
//	    + " ro="+read_only
//	    + " action="+action
//	    + " drawing="+varinfop.drawing_mode
//	    + " markup="+varinfop.markup);
	}

    if( read_only ) return true;

    if( action == "onMouseMove" || action == "onTouchMove" )
	{
	get_position( e );
//	debug( action
//	    + ": " +last_x+","+last_y+"-&gt;"+mouse_x+","+mouse_y
//	    + " mode="+varinfop.drawing_mode);
	if( varinfop.drawing_mode > 0 )
	    {
	    if( varinfop.drawing_mode == 1 )
		{
		if( ! values[current_image] )
		    {
		    values[current_image] = "";
		    need_redraw = true;
		    }
		values[current_image] += pack_xyl(" ",last_x,last_y);
		varinfop.drawing_mode = 2;
		varinfop.canvas.ctx.moveTo(last_x,last_y);
		// debug("moveTo("+last_x+","+last_y+")");
		}
	    values[current_image] += pack_xyl("-",mouse_x,mouse_y);
	    varinfop.canvas.ctx.lineTo( mouse_x, mouse_y );
	    // debug("lineTo("+mouse_x+","+mouse_y+")");
	    varinfop.canvas.ctx.stroke();
	    }
	last_x = mouse_x;
	last_y = mouse_y;
	varinfop.might_be_click = false;
	return false;
	}
    else if( action == "onMouseOut" )
	{
	image_mode(action,false);
	return false;
	}
    else if( action == "onMouseOver" )
        {
	image_mode(action,true);
	set_base( action );
	return false;
	}
    else if( action=="onMouseUp" || action=="onTouchEnd" )
        {
	if( varinfop.might_be_click
	 && varinfop.current_choice
	 && varinfop.current_choice != "Other" )
	    {make_mark(action,current_image,varinfop.current_choice);}
	if( action == "onTouchEnd" )
	    { image_mode(action,false); }
	else
	    {
	    // debug(action + " logic.");
	    }
	if( varinfop.drawing_mode > 1 )
	    {
	    trigger_change(true);
	    if( need_redraw ) { redraw_wrapper(); }
	    }
	varinfop.drawing_mode = 0;
	return false;
	}
    else if( action == "onTouchStart" || action == "onMouseDown" )
	{
	varinfop.might_be_click = true;

	if( action == "onTouchStart" )
	    { set_base( action ); }	// Only chance with touch devices
	else if( e.preventDefault )
	    { e.preventDefault(); }

	get_position(e);
	last_x = mouse_x;
	last_y = mouse_y;
	if( varinfop.markup )
	    {
	    varinfop.drawing_mode = 1;
	    if( varinfop.type == "signature" )
	        {
		values[ varinfo[current_image].sigdate ] =
		    formatted_date(new Date(),false);
		// debug( "values["+vi+"] = "+values[vi] );
		}
	    }
	image_mode(action,true);
	return false;
	}
    else if( action == "onClick" )
        {
	if( varinfop.might_be_click
	 && varinfop.current_choice 
	 && varinfop.current_choice != "Other" )
	    {make_mark(action,current_image,varinfop.current_choice);}
	else
	    {
	    // debug("Ignoring "+action);
	    }
	}
    else
        {
	// alert("Unhandled interupt ["+action+"]");
	// return false;
	return true;
	}
    }

//////////////////////////////////////////////////////////////////////////
//	User clicked on a label button.					//
//////////////////////////////////////////////////////////////////////////
function image_button_clicked( vname, new_choice )
    {
    if( new_choice == "Clear" || new_choice == "Unanswered" )
	{
	values[vname] = "";
	if( varinfo[vname].type == "signature" )
	    { values[ varinfo[vname].sigdate ] = ""; }
	}
    else if( new_choice == "Other" )
	{ add_choice( vname, new_choice ); }
    else
        { varinfo[vname].current_choice = new_choice; }
    redraw_wrapper();
    }

//////////////////////////////////////////////////////////////////////////
//	Return the pretty printable version of a token.			//
//////////////////////////////////////////////////////////////////////////
function token_to_text( s )
    {
    return (s+"").replace(/_/g," ");
    }

//////////////////////////////////////////////////////////////////////////
//	Return the token form of the pretty text.			//
//////////////////////////////////////////////////////////////////////////
function text_to_token( s )
    {
    return (s.replace(/[^\w]/g,"_")).replace(/_+/g,"_");
    }

//////////////////////////////////////////////////////////////////////////
//	Adding a new type of label to an existing labeled drawing.	//
//////////////////////////////////////////////////////////////////////////
function add_choice( name, choicevalue, choicetext, choicelet )
    {
    var in_use = {};
    var other_ind = -1;
    if( choicevalue == "Other" && choicelet != "?" )
        {
	choicetext = usprompt("XL(Enter another value for [["+name+"]]:)","");
	if( choicetext == null ) { return; }
	choicevalue = text_to_token(choicetext);
	}
    for( var choices_ind in varinfo[name].choices )
        {
	//OLDchoice_split = varinfo[name].choices[choices_ind].split(SEP.FIELD);
	var choice_split = choice_array(name,choices_ind);
	if( choice_split[0]==choicevalue )	{ return choice_split[2]; }
	if( choice_split[0]=="Other" )		{ other_ind=choices_ind; }
	}
    var taglets = (choicevalue.replace("_","")).split("");
    if( (typeof(choicelet)!="undefined") && choicelet!="" )
        { taglets.unshift(choicelet); }
    taglets.push( LEGAL_LABELS.split("") );
    for( var i in taglets )
	{
        if( taglets[i]=="?" ||
	    (! in_use[taglets[i]] && LEGAL_LABELS.indexOf(taglets[i]) >= 0 ) )
	    {
	    if( !(typeof(choicetext)!="undefined") || choicetext=="" )
	        { choicetext = token_to_text( choicevalue ); }
	    //OLDvar to_add = choicevalue+SEP.FIELD+choicetext+SEP.FIELD+taglets[i];
	    var to_add = [ choicevalue, choicetext, taglets[i] ];
	    if( choicevalue == "Unanswered" || choicevalue == "None" )
		{ varinfo[name].choices.unshift( to_add ); }
	    else if( other_ind < 0 )
		{ varinfo[name].choices.push( to_add ); }
	    else
	        {
		varinfo[name].choices.push( varinfo[name].choices[other_ind] );
		varinfo[name].choices[other_ind] = to_add;
		}
	    varinfo[name].current_choice = choicevalue;
	    return taglets[i];
	    }
	}
    alert("Cannot find new choice for \""+choicevalue+"\".");
    }

//////////////////////////////////////////////////////////////////////////
//	Do it this way due to IE split bug.				//
//////////////////////////////////////////////////////////////////////////
function split_value_into_xyl( value )
    {
    var coord_list=value.split(/([-/ ]\w+)/);
    if( coord_list.length == 0 )
	{
	coord_list = new Array();
	var to_break_down = value;
	while( /([- /]\w+)(.*)/.test(to_break_down) )
	    {
	    coord_list.push( RegExp.$1 );
	    to_break_down = RegExp.$2;
	    }
	}
    return coord_list;
    }

//////////////////////////////////////////////////////////////////////////
//	Add labels to varinfo[name].choices that aren't in args.choices	//
//////////////////////////////////////////////////////////////////////////
function update_image_choices( name )
    {
    var value = lookup( name );
    var coord_list=split_value_into_xyl( value );
    for(var coordind=0;
	coordind<coord_list.length;
	coordind++ )
	{
	var coord = coord_list[coordind];
	if( /(.)(\w)(\w)(\w)(\w)(.*)/.test(coord) )
	    {
	    var fnc = RegExp.$1;
	    var point_label = RegExp.$6;

	    if( fnc == "/" )
		{ add_choice(name,point_label); }
	    }
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Associate background picture with one canvas and then redraw	//
//	any lines or labels associated with it.				//
//////////////////////////////////////////////////////////////////////////
function do_one_canvas( name, canvasp, imgp )
    {
    varinfo[name].canvas = canvasp;
    varinfo[name].width = imgp.width;
    varinfo[name].height = imgp.height;
    canvasp.setAttribute( "width",  imgp.width  );
    canvasp.setAttribute( "height", imgp.height );
    // if( typeof(G_vmlCanvasManager) != "undefined" )
    if( !canvasp.getContext )
        { G_vmlCanvasManager.initElement(canvasp); }
    if( !canvasp.getContext )
        {
	alert("G_vmlCanvasManager.initElement failed!");
	return;
	}
    var ctx = canvasp.getContext('2d');
    ctx.drawImage( imgp, 0, 0 );
    ctx.fillStyle = ctx.strokeStyle = "blue";
    ctx.beginPath();
    var value = lookup( name );
    if( value )
	{
	var s = "";
	var coord_list=split_value_into_xyl( value );
	var coordind;
	for(coordind=0; coordind<coord_list.length; coordind++ )
	    {
	    var coord = coord_list[coordind];
	    if( /(.)(\w)(\w)(\w)(\w)(.*)/.test(coord) )
		{
		// alert("coord=["+coord+"], c=["+RegExp.$1+"] x0=["+RegExp.$2+"], x1=["+RegExp.$3+"] y0=["+RegExp.$4+"] y1=["+RegExp.$5+"] l=["+RegExp.$6+"]");
		var fnc = RegExp.$1;
		var point_x
		    = ArrayIndex(DIGITS,RegExp.$2)*DIGITS.length
			+ ArrayIndex(DIGITS,RegExp.$3);
		var point_y
		    = ArrayIndex(DIGITS,RegExp.$4)*DIGITS.length
			+ ArrayIndex(DIGITS,RegExp.$5);
		var point_label = RegExp.$6;

		if( fnc == " " )
		    { ctx.moveTo( point_x, point_y ); }
		else if( fnc == "-" )
		    { ctx.lineTo( point_x, point_y ); }
		else if( fnc == "/" )
		    {
		    ctx.strokeText(
			add_choice(name,point_label),
			    point_x,point_y );
		    }
		}
	    }
	ctx.stroke();
	// ctx.closePath();
	// alert("We draw ["+coordind+"] strokes w="+canvasp.width+" h="+canvasp.height);
	}
    canvasp.ctx = ctx;
    }

//////////////////////////////////////////////////////////////////////////
//	Go draw all canvases once rest of page is loaded.		//
//////////////////////////////////////////////////////////////////////////
function update_all_canvases()
    {
    var left_to_do = 0;
    var canvasp;
    for( imagecontext in imagecontexts )
        {
	var imgp = imageinfo[imagecontext];
	if( imgp.width <= 1 || imgp.height <= 1 )
	    { left_to_do++; }
	else
	    {
	    for( varind in imagecontexts[imagecontext] )
		{
		if( imagecontexts[imagecontext][varind] != 0 )
		    {
		    }
		else if( !(canvasp = document.getElementById( varind ) ) )
		    {
		    left_to_do++;
		    }
		else
		    {
		    do_one_canvas( varind, canvasp, imgp );
		    if( is_Android )
			// Android seems to forget the event handlers
			// created with .innerHTML
		        {
			for( var i in EVENT_LIST )
			    {
			    var ind = EVENT_LIST[i].toLowerCase();
			    var st
				= "image_event(document.getElementById(\""
				+ varind
				+ "\"),"
				+ "\"" + EVENT_LIST[i] +"\","
				+ "\"" + varind +"\","
				+ "event);";
			    canvasp.setAttribute(ind,st);
			    }
			}
		    imagecontexts[imagecontext][varind] = canvasp;
		    }
		}
	    }
	}
    // if( left_to_do > 0 ) { setTimeout( update_all_canvases, 100 ); }
    if( left_to_do > 0 )
	{ setTimeout( update_all_canvases, 1 ); }
//    else
//        {
//	var table_dims	= get_browser_dims();
//	var cvp		= document.getElementById("tableid");
//	var m = "";
//	if( table_dims.width )
//	    {
//	    cvp.width = Math.floor(table_dims.width) + "px";
//	    m += "\nSetting width to "+cvp.width;
//	    }
//	if( table_dims.height )
//	    {
//	    cvp.height = Math.floor(table_dims.height) + "px";
//	    m += "\nSetting height to "+cvp.height;
//	    }
//	alert( m );
//	}
    }

//////////////////////////////////////////////////////////////////////////
//	Returns true if val is an integer in specified range.		//
//	Called when evaluating expression.				//
//////////////////////////////////////////////////////////////////////////
function int_between( val, minv, maxv )
    {
    // alert("int_between("+val+","+minv+","+maxv+")");
    var ret = (/^[\+\d\-]\d*$/.test(val) && ((1*val)>=minv) && ((1*val)<=maxv) );
    if( !ret )
        {
	nice_errors.push( '"'+val + "\" XL(is not an integer between) "+
	    minv+" XL(and) "+maxv+".");
	}
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	Returns true if val is an float in specified range.		//
//	Called when evaluating expression.				//
//////////////////////////////////////////////////////////////////////////
function float_between( val, minv, maxv )
    {
//    return ((/^[\+\d\-|]\d*$/.test(val)
//	    || /^[\+\d\-]\d*\.\d*$/.test(val)
//	    || /^\.\d\d*$/.test(val) )
//	    && ((1*val)>=minv) && ((1*val)<=maxv) );
    var ret = ( !isNaN(1*val) && (1*val)>=minv && ((1*val)<=maxv)
    		? 1 : 0 );
    if( !ret )
        {
	nice_errors.push( '"'+val + "\" XL(is not a floating point value between) "+
	    minv+" XL(and) "+maxv+".");
	}
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	Returns true if val matches regular expression.			//
//	Called when evaluating expression.				//
//////////////////////////////////////////////////////////////////////////
function checkexp( varval, varexp )
    {
    // varexp = varexp.replace(/\\\\/g,"\\");
    var re = new RegExp( varexp );
    var ret = varval.match( re );
    // alert("checkexp("+varval+","+varexp+") returns ["+ret+"]");
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	Return the current date (and time if requested) in a standard	//
//	format.								//
//////////////////////////////////////////////////////////////////////////
function formatted_date( dobj, show_time_flag )
    {
    var res = sprintf("%02d/%02d/%04d",
        dobj.getMonth()+1, dobj.getDate(), dobj.getFullYear());
    if( show_time_flag )
        { res += sprintf(" %02d:%02d",dobj.getHours(),dobj.getMinutes()); }
    return res;
    }

//////////////////////////////////////////////////////////////////////////
//	Get rid of any time information (e.g. 3h2min)			//
//////////////////////////////////////////////////////////////////////////
function strip_and_parse_time( time_str )
    {
    time_str = time_str.replace(/\d+min/,"");
    time_str = time_str.replace(/\d+h/,"");
    time_str = time_str.replace(/\d+d/,"");
    time_str = time_str.replace(/\d+m/,"");
    time_str = time_str.replace(/\d+y/,"");
    return Date.parse( time_str );
    }

//////////////////////////////////////////////////////////////////////////
//	User is trying to enter either a date/time or an interval of	//
//	time, perhaps relative to the date/time in the expression	//
//	before {} or after {}.						//
//	If entering a date, calculate the interval of time,		//
//	if entering an interval, calculate the	date.			//
//////////////////////////////////////////////////////////////////////////
function datetime_check( ob, vname )
    {
    var after_epoch;
    var ref_value = "";
    var prev = lookup( vname );
    var sgn;
    var use_time = ( !varinfo[vname].presentation
	|| varinfo[vname].presentation!="just_time" );
    if( typeof(varinfo[vname].before) != "undefined" )
        { ref_value=varinfo[vname].before; sgn= -1; }
    else if( typeof(varinfo[vname].after) != "undefined" )
        { ref_value=varinfo[vname].after; sgn=1; }
    else
        { ref_value=formatted_date(new Date(),use_time); sgn=1; }

    if( ref_value != "" ) { after_epoch = strip_and_parse_time( ref_value ); }
    if( ! after_epoch )
        {
	// alert("Parsing new date for "+vname);
	ref_value = formatted_date( new Date(), use_time );
	after_epoch = strip_and_parse_time( ref_value )
	}
    do  {
	var errs = new Array();
	var elapsed = 0;
	if( /\//.test(ob.value) || /\d\d\d\d/.test(ob.value) )
	    {	// We have an absolute date, use it.  Get rid of rest of stuff.
	    ob.value = ob.value.replace(/\s+\d+[a-z]+/,"");
	    if( /^\s*(\d\d\d\d)\s*$/.test(ob.value) )
	        { ob.value = "07/01/" + RegExp.$1; }
	    else if( /^\s*(\d+)\/(\d\d\d\d)\s*$/.test(ob.value) )
	        { ob.value = RegExp.$1 + "/15/" + RegExp.$2; }
	    before_epoch = strip_and_parse_time( ob.value );
	    if( ! before_epoch )
	        {
		errs.push("XL([["+ob.value+"]] is not a date or time.)");
		}
	    }
	else
	    {
	    if( /(\d+)y/.test(ob.value)  ) {elapsed+=(RegExp.$1 * ONE_YEAR);}
	    if( /(\d+)mo/.test(ob.value) ) {elapsed+=(RegExp.$1 * ONE_MONTH);}
	    if( /(\d+)d/.test(ob.value)  ) {elapsed+=(RegExp.$1 * ONE_DAY);}
	    if( /(\d+)h/.test(ob.value)  ) {elapsed+=(RegExp.$1 * ONE_HOUR);}
	    if( /(\d+)mi/.test(ob.value) ) {elapsed+=(RegExp.$1 * ONE_MINUTE);}
	    if( elapsed != 0 )
	        { before_epoch = after_epoch + sgn*elapsed; }
	    else
	        {
		errs.push("XL(Should be expressed as [[\"nny nnm nnd\"]] or [[\"nn/nn/nn\"]].)");
		}
	    }
	if( errs.length )
	    {
	    errs.push( "XL(Re-enter [[" + varinfo[vname].notempty + "]]:)" );
	    ob.value = usprompt( errs.join("\n"), ob.value );
	    if( ob.value == null ) { ob.value = ""; }
	    }
	else
	    {
	    ob.value = formatted_date( new Date( before_epoch ), use_time );
	    if( varinfo[vname].before || varinfo[vname].after )
		{
		ob.value += " ";
		elapsed = sgn * ( before_epoch - after_epoch );
		if( elapsed < 0 )
		    {
		    elapsed = -elapsed;
		    ob.value += "-";
		    }
		var usince = Math.floor( elapsed / ONE_YEAR );
		    elapsed -= usince * ONE_YEAR;
		    if( usince > 0 ) { ob.value += ( usince + "y" ); }
		usince = Math.floor( elapsed / ONE_MONTH );
		    elapsed -= usince * ONE_MONTH;
		    if( usince > 0 ) { ob.value += ( usince + "mon" ); }
		usince = Math.floor( elapsed / ONE_DAY );
		    if( usince > 0 ) { ob.value += ( usince + "d" ); }
		    elapsed -= usince * ONE_DAY;
		usince = Math.floor( elapsed / ONE_HOUR );
		    if( usince > 0 ) { ob.value += ( usince + "h" ); }
		    elapsed -= usince * ONE_HOUR;
		usince = Math.floor( elapsed / ONE_MINUTE );
		    if( usince > 0 ) { ob.value += ( usince + "min" ); }
		    elapsed -= usince * ONE_DAY;
		}
	    }
	} while( ob.value!="" && errs.length );
    if( varinfo[vname].presentation=="just_date" )
        { ob.value = ob.value.replace(/ \d\d*:[^\s]*/,""); }
    values[vname] = ob.value;
    return true;
    }

//////////////////////////////////////////////////////////////////////////
//	If the server isn't processing any queries and we have stuff in	//
//	the queue, send it off to the server.				//
//////////////////////////////////////////////////////////////////////////
var background_queries = new Array();
var waiting = false;
function check_query_queue()
    {
    if( !waiting && background_queries.length > 0 )
        {
	p.background_query.src = PROGRAM+".cgi?query="
	    + background_queries.join( SEP.REC );
    	background_queries = new Array();
	waiting = true;
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Add query to list of things we're asking the server.  Then	//
//	check to see if we have any replies.  We won't get a reply to	//
//	this query, but we might get replies to previous queries.	//
//////////////////////////////////////////////////////////////////////////
function add_query( query )
    {
    background_queries.push( encodeURI(query) );
    check_query_queue();
    }

//////////////////////////////////////////////////////////////////////////
//	Server has responded.  Check for any other queries.		//
//////////////////////////////////////////////////////////////////////////
function query_reply()
    {
    waiting = false;
    check_query_queue();
    }

//////////////////////////////////////////////////////////////////////////
//	Data type citistatezip is magic.  If you fill it out partially	//
//	it tries to figure out the rest of it by looking it up in a	//
//	zipcode table.							//
//////////////////////////////////////////////////////////////////////////
function citystatezip_check( ob, vname )
    {
//    alert("citystatezip called with ["
//        + ( !(typeof(vname)!="undefined") ? "?" : vname ) + "]" );
    var city;
    var state;
    var zipfive;
    var ziprest;
    while( 1 )
	{
	city = "";
	state = "";
	zipfive = "";
	ziprest = "";
	if( /^(\w.*),\s*(\w+)\s+(\d\d\d\d\d)(-\d\d\d\d.*)$/.test( ob.value ) )
	    {city=RegExp.$1; state=RegExp.$2; zipfive=RegExp.$3; ziprest=RegExp.$4;}
	else if( /^(\w.*),\s*(\w.*\w)\s+(\d\d\d\d\d)$/.test( ob.value ) )
	    {city=RegExp.$1; state=RegExp.$2; zipfive=RegExp.$3;}
	else if( /^(\w.*),\s*(\w.*\w)$/.test( ob.value ) )
	    {city=RegExp.$1; state=RegExp.$2;}
	else if( /^(\d\d\d\d\d)(-\d\d\d\d.*)$/.test( ob.value ) )
	    {zipfive=RegExp.$1; ziprest=RegExp.$2;}
	else if( /^(\d\d\d\d\d)$/.test( ob.value ) )
	    {zipfive=RegExp.$1;}
	if( zipfive ) { break; }
	ob.value = usprompt(
	    "XL(You must specify at least a zip code.)\n" +
	    "XL(Re-enter [[" + varinfo[vname].notempty + "]]:)", ob.value );
	if( ob.value == null )
	    {
	    ob.value = "";
	    return;
	    }
	}
    if( city && state )
        {
	zip_to_citystate[zipfive] = city + ", " + state;
	}
    else if( zip_to_citystate[zipfive] )
        {
	citystate = (zip_to_citystate[zipfive]+"").split(", ");
	city = citystate[0];
	state = citystate[1];
	}
    if( city )
        { ob.value = city+", "+state+" "+zipfive+ziprest; }
    else
        { ob.value = zipfive+ziprest; }
    values[vname] = ob.value;
    values[vname+"_city"] = city;
    values[vname+"_state"] = state;
    values[vname+"_zip"] = ""+zipfive+ziprest;
    add_query("zipcode"+SEP.FIELD+vname+SEP.FIELD+zipfive);
    }

//////////////////////////////////////////////////////////////////////////
//	Data type address is magic.  If you fill it out partially	//
//	it tries to figure out the rest of it by looking it up in a	//
//	zipcode table.							//
//////////////////////////////////////////////////////////////////////////
function address_check( ob, vname )
    {
    values[vname] = ob.value;
    if( !address_cache[ ob.value ] )
	{ add_query( "address" + SEP.FIELD + vname + SEP.FIELD + ob.value ); }
    else
	{
	var i;
	for( i=1; i<reply_array.length; i+=2 )
	    { values[vname+"_"+reply_array[i]] = reply_array[i+1]; }
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Server has an updated value for city state and zip based on zip	//
//////////////////////////////////////////////////////////////////////////
function reply_citystatezip( vname, city, state, zip )
    {
    values[vname] = city + ", " + state + " " + zip;
    values[vname+"_city"] = city;
    values[vname+"_state"] = state;
    values[vname+"_zip"] = zip;
    redraw_wrapper();
    }

//////////////////////////////////////////////////////////////////////////
//	Server has an updated value for city state and zip based on zip	//
//////////////////////////////////////////////////////////////////////////
function reply_address( vname, reply_array )
    {
    values[vname] = reply_array.shift();
    address_cache[ values[vname] ] = reply_array;
    var i;
    for( i=0; i<reply_array.length; i+=2 )
        { values[vname+"_"+reply_array[i]] = reply_array[i+1]; }
    redraw_wrapper();
    }

//////////////////////////////////////////////////////////////////////////
//	User is trying to leave the page.  If there are modifications	//
//	that haven't been saved, warn him.				//
//////////////////////////////////////////////////////////////////////////
var unlc_ret;
function unload_check()
    {
    if( !something_changed )
        { unlc_ret = null; }
    else
        {
	unlc_ret =
	    "XL(You have modified this record but not saved your changes.)";
	// if( event ) { event.returnValue = unlc_ret; }
	}
    return unlc_ret;
    }

//////////////////////////////////////////////////////////////////////////
//	User changed something.  Remember so we can warn him if he	//
//	tries to leave the form without updating.			//
//////////////////////////////////////////////////////////////////////////
function trigger_change( flag )
    {
    something_changed = flag;
    if( genform && ACTION=="" )
        {}
    else if( flag )
        {
	window.onbeforeunload=unload_check;
	p.update_button.style.display = ( ANON_MODE ? "none" : "" );
	p.save_button.style.display =
	    ( ( is_phonegap || !ANON_MODE )
	    ? "none" : "" );
	}
    else
        { window.onbeforeunload=null; }
    }

//////////////////////////////////////////////////////////////////////////
//	Evaluate an expression after setting "this" to some meaningful	//
//	value.  Also useful as a nexus for dumping debug information.	//
//	An empty expression is always true.				//
//////////////////////////////////////////////////////////////////////////
function evalexpr( exp, thisvalue )
    {
    var ret = true;
    if( (typeof(exp)!="undefined") && exp != "" )
	{
	last_referred_value = thisvalue;
	// try { ret = eval( exp.replace(/\\/g,"\\\\") ); }
	try { ret = eval( exp ); }
	catch(ex)
	    {
	    alert("evalexpr( ["+exp+","+thisvalue+"] generated a ["+
	        ex.message + "]");
	    }
//	ret = eval( exp );
	}
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	Check user's input and if not right, prompt again.		//
//////////////////////////////////////////////////////////////////////////
function text_check( obj, vname, setvar_flag )
    {
    while( true )
        {
	nice_errors = new Array();
	if( varinfo[vname].choices )
	    {
	    for( var i=0; i<varinfo[vname].choices.length; i++ )
	        {
		if( varinfo[vname].choices[i][0] == obj.value )
		    {
		    values[vname] = obj.value;
		    return;
		    }
		}
	    }
	if( varinfo[vname].legalcharacters )
	    {
	    var s = (obj.value+"").split('');
	    for( i in s )
		{
		var c = s[i];
		if( varinfo[vname].legalcharacters.indexOf( c ) < 0 )
		    {
		    if( /[a-z]/.test(c) )	{ c = c.toUpperCase(); }
		    else if( /[A-Z]/.test(c) )	{ c = c.toLowerCase(); }

		    if( varinfo[vname].legalcharacters.indexOf( c ) < 0 )
		        {
			nice_errors.push("XL(Illegal character):  "+s[i]);
			break;
			}
		    else
		        { s[i] = c; }
		    }
		}
	    obj.value = s.join("");
	    }
	if( nice_errors.length==0 )
	    {
	    var mustexpr = varinfo[vname].must;
	    if( typeof(mustexpr)!="undefined"
		&& obj.value != ""
		&& ! evalexpr(mustexpr,obj.value) )
		{ nice_errors.push("XL(Did not match constraints)"); }
	    }

	if( nice_errors.length > 0 )
	    {
	    if( varinfo[vname].help )
	        { nice_errors.push( varinfo[vname].help ); }
	    nice_errors.push("XL(Re-enter [["+varinfo[vname].notempty+"]]:)");
	    }

	var pstr = nice_errors.join("\n");

	if( ! setvar_flag ) { return pstr; }

	if( nice_errors.length <= 0 )
	    { break; }
	else
	    {
	    obj.value = usprompt( pstr, obj.value );
	    if( obj.value == null )
		{
		obj.value = "";
		break;
		return;
		}
	    }
	}
    values[vname] = obj.value;
    }

//////////////////////////////////////////////////////////////////////////
//	User has done something to a <select> or checkbox.		//
//	Force legal result (i.e. if None or Unanswered set, no other	//
//	options are set.  If no options are set, set Unanswered.	//
//	If other set, ask for new value and extend list.		//
//////////////////////////////////////////////////////////////////////////
function list_check( ob, vname )
    {
    var seen = {};
    var prev = lookup(vname);
    if( prev=="" ) { prev="Unanswered" };
    var values_list = (prev+"").split(",");
    var i;
    for( i=0; i<values_list.length; i++ )
        { seen[ values_list[i] ]=1; }

    var obs;
    var obslen;
    var setvarind;
    values_list = new Array();
    if( ob.options )
        {
	obs = ob.options;
	obslen = obs.length;
	setvarind = "selected";
	}
    else if( varinfo[vname].presentation == "buttons" )
        {
//	obs = window.document[FORM_NAME][vname];
//	if( varinfo[vname].type == "oneof" )
//	    {
//	    for( i=0; i<obs.length; i++ )
//	        { obs[i].style.backgroundColor = ""; }
//	    }
////	ob.style.backgroundColor =
////	    ( ob.style.backgroundColor==LIT_BUTTON ? "" : LIT_BUTTON );
//	ob.style.backgroundColor =
//	    ( ob.style.backgroundColor ? "" : LIT_BUTTON );
	if( ob == "Unanswered" || ob == "None" || ob == "Unknown" )
	    {
	    values[vname] = ob;
	    return;
	    }
	obslen = varinfo[vname].choices.length;
	for( i=0; i<obslen; i++ )
	    {
	    var valname = varinfo[vname].choices[i][0];
	    if( varinfo[vname].type == "oneof" )
	        { seen[ valname ] = 0; }
	    if( valname == ob )
	        { seen[ valname ] = ! seen[ valname ]; }
	    }
	}
    else
        {
	obs = window.document[FORM_NAME][vname];
	obslen = obs.length;
	setvarind = "checked";
	}
    var lastset = "Unanswered";
    var other_asked;
    for( i=0; i<obslen; i++ )
	{
	var isset;
	var v;
	if( obs )
	    {
	    isset = obs[i][setvarind];
	    v = obs[i].value;
	    }
	else
	    {
	    // The following will not work for multitier.
	    v = varinfo[vname].choices[i][0];
	    isset = seen[v];
	    }
	if( isset )
	    {
	    if( v == "Other" )
	        { other_asked = true; }
	    else if( v != "Unanswered" && v != "None" && v != "Unknown" )
		{
		values_list.push( v );
		seen[v] = -1;
		}
	    else
		{
		if( ! seen[v] )
		    {
		    values[vname] = v;
		    return;
		    }
		last_seen = v;
		}
	    }
	}

    if( other_asked )
        {
	var new_text = usprompt("XL(Enter another value for) "+vname+":","");
	new_value = text_to_token( new_text );
	if( !seen[new_value] || seen[new_value] >= 0 )
	    {
	    values_list.push( new_value );
	    var other_index = varinfo[vname].choices.length - 1;
	    varinfo[vname].choices.push( varinfo[vname].choices[other_index] );
	    varinfo[vname].choices[other_index] = [ new_value, new_text ];
	    }
	}
    if( values_list.length )
        { values[vname] = values_list.join(","); }
    else
        { values[vname] = lastset; }
    return;
    }

//////////////////////////////////////////////////////////////////////////
//	User has specified a file.					//
//////////////////////////////////////////////////////////////////////////
function file_check( obj, vname )
    {
    if( obj.pgdata )
	{ values[vname] = obj.pgdata; }
    else
        {
	file_list[vname] = obj;
	values[vname] = obj.value;
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Called when the user changes any value.				//
//	Dispatches to appropriate handler for type.			//
//////////////////////////////////////////////////////////////////////////
function var_changed( obj, varname, event_name )
    {
    var vartype = varinfo[varname].type;
//    alert("var_changed["+varname+","+event_name+","+vartype+"] v=["
//        +obj.value+","+obj.checked+","+obj.selected+"]");
    if(vartype=="text")			{text_check(obj,varname,1);}
    else if(vartype=="GPS")		{GPS_check(obj,varname);}
    else if(vartype=="datetime")	{datetime_check(obj,varname);}
    else if(vartype=="citystatezip")	{citystatezip_check(obj,varname);}
    else if(vartype=="address")		{address_check(obj,varname);}
    else if(vartype=="oneof")		{list_check(obj,varname);}
    else if(vartype=="anyof")		{list_check(obj,varname);}
    else if(vartype=="file")		{file_check(obj,varname);}

    if( varinfo[varname]["submit"]
	&& evalexpr( varinfo[varname]["submit"], values[varname] ) )
	{
	if( varinfo[varname].no_clear )
	    { clear_on_submit = 0; }
	send_to_server( "submit" );
	}
    else
	{
	var need_next_page = 0;
	current_focus = varname;	// Remember where to focus on redraw
	if( vartype != "anyof" && ! is_multi_tiered(varname) )
	    { set_focus_to_next = 1; }
	redraw_wrapper();
	if( varname == last_var_displayed && next_page_exists )
	    { display_page(1); }
	trigger_change(true);
	last_object_focused = 0;
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Return a quoted string.  Try to use quotes that don't conflict.	//
//////////////////////////////////////////////////////////////////////////
function add_quotes( s )
    {
    s = s.replace(/\\/,"\\\\");
    for( qi in QUOTES )
        {
	if( s.indexOf( QUOTES[qi] ) < 0 )
	    { return QUOTES[qi] + s + QUOTES[qi]; }
	}
    return '"' + s.replace(/"/g,'\\"') + '"';
    }

//////////////////////////////////////////////////////////////////////////
//	Return HTML for a oneof supporting multi-tiered menuing.	//
//	Might, some day, produce javascript for pull-down boxes.	//
//////////////////////////////////////////////////////////////////////////
function make_a_multi_tier(current_value,choices,mode,adddelflag,tagcommon)
    {
    var current_split = (current_value+"").split("/");
    var current_split_length = current_split.length;
    if( current_split[0]=="" || current_split[0]=="Unanswered" )
        current_split_length = 0;
    var html = "";
    var sep = "";
    var is_line_per = false;

    for( var sci=0; sci<choices.length; sci++ )
	{
	var anstext = choices[sci][1];
	choice_value_split = (choices[sci][0]+"").split("/");
	choice_value_split_length = choice_value_split.length;
	if( choice_value_split[0] == "" || choice_value_split[0]=="Unanswered" )
	    {
	    choice_value_split_length = 0;
	    if( adddelflag )
		{
	        anstext =
		    ( ( typeof(current_value)=="undefined"
			|| current_value=="" || current_value=="Unanswered" )
		    ? "XL(Add)" : "XL(Remove)");
		anstext = anstext + " " +
		    ( varinfo[name].adddelname
		    ? varinfo[name].adddelname
		    : "XL(entry)" );
		}
	    }
	var match = undefined;
	var selected = false;
	var question = (
			( choices[sci][2] && choices[sci][2]!="?" )
			? choices[sci][2] : anstext );
	for( i=0; typeof(match)=="undefined" && i<current_split_length; i++ )
	    {
	    if( i >= choice_value_split_length )
	        { match = question; }
	    else if( choice_value_split[i] != current_split[i] )
	        { match = ""; }
	    }
	if( typeof(match) == "undefined" )
	    {
	    if( current_split_length == choice_value_split_length-1 )
		{ match = choices[sci][1]; }
	    else if( current_split_length == choice_value_split_length )
	        {
		match = question;
		selected = true;
		}
	    }
	if( match )
	    {
	    html += sep;
	    var classflag =
	        ( selected
		? " class='"+choices[sci][0]+"_checked data_checked rowdata data'"
		: " class='"+choices[sci][0]+"_unchecked data_unchecked rowdata data'"
		);
	    switch( mode )
		{
		case "select":
		    html += "<option value=\""+choices[sci][0]+"\""
		        + ( selected ? " selected" : "" )
			+ classflag
		        + ">" + match + "\n";
		    break;
		case "checks":
		    html += "<nobr><label><input type=checkbox"
			+ " value=\""+choices[sci][0]+"\""
		        + ( selected ? " checked" : "" )
			+ classflag
			+ tagcommon + match + "</label></nobr>\n";
		    sep = ( is_line_per ? "<br>" : "&nbsp;&nbsp;&nbsp" );
		    break;
		case "real_buttons":
		    html += "<label><input type=button"
		       + " value=\""+match+"\""
		       + classflag
		       + tagcommon + "</label>";
		    sep = ( is_line_per ? "<br>" : "" );
		    break;
		case "buttons":
		    html += "<label><button"
			+ classflag
			+ tagcommon
			+ match + "</button></label>";
		    sep = ( is_line_per ? "<br>" : "" );
		    break;
		}
	    }
	}
    // alert("make_a_multi_tier:"+html);
    return html;
    }

//////////////////////////////////////////////////////////////////////////
//	Return width of browsers that should be fixed width, which	//
//	as of this writing appears to only be the iStuff.		//
//////////////////////////////////////////////////////////////////////////
function get_browser_dims()
    {
    // alert("get_browser_width user_agent=["+user_agent+"]");
    if( is_IOS )
	{
	if( navigator.userAgent.indexOf("iPhone") >= 0 )
	    // { return { width:300, height:470 }; }
	    { return { width:300, height:0 }; }
	else if( navigator.userAgent.indexOf("iPad") >= 0 )
	    // { return { width:620, height:940 }; }
	    { return { width:760, height:0 }; }
	}
//    else if( window.innerWidth )
//        { return { width:window.innerWidth,height:window.innerHeight*0.95 }; }
//    else
//        { return { width:document.body.offsetWidth,height:document.body.offsetHeight*0.95 }; }
    return { width:0, height:0 };
    }

//////////////////////////////////////////////////////////////////////////
//	Return true if the variable name will be annoying if focused on	//
//	(at least true for IOS selects)					//
//////////////////////////////////////////////////////////////////////////
function focus_will_be_annoying(name)
    {
    var ret = false;
    if( VIRTUAL_KEYBOARD )
        {
	if( varinfo[name].type=="datetime" || varinfo[name].legalcharacters )
	    {
	    if( ! trip_vc_next ) { return true; }
	    trip_vc_next = 0;
	    return false;
	    }
	}
    if( is_IOS )
        {
	if( varinfo[name].presentation && varinfo[name].presentation=="select" )
	    { ret=true; }
	}
    return ret;
    }

//////////////////////////////////////////////////////////////////////////
//	Return true if named variable is a multi-tiered oneof.		//
//////////////////////////////////////////////////////////////////////////
function is_multi_tiered( name )
    {
    if( varinfo[name].type != "oneof" ) { return false; }
    for( var i=0; i<varinfo[name].choices.length; i++ )
	{
	if( /\//.test(varinfo[name].choices[i][0]) )
	    { return true; }
	}
    return false;
    }

//////////////////////////////////////////////////////////////////////////
//	Delete the embedded file					//
//////////////////////////////////////////////////////////////////////////
function delete_file( vname )
    {
    file_list[vname] = "";
    values[vname] = "";
    current_focus = vname;	// Remember where to focus on redraw
    set_focus_to_next = 1;
    redraw_wrapper();
    trigger_change(true);
    last_object_focused = 0;
    }

//////////////////////////////////////////////////////////////////////////
//	Retrieve an embedded file					//
//////////////////////////////////////////////////////////////////////////
function go_get_file( vname )
    {
    window.document[FORM_NAME].show_field.value = vname;
    send_to_server("download");
    }

//////////////////////////////////////////////////////////////////////////
//	User typed something in the virtual keyboard.			//
//////////////////////////////////////////////////////////////////////////
var open_text_widget;
var open_text_last_value;
var open_text_display;
function textchar( but, c, idtxt )
    {
    if( typeof(event) != "undefined" )
	{ event.stopPropagation(); }
    if( (c+"").length == 1 )
        { open_text_display.value += c; }
    else if( c == "BS" )
        { open_text_display.value = open_text_display.value.replace(/.$/,""); }
    else if( c == "Clear" )
        { open_text_display.value = ""; }
    else
        {
	if( c == "Done" || c == "Next" )
	    {
	    var s = text_check( open_text_display, idtxt, 0 );
	    if( s )
	        {
		alert( s );
		return false;
		}
	    }
	if( c == "Cancel" )
	    {
	    open_text_widget.value =
		( (typeof(values[idtxt])=="undefined") ? "" : values[idtxt] );
	    }
	else if( c == "Done" )
	    { open_text_widget.value = open_text_display.value; }
	else if( c == "Next" )
	    {
	    open_text_widget.value = open_text_display.value;
	    trip_vc_next = 1;
	    }
	else
	    { open_text_widget.value = c; }
	window.scrollBy( -1000, 0 );
	p.popups.style.display = "none";
	open_text_widget.onchange(
	    open_text_widget, open_text_widget.name, "char" );
	delete open_text_display;
	delete open_text_widget;
	}
    // event.preventDefault();
    return false;
    }

//////////////////////////////////////////////////////////////////////////
//	Add HTML to get a new value from user.				//
//////////////////////////////////////////////////////////////////////////
function do_var( args )
    {
    var name = real_name(args.name);
    var type = args.type;
    var i;
    var funky_locked_ro = ( name == "locked" && ! CAN_UNLOCK );

    if( typeof(args.headertext) == "undefined" )
	{args.headertext = token_to_text(args.name);}
    if( typeof(args.prompttext) == "undefined" )
	{args.prompttext = args.headertext;}
    if( args.prompttext )
        { args.notempty = args.prompttext; }
    else if( args.headertext )
        { args.notempty = args.headertext; }
    else
	{ args.notempty = token_to_text(args.name); }

    if( ! /(.*)([:?])$/.test( args.prompttext ) )
	{ args.end_question = ":"; }
    else
	{
	args.prompttext = RegExp.$1;
	args.end_question = RegExp.$2;
	}

    // If first time we've seen this variable, setup global variable
    // with info about it and initialize the choices list.
    if( ! varinfo[name] )
        {
	varinfo[name] = {};
	varinfo[name].choices = args.choices;
	}

    // Merge in all the values argumens EXCEPT choices so that the choices
    // list stays the same between calling.
    for( var i in args )
	{
	if( i != "choices" )
	    {
	    varinfo[name][i] = args[i];
	    }
	}

    if( varinfo[name].flags )
	{
	var flags = varinfo[name].flags.split(",");
	for( var i in flags )
	    { varinfo[name][ flags[i] ] = 1; }
	}
    var context_suffix = name.replace( args.name, "" );
    //alert("vi["+name+"].before="+varinfo[name].before+" .after="+varinfo[name].after);
    if( varinfo[name].before )
	{
	varinfo[name].before = (varinfo[name].before).replace(/lookup\(/g,
	    "ctxlup(\""+context_suffix+"\",");
	}
    if( varinfo[name].after )
	{
	varinfo[name].after = (varinfo[name].after).replace(/lookup\(/g,
	    "ctxlup(\""+context_suffix+"\",");
	}
    if( type == "signature" ) { varinfo[name].markup = "markup"; }
    if( intersects(type,"oneof,anyof,drawing,signature") )
	{
	if( !varinfo[name].presentation )
	    { varinfo[name].presentation = "select"; }
	if( ! varinfo[name].choices )
	    { varinfo[name].choices = new Array(); }
	if( type=="anyof" && !varinfo[name].no_none )
	    { add_choice(name,"None","XL(None)","?"); }
	if( typeof(varinfo[name]["default"]) == "undefined" )
	    { add_choice(name,"Unanswered","XL(Unanswered)","?"); }
	if( varinfo[name].other )
	    { add_choice(name,"Other","XL(Other)","?"); }
	}
    if( varinfo[name].labelcols == undefined )
        {
	varinfo[name].labelcols =
	    ((varinfo[name].prompttext==""||intersects(type,"drawing,signature"))
	     ? 0 : 1 );
	}

    if( section_ind==section_displaying && page_ind==page_displaying )
        { last_var_displayed = args.name; }

    var prev = lookup( args.name );

    if(prev==undefined || prev=="" || prev=="Unanswered")
	{
	if( varinfo[name] && varinfo[name].persistent )
	    {
	    prev = localStorage.getItem( name );
	    if( prev == null ) { prev = ""; }
	    setvar( name, prev );
	    }
	}

    if(prev==undefined || prev=="" || prev=="Unanswered")
        {
	if( typeof(args["default"]) == "undefined" )
	    { prev=""; }
	else
	    {
	    prev = args["default"];
	    if( varinfo[name].presentation
		&& varinfo[name].presentation=="just_date" )
		{ prev = prev.replace(/ \d\d*:[^\s]*/,""); }
	    values[name] = prev;
	    }
	}

    if( type == "datetime" && nows[prev] )
        {
	nows[ prev = formatted_date( new Date(), true ) ] = 1;
	}

    if( type == "hidden" ) { return prev; }

    var cellclass = "input_ok";
    if( !varinfo[name].adddel && ( prev=="" || prev=="Unanswered" ) )
        {
	if( ! varinfo[name].required )
	    { cellclass = "input_unanswered"; }
	else
	    {
	    needs_input.push( name );
	    cellclass = "input_required";
	    }
	}
    else if( typeof(args.should) != "undefined" && !args.should )
        { cellclass = "input_abnormal"; }
    else if( type=="oneof" )
        {
	var found_choice = -1;
	var is_multi = false;
	for( i=0; i<args.choices.length; i++ )
	    {
	    if( args.choices[i][0] == prev )		{ found_choice=i; }
	    if( ArrayIndex(args.choices[i][0],"/")>=0 )	{ is_multi=true; }
	    }
	if( is_multi && ( found_choice < 0 || args.choices[found_choice][2] ) )
	    { cellclass = "input_unanswered"; }
	}

    for( i in section_stack_class )
        {
	if( PRIORITIES[section_stack_class[i]] < PRIORITIES[cellclass] )
	    { section_stack_class[i] = cellclass; }
	}

    var width;

    // if( type=="hidden" ) { return; }	// Probably obsolete

    var tagcommon = " name=" + (type=="file" ? "file_" : "") + name;
    if( varinfo[name].disabled ) { tagcommon += " disabled=disabled"; }
    if( name == current_focus || set_focus_to_next==2 )
        {
	if( set_focus_to_next!=2 && focus_will_be_annoying(name) )
	    { leave_unfocused = true; }
	else
	    {
	    tagcommon += " id=" + ++focus_id;
	    //alert("We should be focusing on "+name+", focus_id="+focus_id);
	    }
	current_focus = name;
	set_focus_to_next = ( set_focus_to_next==1 ? 2 : 0 );
	}
    tagcommon += " onFocus='setfocus(this,\""+name+"\");'";

    var events_to_handle = [ "onChange" ];
    if( typeof(varinfo[name].presentation)!="undefined" )
        {
	if( varinfo[name].presentation=="buttons" ||
	    ( is_IE && varinfo[name].presentation=="checks") )
	    { events_to_handle.push( "onClick" ); }
	}
    if( type == "datetime" )
	{
	var sz=((varinfo[name].before || varinfo[name].after) ? 10 : 0);
	if( varinfo[name].presentation=="just_date" )
	    {
	    sz += 10;
	    varinfo[name].legalcharacters = "7894561230/";
	    }
	else if( varinfo[name].presentation=="just_time" )
	    {
	    sz += 5;
	    varinfo[name].legalcharacters = "7894561230:";
	    }
	else
	    {
	    sz += 16;
	    varinfo[name].legalcharacters = "7894561230/ :";
	    }
	varinfo[name].rows = args.rows = 1;
	varinfo[name].cols = args.cols = sz;
	if( USE_DATETIME ) { events_to_handle.push( "onBlur" ); }
	}
    for( var i=0; i<events_to_handle.length; i++ )
        {
	tagcommon += " " + events_to_handle[i] + "='var_changed(this,"
	tagcommon += add_quotes( name ) + "," + add_quotes(events_to_handle[i]);
	tagcommon += ");'";
	}

    tagcommon += ">";

    if( ! varinfo[name].choices || funky_locked_ro )
        { force_end_grid(); }
    else
        {
	if( type == "oneof" || type == "anyof" )
	    {
	    if( prev != "" )
		{
		var current_split = (prev+"").split(",");
		for( var optind=0; optind<current_split.length; optind++ )
		    {
		    add_choice( name, current_split[optind] );
		    }
		}
	    if( section_ind == section_displaying )
		{
		width = 100 / varinfo[name].choices.length;
		header_line = "";
		if( varinfo[name].presentation != "checks" &&
		    varinfo[name].presentation != "buttons" )
		    { force_end_grid(); }
		else
		    {
		    for( var oi in varinfo[name].choices )
			{
			var split_opts =
			    //varinfo[name].choices[oi].split(SEP.FIELD);
			    varinfo[name].choices[oi];
			header_line += "<th class=grid width="+width+"%>"
			    + split_opts[1] + "</th>";
			}
		    if( header_line != last_header_line ) { force_end_grid(); }
		    if( ++num_in_grid == 1 )
			{
			add_html(AH_GRID,
			    "<tr class=dataline><th class=grid>&nbsp;"
			    +"</th><th class=data>"
			    +"<table class=grid width=100%><tr class=grid>"
			    + header_line + "</tr></table></th></tr>");
			}
		    }
		}
	    }
	else if( type == "drawing" || type == "signature" )
	    {
	    force_end_grid();
	    update_image_choices( name );
	    }
	}

    if(!varinfo[name].labelclass)
	{varinfo[name].labelclass=default_params.labelclass;}
    if(!varinfo[name].dataclass)
	{varinfo[name].dataclass=default_params.dataclass;}

    var cell_labelclass = sprint0f("%s ",varinfo[name].labelclass) + cellclass;
    var cell_dataclass = sprint0f("%s ",varinfo[name].dataclass) + cellclass; 
    seen_input[ cellclass ] = 1;

    start_cell();
    var cols =
	( varinfo[name].datacols
	? varinfo[name].datacols
	: table_columns - current_column - varinfo[name].labelcols );
    if( varinfo[name].labelcols <= 0 )
	{
	add_html(AH_ALL,
	    "<td class=\""+cell_dataclass+" data\" valign=top colspan="
	    +cols+" align="+(varinfo[name].dataalign||"left")+">" );
	}
    else
	{
        add_html(AH_ALL,"<td valign=top"
	    + " class=\""+cell_labelclass+" rowlabel\""
	    + " align="+(varinfo[name].labelalign||"left")
	    + " colspan="+varinfo[name].labelcols+">" + spacing() );
	}
    if( args.prompttext != "" )
	{
	add_html(AH_ALL,"<label for="+name+">"
	    + args.prompttext + args.end_question + "</label>");
	}
    if( varinfo[name].labelcols > 0 )
        {
	add_html(AH_ALL,"</td><td valign=top colspan="+cols+
	    " class=\""+cell_dataclass+" rowdata\""+
	    " align="+(varinfo[name].dataalign||"left")+">");
	}
    else if( varinfo[name].prompttext != "" )
        { add_html(AH_ALL,"<br>"); }
    if( type=="signature" || type=="drawing" )
        {
	// varinfo[name].sigdate = real_name( args.name + "_date" );
	varinfo[name].sigdate = real_name( args.name + "_date" );
	add_html(AH_ALL,"<center>");

	var imgstring = "";
	var unid = unique_id();
	var event_string="\n";

	if( ! read_only )
	    {
	    for( var i in EVENT_LIST )
		{
		event_string += EVENT_LIST[i].toLowerCase()
		    + "=\'image_event(this,"
		    + "\"" + EVENT_LIST[i] +"\","
		    + "\"" + name +"\","
		    + "event);\'\n";
		}
	    }

	var imgsrc =
	    ( is_phonegap
	    ? ""
	    : ( ( varinfo[name].background ? FORM_DIR : SHARED_DIR ) + "/" )
	    ) +
	    ( varinfo[name].background
	    ?  varinfo[name].background
	    : "signature.jpg"
	    );
	if( varinfo[name].debug )
	    {
	    imgstring += "<table border=1><tr>"
	    	+ "<td width=500px height=500px>"
		+ "<div id=debug_" + name
		+ " style='font-size:small;width:490px;height:490px;overflow:auto'></div></td><td>";
	    }
	// imgstring += snap_string();
	// imgstring += event_string;
	imgstring += ("<canvas class=rowdata id="+name+event_string);
	imgstring += sprint0f( " width=%spx", varinfo[name].width );
	imgstring += sprint0f( " height=%spx", varinfo[name].height );
	imgstring += ">Canvas broken!</canvas>";
	if( varinfo[name].debug ) { imgstring += "</td></tr></table>"; }
	if( imgsrc )
	    {
	    // Add this variable to hash of variables caring about this bg
	    if( ! imagecontexts[imgsrc] ) { imagecontexts[imgsrc] = {}; }
	    // var namep = window.document.getElementById(name);
	    // imagecontexts[imgsrc][name] = ( namep ? namep : 0 );
	    imagecontexts[imgsrc][name] = 0;

	    // If this image doesn't exist, set it up and start it loading
	    // Only load image once, even if used multiple times
	    if( ! imageinfo[imgsrc] )
		{
		imageinfo[imgsrc] = new Image();
		// imageinfo[imgsrc].onload = image_loaded;
		imageinfo[imgsrc].src = imgsrc;
		imageinfo[imgsrc].unqualified_src = imgsrc;
		varinfo[name].image = imageinfo[imgsrc];
		update_image_choices( name );
		}
	    }
	add_html(AH_RWS+AH_RO, imgstring );
	var labelopts = new Array();
	for( var optind=0; optind<varinfo[name].choices.length; optind++ )
	    {
	    var lbl = varinfo[name].choices[optind];
	    labelopts.push( "" + lbl[2] + lbl[0] );
	    }
	add_html(AH_VALUE,
	    "<img class=rowdata name='"+name+"' src='"+imgsrc+"'"+
	    " labels='"+labelopts.join(",")+"'>");
	var rosep = "<br>";
	var rwsep = "<br>";
	if( varinfo[name].choices && varinfo[name].choices.length > 0 )
	    {
	    for ( var optind=0; optind<varinfo[name].choices.length; optind++ )
		{
		//var optsplit = varinfo[name].choices[optind].split(SEP.FIELD);
		var optsplit = varinfo[name].choices[optind];
		var buttext = optsplit[2];
		if( buttext && buttext != "?" )
		    {
		    add_html(AH_ROS, rosep
			+ "<nobr><span class=pic_legend>"+optsplit[2]+"</span>"
			+ "<span class=pic_meaning>- " + optsplit[1] +"</span>"
			+ "</nobr>" );
		    rosep = "\n&nbsp;&nbsp;&nbsp;";
		    }
		if( optsplit[0]=="Unanswered" )
		    { buttext = "XL(Clear)"; }
		else if( optsplit[0]=="Other" )
		    { buttext = "XL(Other)"; }
		add_html(AH_RWS, rwsep
		    + "<nobr><input type=button value='"+buttext+"'"
		    + " onMouseDown='image_button_clicked(\""+name+"\",\""+optsplit[0]+"\");'"
		    + " onTouchStart='image_button_clicked(\""+name+"\",\""+optsplit[0]+"\");'" );
		if( buttext != optsplit[2] )
		    { add_html(AH_RWS, " class='pic_legend rowdata'></nobr>" ); }
		else
		    {
		    add_html(AH_RWS, " class='"
		        + ( varinfo[name].current_choice == optsplit[0]
			  ? "pic_selected" : "pic_legend" )
			+ " rowdata'><span class=pic_meaning> - "+optsplit[1]
			+ "</span></nobr>" );
		    }
		rwsep = "\n&nbsp;&nbsp;&nbsp;";
		}
	    }
	if( type == "signature" )
	    {
	    var sdate = values[ varinfo[name].sigdate ];
	    add_html(AH_ROS, rosep );
	    add_html(AH_RWS, rwsep );
	    add_html(AH_ALL,(sdate ? ("XL(Signed [["+sdate+"]])") : "XL(Unsigned)"));
	    }
	add_html(AH_ALL,"</center>");
	}
    else
        {
	if( type=="oneof" || type=="anyof" )
	    {
	    var opt_map = {};
	    for( var optind=0; optind<varinfo[name].choices.length; optind++ )
		{
		var split_opts = choice_array(name,optind);
		opt_map[split_opts[0]] = split_opts[1];
		}
	    var sep = "";
	    var opts_set_list = (prev+"").split(",");
	    var ah_dest = ( funky_locked_ro ? AH_ALL : AH_ROS );
	    for( var opt=0; opt<opts_set_list.length; opt++ )
		{
		var c = opts_set_list[opt];
		add_html(ah_dest, sep );
		// add_html(ah_dest, (typeof(opt_map[c])!="undefined") ? sanitize(opt_map[c]) : c );
		add_html(ah_dest, (typeof(opt_map[c])!="undefined") ? opt_map[c] : c );
		sep = ", ";
		}
	    }
	else if( type != "file" )
	    {
	    add_html(AH_ROS, sanitize( prev ) );
	    }
	if( funky_locked_ro )
	    {}
	else if( type == "file" )
	    {
	    var ft = varinfo[name].filetype;
	    if( ! ft ) { ft = "file" };

	    if( prev && ( varinfo[name].rows || varinfo[name].cols ) )
	        {
		var src = varinfo[name].local_file;
		if( typeof(src) == "undefined" )
		    {
		    src = ACTION+"?SID=%%SID%%&USER=%%USER%%&user=%%USER%%&key=%%KEY%%&form_type=%%FORM_TYPE%%&func=download&show_field="+name;
		    }
		add_html( AH_ALL, "<img"
		    + sprint0f( " height=%spx", varinfo[name].rows )
		    + sprint0f( " width=%spx", varinfo[name].cols )
		    + " src=\"" + src + "\" id=display_"+name +"><br>" );
		}
	    if( ft=="file" || ! is_phonegap )
		{
		var accept = "";
		if( ft == "photo" )
		    { accept=' accept="image/*" capture="camera"'; }
		else if( ft == "video" )
		    { accept=' accept="video/*" capture="camera"'; }
		else if( ft == "audio" )
		    { accept=' accept="audio/*" capture="microphone"'; }
		add_html( AH_RWS,
		    "<input class=rowdata type=file size=1"+accept+tagcommon );
		}
	    else
	        {
		var msg = ( varinfo[name].filetype == "photo" ? "XL(Take photo)"
		        : ( varinfo[name].filetype == "video" ? "XL(Take video)"
		        : ( varinfo[name].filetype == "audio" ? "XL(Take audio)"
			: "XL(Take something)" ) ) );
//		add_html( AH_RWS,
//		    "<input type=button value='" + msg
//			 + "' onClick='this.style.backgroundColor=\""+LIT_BUTTON+"\";get"+varinfo[name].filetype
//			+ "(this,\"" + name + "\");'" + tagcommon );
		if( varinfo[name].buttonpicture )
		    {
		    add_html( AH_RWS,
			"<img alt='" + msg
			    + "' src='" + varinfo[name].buttonpicture
			    + "' onClick='"
			    + "this.style.border=\"solid 2px "+LIT_BUTTON+"\";"
			    + "this.style.opacity=0.5;"
			    + "this.style.filter=\"alpha(opacity=50)\";"
			    + "this.style.backgroundColor=\"" +LIT_BUTTON+ "\";"
			    + "get"+varinfo[name].filetype
			    + "(this,\"" + name + "\");'" + tagcommon );
		    }
		else
		    {
		    add_html( AH_RWS,
			"<input type=button value='" + msg
			    + "' onClick='this.style.backgroundColor=\""
			    + LIT_BUTTON+"\";get"+varinfo[name].filetype
			    + "(this,\"" + name + "\");'" + tagcommon );
		    }
		}
	    if( prev )
	        {
		add_html( AH_RWS,
		    "<input class='rowdata noprint filectl'"
		    + " type=button value=\"XL(Delete)\""
		    + " onClick='delete_file(\""+name+"\");'>" );
		add_html( AH_ALL,
		    "<span class='rowdata filectl'>"
		    + "<input class=rowdata type=button value=\"XL(Download)\" class=rowdata"
		    + " onClick='go_get_file(\""+name+"\");'></span>" );
		}
	    }
	else if( type == "datetime" && ! VIRTUAL_KEYBOARD )
	    {
	    add_html(AH_RWS,
		"<input class=rowdata " +
	        ( USE_DATETIME
		? "type=datetime"
		: "type=text size="+sz
		) +" value=\""+prev+"\"" + tagcommon);
	    }
	else if( type == "text" || type == "datetime" )
	    {
	    if( args.rows==1 )
		{
		var tname = "text";
		var placeholder = "";
		if( prev==""
		    && type!="oneof" && type!="anyof"
		    && varinfo[name].adddel )
		    {
		    placeholder = " placeholder='" + "XL(Add) "
		        + ( varinfo[name].adddelname
			  ? varinfo[name].adddelname
			  : "" )
			+ "'";
		    }

		if( varinfo[name].legalcharacters && VIRTUAL_KEYBOARD )
		    {
		    var lchars = varinfo[name].legalcharacters;
//		    if( is_subset( lchars, "0123456789*#" ) )
//		        { tname = "tel"; }
//		    else if( is_subset( lchars, "-0123456789." ) )
//		        {
//			tname = "number";
//			if( varinfo[name].step )
//			    { tname += (" step=\""+varinfo[name].step+"\""); }
//			}
		    }
		add_html( AH_RWS,
		    "<input type="+tname+" size="+args.cols
		    + placeholder
		    +" class=rowdata"
		    +" value=\""+prev+"\"" +tagcommon );
		}
	    else
	        {
		add_html(AH_RWS, "<textarea rows="+args.rows+" cols="+args.cols
			+ " class=rowdata"
			+ placeholder
			+ tagcommon + prev + "</textarea>" );
		}
	    if( varinfo[name].legalcharacters && VIRTUAL_KEYBOARD )
		{
		var lchars = varinfo[name].legalcharacters;
		var keylist = (lchars+"").split("");
		var xkeylist = (lchars+"").split("");

		var nspec = 0;
		keylist.push("BS");	xkeylist.push("&lt;");
		if( varinfo[name].choices )
		    {
		    for( var i in varinfo[name].choices )
		        {
			keylist.push( varinfo[name].choices[i][0] );
			xkeylist.push( varinfo[name].choices[i][1] );
			nspec++;
			}
		    }
		keylist.push("Clear");	xkeylist.push("Clear");		nspec++;
		keylist.push("Cancel");	xkeylist.push("Cancel");	nspec++;
		keylist.push("Done");	xkeylist.push("Done");		nspec++;
		keylist.push("Next");	xkeylist.push("Next");		nspec++;
		var wid;
		if( /QWERTY/i.test(lchars) )
		    { wid = 10; }
		else
		    {
		    if( (/^123/m.test(lchars)) || (/^789/m.test(lchars)) )
		        { wid = 3; }
		    else
		        { wid = Math.floor( Math.sqrt( lchars.length ) ); }
		    // alert("lchars=["+lchars+"] wid="+wid);
		    }
		// if( wid < nspec ) { wid = nspec; }
		var s = "<table cellpadding=0 cellspacing=0"
			+ " style='position:"
			// + ( is_IOS ? "absolute" : "fixed" )
			+ ( is_IOS ? "fixed" : "fixed" )
			+ ";top:0;left:0;"
			+ "width:100%;height:100%;z-index:101;'"
			+ "id="+name+"_kbdtbl>"
			+ "<tr><th style='background-color:rgba(0,0,0,0.5);'"
			+ " align=center width=100%><center>"
			+ "<table frame=box>";
		s += "<tr><td colspan="+wid+" bgcolor='#e0e0e0'>";
		if( args.headertext )
		    { s += args.headertext + args.end_question + "<br>"; }
		if( varinfo[name].rows == 1 )
		    { s += "<input type=text size="; }
		else
		    { s += "<textarea rows="+varinfo[name].rows+" cols="; }
		s += varinfo[name].cols+" id="+name+"_display onfocus='this.blur();' class=rowdata>";
		if( varinfo[name].row != 1 ) { s += "</textarea>"; }
		s += "</td></tr>";
		var ind = 0;
		var width_arg = Math.floor(100/wid);
		var butstyle = "";
		var use_width = table_dims.width;
		// use_width = 600;
		if( use_width )
		    {
		    var butsiz=Math.floor(use_width/(wid+2));
		    if( butsiz > 80 ) { butsiz = 80; }	// HACK for Linear Air
		    if( butsiz > 30 )
			butstyle=" padding:0px;border-radius:0px;text-align:center;width:"+butsiz+"px;height:"+butsiz+"px;";
		    }

		while( keylist.length > 0 )
		    {
		    var k = keylist.shift();
		    var xk = xkeylist.shift();
		    if( keylist.length == nspec-1 &&
			(Math.floor(ind/wid) != Math.floor((ind+nspec-1)/wid)) )
			{
			ind = 0;
			s += "</tr>\n";
			}
		    if( ind == 0 ) { s+="\n<tr>"; }
		    s += "<th width=" + width_arg + "%>"
			+ "<input type=button value='"+xk+"'";
		    if( butstyle )
		        {
			var fsiz = 22 - 2*xk.length;
			if( fsiz < 6 ) { fsiz = 5; }
			s += " style='"+butstyle+"font-size:"+fsiz+"'";
			}
		    s += " onClick='textchar(this,\""+k+"\",\""+name+"\");'></th>\n";
		    if( ++ind >= wid )
			{
			s+="</tr>";
			ind = 0;
			}
		    }
		if( ind%wid )
		    { s += "<th colspan="+wid+">&nbsp;</th></tr>"; }
		s += "</table></center></th></tr></table>";
		// add_html( AH_RWS, s );
		varinfo[name].keyboard = s;
		}
	    }
	else if( type == "GPS" )
	    {
	    add_html(AH_RWS, prev + " <input type=button value='XL(Calculate)'"
	        + " onClick='getGPS(this,\"" + name + "\");'" + tagcommon );
	    }
	else if( type=="address" )
	    {
	    add_html(AH_RWS, "<textarea rows="+args.rows+" cols="+args.cols
		    + " class=rowdata"
		    + tagcommon + prev + "</textarea>" );
	    }
	else if( type=="citystatezip" )
	    {
	    add_html(AH_RWS,"<input class=rowdata type=text size=30 class=rowdata"
	        +" value=\""+prev+"\"" + tagcommon);
	    }
	else if( type == "oneof" || type == "anyof" )
	    {
	    var width = 100 / varinfo[name].choices.length;
	    if( !(typeof(prev)!="undefined") || prev=="" )
		{ prev = "Unanswered"; }
	    var multi_tiered = is_multi_tiered(name);
	    if( multi_tiered )
	        {
		force_end_grid();
		if( varinfo[name].presentation == "select" )
		    {
		    add_html(AH_RWS,
			"<select"+sprint0f(" size=",args.rows)+" class=rowdata"
			+ ( type=="anyof" ? " multiple" : "" ) + tagcommon );
		    }
		add_html(AH_RWS,
		    make_a_multi_tier( prev,
			varinfo[name].choices,
			varinfo[name].presentation,
			( varinfo[name].adddel ? true : false ),
			tagcommon ) );
		}
	    else
		{
		if( varinfo[name].presentation == "select" )
		    {
		    add_html(AH_RWS, "<select"+sprint0f(" size=%s",args.rows)
			+ " class=rowdata"
			+ ( type=="anyof" ? " multiple" : "" ) + tagcommon );
		    }
		else if( varinfo[name].line_per )
		    {
		    add_html(AH_RWS,"<table width=100% class=rowdata>");
		    }
		else
		    {
		    if( section_ind == section_displaying )
			{
			add_html(AH_GRID,
			    "<table width=100% class=grid><tr class=grid>"); }
		    }

		var opts_set_list = (prev+"").split(",");
		var opt_set = {};
		for( var i in opts_set_list )
		    { opt_set[ opts_set_list[i] ] = 1; }
		var sep = "";
		for(var optind=0;optind<varinfo[name].choices.length;optind++)
		    {
		    var split_opts = choice_array(name,optind);
		    var optval = split_opts[0];
		    var opttxt = split_opts[1];
		    var common;
		    if( varinfo[name].adddel &&
		        (optval=="" || optval=="Unanswered") )
			{
			opttxt =
			    ( ( prev=="" || prev=="Unanswered" )
			    ? "XL(Add)" : "XL(Remove)" );
			opttxt = opttxt + " " + 
			    ( varinfo[name].adddelname
			    ? varinfo[name].adddelname
			    : "XL(entry)" );
			}
		    var classflag =
			( opt_set[optval]
			? " class='"+optval+"_checked data_checked rowdata data'"
			: " class='"+optval+"_unchecked data_unchecked rowdata data'"
			);
		    if( varinfo[name].presentation == "select" )
			{
			add_html(AH_RWS, "<option value=\""+optval+"\""
			    + ( opt_set[optval] ? " selected" : "" )
			    + classflag
			    + ">"+opttxt );
			}
		    else if( section_ind == section_displaying )
			{
			var gridtxt ="<nobr><label><input type=";
			var nongridtxt = gridtxt;
			if( varinfo[name].presentation == "buttons" )
			    {
			    var fixcommon = tagcommon.replace(
			        /var_changed\(this,/g,
				"var_changed(\""+optval+"\",");
			    gridtxt = "<nobr><label><button"
			    	+ classflag
				+ fixcommon
				+"&nbsp;</label></nobr>";
			    nongridtxt = "<nobr><label><button"
			        + classflag
				+ fixcommon
				+ opttxt + "</button></label></nobr>";
			    }
			else if( varinfo[name].presentation == "buttons" )
			    {
			    gridtxt += "button value=\" \""
			    	+ classflag
				+ tagcommon +"</label></nobr>";
			    nongridtxt += "button value=\"" + opttxt +"\""
			        + classflag
				+ tagcommon +"</label></nobr>";
			    }
			else if( varinfo[name].presentation == "checks" )
			    {
			    gridtxt += (type=="oneof" ? "radio" : "checkbox")
				+ ( opt_set[optval] ? " checked" : "" )
				+ classflag
				+ " value=\"" + optval + "\""
				+ tagcommon;
			    nongridtxt = gridtxt;
			    }
			var check_label_class =
			    optval+"_label " + cell_dataclass;
			if( varinfo[name].line_per )
			    {
			    add_html(AH_RWS, "<tr><td width=1 valign=top "
			        + "class=\"" + cell_dataclass + "\">"
			        + gridtxt
				+ "</td><td class=\"" + check_label_class + "\">"
				+ opttxt + "</td></tr>" );
			    }
			else
			    {
			    add_html(AH_GRID,"<td style='text-align:center'"
			        + " class=\""+check_label_class+"\""
				+ " width="+width+"%>" + gridtxt
				+ "</label></nobr></td>" );
			    add_html(AH_NONGRID, sep + nongridtxt
				+ ( varinfo[name].presentation=="checks"
					? opttxt : "" )
				+ "</label></nobr>");
			    sep = " ";
			    }
			}
		    }
		}
	    if( varinfo[name].presentation == "select" )
		{ add_html(AH_RWS, "</select>" ); }
	    else if( ! multi_tiered )
	        {
		if( varinfo[name].line_per )
		    { add_html(AH_RWS,"</table>"); }
		else
		    {
		    add_html(AH_GRID,"</tr></table>");
		    if( (typeof(header_line)!="undefined") )
		        {last_header_line = header_line;}
		    }
		}
	    }
	}
    if( typeof(args.suffix) != "undefined" ) { add_html(AH_ALL,args.suffix); }
    add_html(AH_ALL,"</td>");
    add_columns( cols + varinfo[name].labelcols );
    return prev;
    }

//////////////////////////////////////////////////////////////////////////
//	Enable/disable/light/darken buttons as appropriate.		//
//////////////////////////////////////////////////////////////////////////
function update_buttons()
    {
    if( ! genform || "ACTION" != "" )
	{
	p.delete_button.style.display = (!ANON_MODE && CAN_EDIT ? "" : "none");

	p.save_button.style.display
	    = ( (ANON_MODE && !is_phonegap && something_changed)
		? "" : "none" );

	p.update_button.style.display
	    = ( (!ANON_MODE && something_changed) ? "" : "none" );

	p.edit_button.style.display
	    = ( (CAN_EDIT && current_mode == "ro_mode") ? "" : "none" );

	p.summary_button.style.display
	    = ( (current_mode == "rw_mode") ? "": "none" );

	// p.submit_button.style.display = ( CAN_SUBMIT && (needs_input.length==0) ? "" : "none" );
	p.submit_button.style.display = ( CAN_SUBMIT ? "" : "none" );

	p.cancel_button.style.display = ( ANON_MODE ? "none" : "" );
	p.export_widget.style.display = ( ANON_MODE ? "none" : "" );
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Output information to a debug window.				//
//////////////////////////////////////////////////////////////////////////
var deb_win;
function debug_window( dw_html )
    {
    if( deb_win ) deb_win.close();
    deb_win = window.open("","debug_window","width=800,height=700,scrollbars=1,resizeable=1");
    deb_win.document.write("*************************<br>");
    deb_win.document.write( sanitize( dw_html ) );
    }

//////////////////////////////////////////////////////////////////////////
//	(Re)Construct the table comprising the form.			//
//////////////////////////////////////////////////////////////////////////
function redraw_wrapper()
    {
    number_sections = 1;		// So far, only the base section
    section_ind = 0;			// Whos number is 0.
    page_ind = 0;			// First page of section 0
    section_stack_ind = new Array();	// Stack of indices
    section_stack_title = new Array();	// Section titles
    section_stack_class = new Array();	// And whether or not they had errors
    section_stack_page = new Array();	// And page numbers
    needs_input = new Array();		// Nothing known to need input
    num_in_grid = 0;			// Not in any grid of oneof/anyofs

    imagecontexts = {};			// Recalculate which images go with
    					// which canvases and drawings

    top_of_table	= true;
    html_grid		= "";		// These are arguably redundant
    html_nongrid	= "";
    html_ro		= "";
    html_value		= "";
    need_redraw		= false;

    focus_id		= 0;

    current_column	= 0;

    varcontexts		= new Array();
    tripvar		= new Array();
    space_over		= 0;

    seen_input		= {};

    next_page_exists	= 0;

    leave_unfocused	= false;

    table_dims	= get_browser_dims();

    redraw();
    force_end_grid();
    // add_html(AH_ALL, "</table>" );	// CMC Redundant?
    update_buttons();

    var hdr = "";
    if(current_mode != "action_mode")
	{
	var hwidth = 0;
	for ( var o in seen_input )
	    { hwidth++; }
	hwidth = 100 / hwidth;
	hdr = "<tr class=legend><th colspan="+table_columns+">"
	    +   "<table class=legend width=100%><tr class=legend>";
	if( seen_input.input_unanswered )
	    {
	    hdr+="<th class='input_unanswered legend' width="
		+hwidth+"%>XL(Not filled in)</th>";
	    }
	if( seen_input.input_ok )
	    {
	    hdr+="<th class='input_ok legend' width="
		+hwidth+"%>XL(Normal input)</th>";
	    }
	if( seen_input.input_abnormal )
	    {
	    hdr+="<th class='input_abnormal legend' width="
		+hwidth+">XL(Abnormal input)</th>";
	    }
	if( seen_input.input_required )
	    {
	    hdr+="<th class='input_required legend' width="
		+hwidth+"%>XL(Required input)</th>";
	    }
	hdr+= "</tr></table></th></tr>";
	}
    html_value = hdr + html_value;

    new_html =
	start_html
        + "<table border=0 cellspacing=0 cellpadding=0 class=form_table id=tableid width="
	+ ( table_dims.width ? (table_dims.width+"px") : "100%" )
	+ sprint0f(" height=%spx", table_dims.height )
	+ ">"
	+ hdr
	+ ( read_only ? html_ro : html_grid )
	+ "</table>";
    if( !p.tableresult.innerHTML || p.tableresult.innerHTML != new_html )
	{
	p.tableresult.innerHTML = "";	// Some browsers (iPad) get confused
	p.tableresult.innerHTML = new_html;
	// window.onorientationchange = snap_html;
	// debug_window( new_html );
	}

    // update_all_canvases();
    setTimeout(update_all_canvases,10);	// Internet Explorer EXCanvas needs
    					// <canvas> to be completely setup

    if( focus_id && ! leave_unfocused )
	{
	var focusptr = window.document.getElementById(focus_id);
	if( focusptr ) { focusptr.focus(); }
	}
    set_focus_to_next = 0;
    if( is_phonegap ) { phonegap_redraw(); }
//    alert("section_displaying="+section_displaying+"\n"+
//          "page_displaying="+page_displaying);
    }

//////////////////////////////////////////////////////////////////////////
//	Go back and forth between read-only and write mode		//
//////////////////////////////////////////////////////////////////////////
function set_mode( new_mode )
    {
    current_mode = new_mode;
    read_only = ( current_mode == "ro_mode" );

    redraw_wrapper();
    }

//////////////////////////////////////////////////////////////////////////
//	Reset the form.							//
//////////////////////////////////////////////////////////////////////////
function setup_vars()
    {
    varinfo = {};
    values = {};
    section_displaying = 0;
    page_displaying = 0;
    }

//////////////////////////////////////////////////////////////////////////
//	Construct a cache of name-to-object pointers.			//
//////////////////////////////////////////////////////////////////////////
function setup_caches()
    {
    var IDS_TO_MAP =
	[
	"tableresult",
	"export_widget",
	"cancel_button",
	"submit_button",
	"save_button",
	"update_button",
	"delete_button",
	"edit_button",
	"summary_button",
	"action_mode",
	"background_query",
	"loading_id",
	"outside_table",
	"done_loading_id",
	"file_elements_id",
	"status",
	"popups"
	];

    for ( var i in IDS_TO_MAP )
	{
        p[IDS_TO_MAP[i]]=window.document.getElementById(IDS_TO_MAP[i]);
	if( ! p[IDS_TO_MAP[i]] )
	    {
	    alert("Cannot find id ["+IDS_TO_MAP[i]+"]");
	    }
	}

    var table_dims = get_browser_dims();
    if( table_dims.width ) { p.outside_table.width = table_dims.width; }
    set_mode( current_mode );
    p.loading_id.style.display = "none";
    p.done_loading_id.style.display = "";
    }

//////////////////////////////////////////////////////////////////////////
//	Called when user causes any sort of submit event.		//
//////////////////////////////////////////////////////////////////////////
function send_to_server( flag )
    {
    if( flag == "" ) return false;

    if( flag == "submit" && needs_input.length )
        {
	//alert("XL(Some required fields have not been filled out.)");
	alert("XL(The following fields need to be filled out:)\n\t" +
	    needs_input.join("\n\t") );
	return false;
	}
      
    if( flag == "submit"		||
        flag == "update"		||
	flag == "delete"		)
        { trigger_change(false); }
    with( window.document[FORM_NAME] )
        {
	func.value = flag;
	is_not_cr_submit = true;
	if( flag == "update" && ANON_MODE )
	    {
	    save_address.value =
	      usprompt("XL(Enter e-mail address to send instructions to:)","");
	    while( ! /^[^@\s]+@[^@\s]+$/.test( save_address.value ) )
	        {
		save_address.value =
		    usprompt("XL(E-mail address in bad format.)\n" +
		        "XL(Re-enter e-mail address to send instructions to:)",
			"" );
		}
	    }
	var interim = new Array();
	for( var field_name in values )
	    {
	    interim.push( field_name );
	    interim.push( values[field_name] );
	    if( varinfo[field_name] && varinfo[field_name].persistent )
	        { localStorage.setItem( field_name, values[field_name] ); }
	    }
	interim.push( "html" );
	interim.push( html_value );
	window.document[FORM_NAME].returndata.value = interim.join(SEP.DATA);
	for( var field_name in file_list )
	    {
	    p.file_elements_id.appendChild( file_list[field_name] );
	    // window.document[FORM_NAME][field_name]=file_list[field_name];
	    }
	form_is_done = 1;
	if( ! is_phonegap )
	    {
	    // This really should work:
	    // window.document[FORM_NAME].submit();
	    // But it doesn't in firefox, so I guess we'll have to
	    // pretend to press a submit button.
	    document.getElementById("tosubmit").click();
	    }
	else
	    {
	    queued_submit(FORM_NAME,new Date().getTime()+".form" );
	    if( clear_on_submit ) { setup_vars(); }
	    clear_on_submit = 1;
	    redraw_wrapper();
	    }
	is_not_cr_submit = false;
	}
    // alert("Ending send_to_server with "+is_not_cr_submit);
    return is_not_cr_submit;
    }

if( is_phonegap )
    { document.addEventListener("deviceready", setup_phonegap, false ); }
