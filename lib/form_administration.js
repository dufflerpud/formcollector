<style type="text/css"><!--
%%CSS%%
--></style>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0//EN">
<script>
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
var is_not_cr_submit = false;
var SEP =
    {
	%%SEPS%%
    };
var dumpers_list = "%%dumpers_list%%".split(SEP.REC);
var transmitters_list = "%%transmitters_list%%".split(SEP.REC);
var invite_transmitters_list = "e-mail".split(SEP.REC);
var invite_privs_list = "%%INVITE_PRIVS%%".split(SEP.REC);
var variables = [ %%FIELD_LIST%% ];
var int_reports = [ %%REPORTS%% ];
var currep = -1;
var sortby = "Field";
var AXES = "%%AXES%%".split(",");

transmitters_list.push( "transmitter" );

var translations = {
"transmitter":"XL(transmitter)",
%%TRANSLATIONS%%
};
var p = new Array();

function searchArray( array_of_strings, str )
    {
    var i;
    for( i=array_of_strings.length-1; i>=0; i-- )
        if( array_of_strings[i] == str )
	    { break; }
    return i;
    }

var unlc_ret;
function unload_check()
    {
    if( !something_changed )
        { unlc_ret = null; }
    else
        {
	unlc_ret =
	    "XL(You have modified some form attributes but not saved your changes.)";
	// if( event ) { event.returnValue = unlc_ret; }
	}
    return unlc_ret;
    }

var something_changed = false;
function trigger_change(flag)
    {
    something_changed = flag;
    if( flag )
        {
	window.onbeforeunload=unload_check;
	p.subbutton_light.style.display="";
	}
    else
        { window.onbeforeunload=null; }
    }

var REPORT_VARS=["_click_to","_report_type"];
var REPORT_FIELDS=["Row","Constraint","Order","Direction","Column","Axis"];
function send_to_server( flag )
    {
    if( ! flag ) return false;
    with( window.document.%%FORM_NAME%% )
        {
	func.value = flag;
	is_not_cr_submit = true;
	trigger_change(0);
	var allrepstrings = new Array();
	for( var repnum=0; repnum<int_reports.length; repnum++ )
	    {
	    if( ! int_reports[repnum]._report_deleted )
	        {
		var repstring = [ int_reports[repnum]._report_name ];
		for( var vi in REPORT_VARS )
		    {
		    if( typeof(int_reports[repnum][REPORT_VARS[vi]])
			!= "undefined" )
			{
			repstring.push( REPORT_VARS[vi] );
			repstring.push( int_reports[repnum][REPORT_VARS[vi]] );
			}
		    }
		repstring = [ repstring.join(SEP.DATA) ];
		for( var vi in variables )
		    {
		    var v = variables[vi];
		    if( ! int_reports[repnum][v] )
			{ make_new_variable( repnum, v ); }
		    repstring.push( "variable" + SEP.DATA + v );
		    for( var f in REPORT_FIELDS )
		        {
			repstring.push( REPORT_FIELDS[f]+SEP.DATA
			    +int_reports[repnum][v][REPORT_FIELDS[f]]);
			}
		    }
		allrepstrings.push( repstring.join(SEP.FIELD) );
		}
	    }
	window.document.%%FORM_NAME%%.reports.value
	    = allrepstrings.join(SEP.REC);
	submit();
	is_not_cr_submit = false;
	}
    return is_not_cr_submit;
    }

var lights =
    [
    "select_page_light",
    "submission_light",
    "transmitter_light",
    "lookandfeel_light",
    "content_light",
    "upload_light",
    "invitees_light",
    "user_light",
    "report_light",
    "resetdb_light",
    ];

var other_ids =
    [
    "transmitter_table",
    "submission_table",
    "invitee_table",
    "report_table",
    "subbutton_light"
    ];

function setup_caches()
    {
    p = { };
    for( var pti in lights )
        { p[lights[pti]] = document.getElementById(lights[pti]); }
    for( var pti in other_ids )
        { p[other_ids[pti]] = document.getElementById(other_ids[pti]); }
    light_up( "select_page_light" );
    }

function light_up( part )
    {
    for( var pti in lights )
        { p[lights[pti]].style.display = ((lights[pti]==part)?"":"none"); }
    redraw();
    }

function mustbeurl(ob)
    {
    while( ob.value != ""
	&& ! /^[a-z]+:\/\//.test(ob.value)
	&& ! /^\//.test(ob.value)
	&& ! /^\w.*\.\w+$/.test(ob.value)
	)
        {
	ob.value = usprompt("XL(Incorrect format for a URL.  Re-enter URL:)",
	    ob.value );
	}
    }

function do_option( actual_val, val, txt )
    {
    return "<option value='"+val+"'"
        + ( val == actual_val ? " selected" : "" )
	+ ">" + txt;
    }

var utransmitters;
function change_transmitters(obj,transmitter_number,address_number,index)
    {
    // alert("Change_transmitters("+transmitter_number+","+address_number+","+index+")");
    var tosplit;
    with( window.document )
        {
	utransmitters=%%FORM_NAME%%.transmitters_vals.value.split(SEP.REC);
	if( transmitter_number < 0 )
	    {
	    transmitter_number =
		( (utransmitters[0]=="" ) ? 0 : utransmitters.length);
	    utransmitters[transmitter_number]="";
	    }
	tosplit = utransmitters[transmitter_number];
	if( typeof(tosplit) == "undefined" ) { tosplit=""; }
	var utransmitter_field = tosplit.split(SEP.FIELD);

	if( address_number==0 && obj.value=="" )
	    {
	    for( var i=transmitter_number+1; i<utransmitters.length; i++ )
	        {
		utransmitters[i-1] = utransmitters[i];
		}
	    utransmitters.length--;
	    }
	else
	    {
	    // Transmitter name now in utransmitter_field[0], addresses in rest
	    if( typeof(utransmitter_field[address_number]) == "undefined" )
		{ utransmitter_field[address_number] = ""; }
	    var address_field = utransmitter_field[address_number].split(SEP.DATA);
	    // Specific address we're going to play with in address_field

	    if( address_number==0 || index > 0 )
		{
		address_field[index] = obj.value;
		// alert("1: Setting address_field["+index+"] to ["+obj.value+"]");
		}
	    else
		{
		var v = obj.options[obj.selectedIndex].value;
		// alert("2: obj.options["+obj.selectedIndex+"] to ["+v+"]");
		if( v != "" )
		    { address_field[index] = v; }
		else	// Delete a transmitter
		    {
		    for( var i=address_number+1; i<utransmitter_field.length; i++ )
			{ utransmitter_field[i-1] = utransmitter_field[i]; }
		    utransmitter_field.length--;
		    utransmitters[transmitter_number]
			= utransmitter_field.join(SEP.FIELD);
		    %%FORM_NAME%%.transmitters_vals.value
			= utransmitters.join(SEP.REC);
		    trigger_change(1);
		    redraw();
		    return true;
		    }
		}
		
	    var stype = address_field[0];
	    var addr = address_field[1];
	    if( typeof(addr) == "undefined" ) { addr = ""; }

	    if( address_number > 0 )
		{
		if( stype == "e-mail" )
		    {
		    while( ! /^[^\s@]+@[^\s@]+$/.test(addr) )
			{
			addr = usprompt(
			    ( addr == ""
				? "XL(Enter e-mail address:)"
				: "XL(E-mail address not in correct format.  Re-enter address:)" ),
				addr );
			}
		    }
		else if( stype == "fax" )
		    {
		    while( ! /^[\d\-]*\d\d\d-\d\d\d-\d\d\d\d.*$/.test(addr) )
			{
			addr = usprompt(
			    ( addr == ""
				? "XL(Enter fax number:)"
				: "XL(Fax number not in correct format (nnn-nnn-nnnn).  Re-enter fax number:)" ),
				addr );
			}
		    }
		else if( stype == "SQL_server" )
		    {
		    while(
		        ! /^(\w*)sql:\/\/(.*?):(.*?)@(.*?)\/(.*)$/.test(addr) &&
			! /^(\w+):(\w+):(\w+):(.*)$/.test(addr) )
		        {
			addr = usprompt(
			    ( addr == ""
			        ? "XL(mysql://user:password@host/database):"
				: "XL(Incorrect format.  Re-enter mysql://user:password@host/database:)" ),
				addr );
			}
		    }
		else if( stype != "transmitter" )
		    {
		    while( ! /./.test(addr) )
			{
			addr = usprompt(
			    ( addr == ""
				? "XL(Enter destination:)"
				: "XL(Destination not in correct format.  Re-enter destination:)" ),
				addr );
			}
		    }

		address_field[1] = addr;

		var subject = address_field[2];
		if( typeof(subject)=="undefined" || subject=="" )
		    { address_field[2]="XL(%%FORM_TYPE%% submission)"; }
		}

	    utransmitter_field[address_number]
		= address_field.join(SEP.DATA);
	    utransmitters[transmitter_number]
		= utransmitter_field.join(SEP.FIELD);
	    }
	%%FORM_NAME%%.transmitters_vals.value = utransmitters.join(SEP.REC);
	// alert("utransmitter_field["+address_number+"]=["+utransmitter_field[address_number]+"]\n"
	    // + "utransmitters["+transmitter_number+"]=["+utransmitters[transmitter_number]+"]\n"
	    // + "transmitter_vals=["+%%FORM_NAME%%.transmitters_vals.value+"]");
	redraw();
	}
    trigger_change(1);
    }

function transmitter_to_ind( tname )
    {
    var found = -1;
    for( pi in transmitters_list )
        {
	var utransmitters_split = utransmitters[pi].split(SEP.FIELD);
	if( utransmitters_split[0] == tname )
	    {
	    found = pi;
	    break;
	    }
	}
    alert("transmitter_to_ind("+tname+") returns "+pi+".");
    return pi;
    }

function redraw_transmitter_table()
    {
    var s = '<center><table class=outside_table border=1>'
	+ "<tr><th colspan=3>XL(Specify transmitters)</th></tr>"
	+ "<tr><th>XL(Transmitter name)</th>"
	+     "<th>XL(Address type)</th>"
	+     "<th>XL(Address)</th></tr>";
    var tosplit;
    with( window.document )
	{
	var i;
	utransmitters =
	    %%FORM_NAME%%.transmitters_vals.value.split(SEP.REC);
	if( %%FORM_NAME%%.transmitters_vals.value == "" )
	    { utransmitters.length = 0; }
	
	// Fix old format ...
	for( i in utransmitters )
	    {
	    tosplit = utransmitters[i];
	    if( typeof(tosplit) == "undefined" ) { tosplit=""; }
	    var utransmitters_split = tosplit.split(SEP.FIELD);
	    if( searchArray( transmitters_list, utransmitters_split[0] ) >= 0 )
	        {
		var addrs = new Array(
		    utransmitters_split[0],
		    utransmitters_split[1] );
		utransmitters_split[0] = "Transmitter_"+utransmitters_split[0];
		utransmitters_split[1] = addrs.join(SEP.DATA);
		utransmitters_split.length = 2;
		utransmitters[i] = utransmitters_split.join(SEP.FIELD);
		}
	    }
	%%FORM_NAME%%.transmitters_vals.value = utransmitters.join(SEP.REC);
	// End fix old format

	for ( i=0; i<=utransmitters.length; i++ )
	    {
	    tosplit = utransmitters[i];
	    if( typeof(tosplit) == "undefined" ) { tosplit=""; }
	    var utransmitters_split = tosplit.split(SEP.FIELD);
	    var transmitter_name = utransmitters_split[0];
	    var nrows = utransmitters_split.length;
	    s += "<tr><th valign=top rowspan="+nrows+"><input type=text"
		+ " value='"+transmitter_name+"'"
		+ " onChange='change_transmitters(this,"+i+",0,0);'></th>";
	    if( transmitter_name == "" )
		{ s += "<td>(XL(Add transmitter))</td><td></td></tr>\n"; }
	    else
		{
		var desti;
		for( desti=1; desti<=nrows; desti++ )
		    {
		    if( desti!=1 ) { s += "<tr>"; }
		    var atype = "";
		    var addr = "";
		    if( desti < nrows )
			{
			var type_addr = utransmitters_split[desti].split( SEP.DATA );
			atype = type_addr[0];
			addr = type_addr[1];
			}
		    s += "<th><select onChange='change_transmitters(this,"+i+","+desti+",0);'>";
		    for( var pi in transmitters_list )
			{
			s += "<option value=\""+transmitters_list[pi]+"\"" +
			    ((transmitters_list[pi]==atype)
			     ?" selected>":">")
			    +translations[ transmitters_list[pi] ];
			}
		    if( atype == "" )
			{
			s += "<option value=\"\" selected>XL(Add type)"
			    + "</select></th><td>"
			}
		    else
			{
			s += "<option value=\"\">XL(Delete)"
			    + "</select></th><td>";
			if( atype != "transmitter" )
			    {
			    s += "<input type=text onChange='change_transmitters(this,"
				+ i+","+desti+",1);'"
				+ " value='"+addr+"'>";
			    }
			else
			    {
			    s += "<select onChange='change_transmitters(this,"
			        + i +","+desti+",1);'>";
			    var j;
			    s += "<option value=''>XL(Select transmitter)";
			    for( j=0; j<utransmitters.length; j++ )
				{
				var jtosplit=utransmitters[j].split(SEP.FIELD);
				// alert("Deciding ["+jtosplit[0]+"]");
				var seen_transmitter = { addr : 1 };
				var todo = new Array( jtosplit[0] );
				var found = 0;
				while( !found && todo.length > 0 )
				    {
				    var working_on = todo.shift();
				    // alert("working_on=["+working_on+"] found="+found+", todo.length="+todo.length+", st="+
				    // ( seen_transmitter[working_on] ? "yes" : "no" ) );
				    if( seen_transmitter[working_on] )
				        { found = 1; }
				    else
				        {
					var k = 1;
					seen_transmitter[working_on] = 1;
					while( k < jtosplit.length )
					    {
					    var ksplit =
					        jtosplit[k].split(SEP.DATA);
					    if( ksplit[0] == "transmitter" && ksplit[1] )
					        {
						todo.push( ksplit[1] );
						// alert("Pushing ["+ksplit[1]+"]");
						}
					    k++;
					    }
					}
				    }

				if( ! found )
				    {
				    s += "<option value=\""+jtosplit[0]+"\"";
				    if( addr == jtosplit[0] )
					{ s += " selected"; }
				    s += ">" + jtosplit[0];
				    }
				}
			    s += "</select>";
			    }
			}
		    s += "</td></tr>\n";
		    }
		}
	    }
        }
    s += "</table></center>";
    p.transmitter_table.innerHTML = s;
    }

function change_submission( index, newvalue )
    {
    with( window.document )
        {
	var submission_split = %%FORM_NAME%%.submission.value.split(SEP.REC);
	submission_split[index] = newvalue;
	%%FORM_NAME%%.submission.value = submission_split.join(SEP.REC);
	}
    redraw();
    trigger_change(1);
    }

function redraw_submission_table()
    {
    var s = '<center><table class=outside_table border=1>'
	    + "<tr><th colspan=2>XL(On a submission)</th></tr>";
    with( window.document )
	{
	var submission_split = %%FORM_NAME%%.submission.value.split(SEP.REC);
	s += "<tr><th align=left><a href='javascript:alert(\"XL(Sumission URL for anonymous user would be:) %%ANONYMOUS_URL%%\");'>XL(Allow anonymous submission):</a></th>"
	    +"<td><input type=checkbox "
	    + ( submission_split[0] ? " checked" : "" )
	    + " onClick='change_submission(0,(this.checked?this.value:\"\"));'"
	    + " value=lock></td></tr>"
	    +"<tr><th align=left>XL(Lock record on submission):</th>"
	    +"<td><input type=checkbox "
	    + ( submission_split[1] ? " checked" : "" )
	    + " onClick='change_submission(1,(this.checked?this.value:\"\"));'"
	    + " value=lock></td></tr>"
	    + "<tr><th align=left>XL(Return submitter to URL):</th>"
	    + "<td><input type=text value=\""
	    + submission_split[2]
	    + "\" onChange='mustbeurl(this);change_submission(2,this.value);'></td></tr>";

	if( ! %%FORM_NAME%%.transmitters_vals.value )
	    {
	    s += "<tr><th colspan=2>"
	        +"XL(If you want to transmit on submission, you need to define at least one transmitter.)"
		+"</th></tr>";
	    }
	else
	    {
	    var utransmitters=%%FORM_NAME%%.transmitters_vals.value.split(SEP.REC);
	    s +="<tr><th align=left>XL(Transmit record on submission):</th>"
		+"<td><input type=checkbox "
		+ ( submission_split[3] ? " checked" : "" )
		+ " onClick='change_submission(3,(this.checked?this.value:\"\"));'"
		+ " value=lock></td></tr>";
	    if( submission_split[3] )
		{
		s += "<tr><th align=left>&nbsp;XL(as:)</th><td>"
		    + "<select onChange='change_submission(4,"
		    + "this.options[this.selectedIndex].value);'>"
		    + "<option value=\"\">XL(Select record translator)";
		for ( var i in dumpers_list )
		    {
		    s += "<option value=\""
			+dumpers_list[i]+"\""
			+((dumpers_list[i]==submission_split[4]) ? " selected" : "")
			+">" + translations[dumpers_list[i]];
		    }
		s += "</td></tr>";
		s += "<tr><th align=left>&nbsp;XL(to transmitter:)</th><td>"
		    + "<select onChange='change_submission(5,"
		    + "this.options[this.selectedIndex].value"
		    + ");'>"
		    + "<option value=\"\">XL(Select transmitter)";
		for ( var i in utransmitters )
		    {
		    var utransmitters_split = utransmitters[i].split(SEP.FIELD);
		    s += "<option value=\""+utransmitters_split[0]+"\""
			+((utransmitters_split[0]==submission_split[5])
			    ? " selected" : "") + ">";
		    if( translations[utransmitters_split[0]] )
		        {
			utransmitters_split[0]
			    = translations[utransmitters_split[0]]
			}
		    s += utransmitters_split[0];
		    }
		s += "</select></td></tr>"

		s += "<tr><th align=left>&nbsp;XL(as:)</th><td>"
		    + "<select onChange='change_submission(6,"
		    + "this.options[this.selectedIndex].value);'>"
		    + "<option value=\"\">XL(Select record translator)";
		for ( var i in dumpers_list )
		    {
		    s += "<option value=\""
			+dumpers_list[i]+"\""
			+((dumpers_list[i]==submission_split[6]) ? " selected" : "")
			+">" + translations[dumpers_list[i]];
		    }
		s += "</td></tr>";
		s += "<tr><th align=left>&nbsp;XL(to transmitter:)</th><td>"
		    + "<select onChange='change_submission(7,"
		    + "this.options[this.selectedIndex].value"
		    + ");'>"
		    + "<option value=\"\">XL(Select transmitter)";
		for ( var i in utransmitters )
		    {
		    var utransmitters_split = utransmitters[i].split(SEP.FIELD);
		    s += "<option value=\""+utransmitters_split[0]+"\""
			+((utransmitters_split[0]==submission_split[7])
			    ? " selected" : "") + ">";
		    if( translations[utransmitters_split[0]] )
		        {
			utransmitters_split[0]
			    = translations[utransmitters_split[0]]
			}
		    s += utransmitters_split[0];
		    }
		s += "</select></td></tr>"

		s += "<tr><th align=left>&nbsp;XL(as:)</th><td>"
		    + "<select onChange='change_submission(8,"
		    + "this.options[this.selectedIndex].value);'>"
		    + "<option value=\"\">XL(Select record translator)";
		for ( var i in dumpers_list )
		    {
		    s += "<option value=\""
			+dumpers_list[i]+"\""
			+((dumpers_list[i]==submission_split[8]) ? " selected" : "")
			+">" + translations[dumpers_list[i]];
		    }
		s += "</td></tr>";
		s += "<tr><th align=left>&nbsp;XL(to transmitter:)</th><td>"
		    + "<select onChange='change_submission(9,"
		    + "this.options[this.selectedIndex].value"
		    + ");'>"
		    + "<option value=\"\">XL(Select transmitter)";
		for ( var i in utransmitters )
		    {
		    var utransmitters_split = utransmitters[i].split(SEP.FIELD);
		    s += "<option value=\""+utransmitters_split[0]+"\""
			+((utransmitters_split[0]==submission_split[9])
			    ? " selected" : "") + ">";
		    if( translations[utransmitters_split[0]] )
		        {
			utransmitters_split[0]
			    = translations[utransmitters_split[0]]
			}
		    s += utransmitters_split[0];
		    }
		s += "</select></td></tr>"
		}
	    }
	s += "</table>";
	}
    s += "</center>";
    p.submission_table.innerHTML = s;
    }

function change_invitees(obj,invitee_number,index)
    {
    with( window.document )
        {
	var uinvitees = %%FORM_NAME%%.invitees_vals.value.split(SEP.REC);
	if(invitee_number<0)
	    {
	    invitee_number =
		((uinvitees[0]=="") ? 0 : uinvitees.length);
	    uinvitees[invitee_number]="";
	    }
	var uinvitee_field = uinvitees[invitee_number].split(SEP.FIELD);
	if( index == 0 )
	    {
	    var v = obj.options[obj.selectedIndex].value;
	    if( v != "" )
	        { uinvitee_field[index] = v; }
	    else	// Delete a invitee
	        {
		for( var i=invitee_number+1; i<uinvitees.length; i++ )
		    { uinvitees[i-1] = uinvitees[i]; }
		uinvitees.length--;
		%%FORM_NAME%%.invitees_vals.value = uinvitees.join(SEP.REC);
		trigger_change(1);
		redraw();
		return true;
		}
	    }
	else if( index == 1 )
	    { uinvitee_field[index] = obj.value; }
	else if( index == 2 )
	    {
	    if( ! uinvitee_field[index] )
	        {
		if( obj.checked ) { uinvitee_field[index] = obj.value; };
		}
	    else
	        {
		var current_priv_list = uinvitee_field[index].split(",");
		var pi = searchArray( current_priv_list, obj.value );
		if( pi >= 0 )
		    {
		    if( pi < current_priv_list.length-1 )
			{ current_priv_list[pi] = current_priv_list.pop(); }
		    else
			{ current_priv_list.pop(); }
		    }
		if( obj.checked )
		    { current_priv_list.push( obj.value ); }
		uinvitee_field[index] = current_priv_list.join(",");
		}
	    }
	    
	var stype = uinvitee_field[0];
	var addr = uinvitee_field[1];
	if( typeof(addr) == "undefined" ) { addr = ""; }
	if( stype == "e-mail" )
	    {
	    while( ! /^[^\s@]+@[^\s@]+$/.test(addr) )
		{
		addr = usprompt(
		    ( addr == ""
			? "XL(Enter e-mail address:)"
			: "XL(E-mail address not in correct format.  Re-enter address:)" ),
			addr );
		}
	    }
	else if( stype == "fax" )
	    {
	    while( ! /^[0-9]+$/.test(addr) )
		{
		addr = usprompt(
		    ( addr == ""
			? "XL(Enter fax number:)"
			: "XL(Fax number not in correct format.  Re-enter fax number:)" ),
			addr );
		}
	    }
	else
	    {
	    while( ! /./.test(addr) )
		{
		addr = usprompt(
		    ( addr == ""
			? "XL(Enter destination:)"
			: "XL(Destination not in correct format.  Re-enter destination:)" ),
			addr );
		}
	    }
	uinvitee_field[0] = "e-mail";
	uinvitee_field[1] = addr;
	uinvitees[invitee_number] = uinvitee_field.join(SEP.FIELD);
	%%FORM_NAME%%.invitees_vals.value = uinvitees.join(SEP.REC);
	redraw();
	}
    trigger_change(1);
    }

function redraw_invite_table()
    {
    var s = '<center><table class=outside_table border=1>';
    with( window.document )
	{
	var uinvitees = %%FORM_NAME%%.invitees_vals.value.split(SEP.REC);
	s += "<tr><th colspan="
	    + ( invite_privs_list.length+2 )
	    + ">XL(Specify invitees)</th></tr>"
	    + "<tr><th>XL(Transmitter)</th>"
	    +     "<th>XL(Address)</th>";
	for( pi=0; pi<invite_privs_list.length; pi++ )
	    {
	    s += "<th>"+translations[invite_privs_list[pi]]+"</th>";
	    }
	s += "</tr>";
	if( %%FORM_NAME%%.invitees_vals.value != "" )
	    {
	    for ( var i in uinvitees )
		{
		var uinvitees_split = uinvitees[i].split(SEP.FIELD);
		s += "<tr><th><select onChange='change_invitees(this,"+i+",0);'>";
		s += "<option value=\"\">XL(Delete)";
		for( var pi=0; pi<invite_transmitters_list.length; pi++ )
		    {
		    s += "<option value=\""+invite_transmitters_list[pi]+"\"" +
			((invite_transmitters_list[pi]==uinvitees_split[0])
			 ?" selected>":">")
			+translations[ invite_transmitters_list[pi] ];
		    }
		s += "</select></th><td>"
		    + "<input onChange='change_invitees(this,"+i+",1);'"
		    + " value=\""+uinvitees_split[1]+"\"></td>";
		if( ! uinvitees_split[2] ) { uinvitees_split[2] = ""; }
		var current_priv_list = uinvitees_split[2].split(",");
		for( var pi=0; pi<invite_privs_list.length; pi++ )
		    {
		    s += "<th><input type=checkbox value=\""
		    	+ invite_privs_list[pi] + "\""
			+ ( (searchArray(current_priv_list,
			    invite_privs_list[pi] ) >= 0 )
			  ? " checked" : "" )
			+ " onClick='change_invitees(this,"+i+",2);'"
			+ "></th>";
		    }
		s += "</tr>";
		}
	    }
	s += "<tr><th><select onChange='change_invitees(this,-1,0);'>";
	s += "<option value=\"\">XL(Add entry)";
	for( var pi=0; pi<invite_transmitters_list.length; pi++ )
	    {
	    s += "<option value=\""+invite_transmitters_list[pi]+"\">"
		+translations[ invite_transmitters_list[pi] ];
	    }
	s += "</select></center></th></tr>"
	}
    s += "</table></center>";
    p.invitee_table.innerHTML = s;
    }

function make_new_variable( repnum, vname )
    {
    int_reports[repnum][vname] =
	{
	Row:		-1,
	Constraint:	"",
	Order:		-1,
	Direction:	"",
	Column:		-1,
	Axis:		""
	};
    }

function change_report( obj )
    {
    if( obj.options[obj.selectedIndex].value != "" )
	{
	if( obj.options[obj.selectedIndex].value != "new" )
	    {
	    currep = obj.options[obj.selectedIndex].value;
	    window.document.%%FORM_NAME%%.thisrep.value =
		int_reports[obj.options[obj.selectedIndex].value]._report_name;
	    }
	else
	    {
	    var new_name = usprompt("XL(Enter new report name):","");
	    if( new_name )
		{
		window.document.%%FORM_NAME%%.thisrep.value = new_name;
		int_reports[currep=int_reports.length] = { "_report_name":  new_name };
		for( var vi=variables.length; --vi>=0; )
		    {
		    make_new_variable( currep, variables[vi] );
		    }
		}
	    }
	}
    redraw_report_table(1);
    }

function fix_sort( obj, varname, repfieldname )
    {
    var old_value = int_reports[currep][varname][repfieldname];
    var new_value = obj.options[obj.selectedIndex].value*1;
    if( old_value != new_value )
        {
	var highest = -1;
	for( var vi=variables.length; --vi>=0; )
	    {
	    var v = variables[vi];
	    if( v != varname )
		{
		if( int_reports[currep][v][repfieldname] >= 0 )
		    {
		    if( old_value >= 0
			&& int_reports[currep][v][repfieldname] > old_value )
			{ int_reports[currep][v][repfieldname]--; }
		    if( new_value >= 0
			&& int_reports[currep][v][repfieldname] >= new_value )
			{ int_reports[currep][v][repfieldname]++; }
		    if( int_reports[currep][v][repfieldname] > highest )
			{ highest = int_reports[currep][v][repfieldname]; }
		    }
		}
	    }
	}
    if( new_value > (highest+1) ) { new_value--; }
    int_reports[currep][varname][repfieldname] = new_value;
    redraw_report_table(1);
    }

var highest_values = {};
function sorter_column( varname, repfieldname, nonetxt )
    {
    var s = "<select onChange='fix_sort(this,\""+varname+"\",\""+
        repfieldname+"\");'>";
    var curv = int_reports[currep][varname][repfieldname];
    s += do_option( curv, -1, nonetxt );
    for( var posord=0; posord<=highest_values[repfieldname]; posord++ )
        { s += do_option( curv, posord, posord+1 ); }
    s += "</select>";
    return s;
    }

function sorter( a, b )
    {
    if( sortby != "Field" )
        {
	a = int_reports[currep][a][sortby];
	if( a < 0 ) { a = 1000; }
	b = int_reports[currep][b][sortby];
	if( b < 0 ) { b = 1000; }
	}
    if( a > b ) { return  1; }
    if( a < b ) { return -1; }
    return 0;
    }

function copy_obj( obj )
    {
    if( obj == null || typeof(obj) != 'object' ) { return obj; }
    var res = new obj.constructor();
    for( var k in obj )
        { res[k] = copy_obj( obj[k] ); }
    return res;
    }

function clone_report( rep )
    {
    var new_name =
	usprompt("XL(Enter new report name:)",int_reports[rep]._report_name);
    if( new_name )
        {
	currep = int_reports.length;
	int_reports[currep] = copy_obj( int_reports[rep] );
	int_reports[currep]._report_name = new_name;
	redraw_report_table( 1 );
	}
    }

function check_axes( obj, v )
    {
    var each_axes = {};
    var failures = new Array();
    var warnings = new Array();

    for( var id in AXES )
        {
	each_axes[ AXES[id] ] = 0;
	}

    each_axes[ obj.options[obj.selectedIndex].value ] ++;
    for( var iv in variables )
        {
	if( variables[iv] != v )
	    { each_axes[ int_reports[currep][variables[iv]].Axis ] ++; }
	}
    if( each_axes.Z > 0 )
        {
	if( each_axes.Y > 1 )
	    { failures.push("XL(Cannot have Z index with multiple Y indices.)"); }
	else if( each_axes.Y < 1 )
	    { warnings.push("XL(Must have one Y index with a Z index.)"); }
	}
//    else if( each_axes.Y < 1 )
//	{ warnings.push("XL(Must have at least one Y index.)"); }
    if( each_axes.X > 1 )
	{ failures.push("XL(Cannot have multiple X indices.)"); }
    else if( each_axes.X < 1 )
	{ warnings.push("XL(Must have one X index.)"); }
    if( failures.length )
	{
	alert( "Cannot continue:\n " + failures.join("\n ") );
	redraw_report_table(0);
	}
    else
        {
	if( warnings.length )
	    { alert( "Warning:\n " + warnings.join("\n ") ); }
	int_reports[currep][v].Axis = obj.options[obj.selectedIndex].value;
	redraw_report_table(1);
	}
    }

function redraw_report_table( flag )
    {
    if( flag ) { trigger_change(1); }
    var s = '<center><table class=outside_table border=1>';
    with( window.document )
	{
	s += "<tr><th align=left>XL(Report):</th>"
	    + "<td colspan="
	    + ( currep < 0 ? 5 : 3 )
	    + "><select name=which_report onChange='"
	    + "change_report(this);'>"
	    + (currep<0 ? "<option value=''>XL(Select report name)" : "" )
	    + "<option value=new>XL(Create new report)";
	for( var ir=0; ir<int_reports.length; ir++ )
	    {
	    if( ! int_reports[ir]._report_deleted )
		{
		s += "<option value="+ir
		    + ( ir==currep ? " selected" : "" )
		    + ">" + int_reports[ir]._report_name;
		}
	    }
	s += "</select></td>";
	if( currep < 0 )
	    { s+= "</tr>"; }
	else
	    {
	    if( typeof( int_reports[currep]._report_type ) == "undefined" )
		{ int_reports[currep]._report_type = "Table"; }
	    s +="<th><input type=button value='XL(Clone)' onClick='"
	        +"clone_report(currep);'></th>"
		+"<th colspan=2>"
		+"<input type=button value='XL(Delete)' onClick='"
	        +"int_reports[currep]._report_deleted=1;"
		+"currep=-1;redraw_report_table(1);'"
	        +"></th></tr>"
		+"<tr><td colspan=7>&nbsp;</td></tr>"
		+"<tr><th rowspan=2 valign=bottom>XL(Field)"
		+"<input type=checkbox "
		+(sortby=="Field"?" checked":"")
		+" onClick='sortby=\"Field\";redraw_report_table(0);'>"
		+"</th><th rowspan=1 colspan=2 valign=bottom>XL(Search)</th>"
		+"<th rowspan=1 colspan=4>"
		+"<select onChange='int_reports[currep]._report_type=this.options[this.selectedIndex].value;redraw_report_table(1);'>"
		+do_option( int_reports[currep]._report_type, "Table", "XL(Display as table)" )
		+do_option( int_reports[currep]._report_type, "Graph", "XL(Display as graph)" )
		+"</select>";
	    if( int_reports[currep]._report_type == "Graph" )
	        {
		s += "<select onChange='int_reports[currep]._click_to=this.options[this.selectedIndex].value;redraw_report_table(1);'>"
		    + "<option value=''>XL(Select report to click to)";
		for( var ir=0; ir<int_reports.length; ir++ )
		    {
		    if( ir!=currep
			&& ! int_reports[ir]._report_deleted
		        && int_reports[ir]._report_type != "Graph" )
			{
			s += "<option value=\""
			    +int_reports[ir]._report_name
			    +"\""
			    + ( (int_reports[ir]._report_name
			    	==int_reports[currep]._click_to)
				? " selected" : "" )
			    + ">XL(Click to) " + int_reports[ir]._report_name;
			}
		    }
		s += "</select>";
		}
	    s += "</th></tr>"
		+"<tr><th rowspan=1>XL(Row)"
		+"<input type=checkbox "
		+(sortby=="Row"?" checked":"")
		+" onClick='sortby=\"Row\";redraw_report_table(0);'>"
		+"</th><th rowspan=1>XL(Default constraint)</th>"
		+((int_reports[currep]._report_type=="Table")
		  ? ("<th rowspan=1>XL(Sort order)"
		    +"<input type=checkbox "
		    +(sortby=="Order"?" checked":"")
		    +" onClick='sortby=\"Order\";redraw_report_table(0);'>"
		    +"</th><th colspan=1>XL(Sort direction)</th>"
		    +"<th valign=bottom colspan=2>XL(Column)"
		    +"<input type=checkbox "
		    +(sortby=="Column"?" checked":"")
		    +" onClick='sortby=\"Column\";redraw_report_table(0);'>"
		    +"</th>")
		  : "<th>XL(Display on axis)"
		    +"<input type=checkbox "
		    +(sortby=="Axis"?" checked":"")
		    +" onClick='sortby=\"Axis\";redraw_report_table(0);'></th>"
		    +"<th>XL(Begins)</th>"
		    +"<th>XL(Number blocks)</th>"
		    +"<th>XL(Ends)</th>"
		  )+"</tr>";
	    var last_values =
		{
		"Row":		-1,
		"Column":	-1,
		"Order":	-1
		};
	    for( si in last_values )
		{
		for( var vi=variables.length; --vi>=0; )
		    {
		    if( ! int_reports[currep][variables[vi]] )
			{
			make_new_variable( currep, variables[vi] );
			}
		    var onum = int_reports[currep][variables[vi]][si];
		    if( onum > last_values[si] )
			{ last_values[si] = onum; }
		    }
		}
	    for( si in last_values )
		{
		highest_values[si] = last_values[si] + 1;
		}
	    var sorted_array = variables.sort( sorter );
	    for( var vi in sorted_array )
		{
		var v = sorted_array[vi];
		var sdir = int_reports[currep][v].Direction;
		s += "<tr><th align=left>" + v + "</th><th>"
		    + sorter_column(v,"Row","XL(Unshown)")
		    +"</th><th><input type=text"
		    +" value='"+int_reports[currep][v].Constraint+"'"
		    +" onChange='int_reports[currep]."+v+".Constraint=this.value;redraw_report_table(1);'"
		    +"></th>"
		if( int_reports[currep]._report_type == "Table" )
		    {
		    s += "<th>"
			+ sorter_column(v,"Order","XL(Unused)")
			+"</th><th>";
		    if( int_reports[currep][v].Order >= 0 )
			{
			s += "<select onChange='int_reports[currep]."
			    +v+".Direction=this.options[this.selectedIndex].value;redraw_report_table(1);'>"
			    +do_option( sdir, "Up", "XL(Up)" )
			    +do_option( sdir, "Down", "XL(Down)" )
			    +do_option( sdir, "Last name", "XL(Last name)" )
			    +"</select>";
			}
		    s += "</th><th colspan=2>"
			+sorter_column(v,"Column","XL(Unshown)")
			+"</th>";
		    }
		if( int_reports[currep]._report_type == "Graph" )
		    {
		    var val = int_reports[currep][v].Axis;
		    s += "<th><select onChange='check_axes(this,\""+v+"\");'>"
			+do_option( val, "", "XL(Unshown)" );
		    for( var id in AXES )
		        {
			s += do_option( val, AXES[id], AXES[id] )
			}
		    s += "</select></th>";
		    if( typeof(val)!="undefined" && val!="" )
		        {
			val = int_reports[currep][v].Begins;
			s += "<th><input type=text size=10 value=\""
			    + ( typeof(val)=="undefined" ? "" : val )
			    + "\" onChange='check_axes(this,\""+v+"\"\");'>"
			    + "</th>";
			val = int_reports[currep][v].Number_blocks;
			s += "<th><input type=text size=10 value=\""
			    + ( typeof(val)=="undefined" ? "" : val )
			    + "\" onChange='check_axes(this,\""+v+"\"\");'>"
			    + "</th>";
			val = int_reports[currep][v].Ends;
			s += "<th><input type=text size=10 value=\""
			    + ( typeof(val)=="undefined" ? "" : val )
			    + "\" onChange='check_axes(this,\""+v+"\"\");'>"
			    + "</th>";
			}
		    }
		s += "</tr>";
		}
	    }
	}
    s += "</table></center>";
    p.report_table.innerHTML = s;
    }

function redraw()
    {
    redraw_transmitter_table();
    redraw_submission_table();
    redraw_invite_table();
    redraw_report_table(0);
    return true;
    }
</script>
</head>
<body>
<form name="%%FORM_NAME%%" method=post ENCTYPE="multipart/form-data"
    onSubmit='send_to_server(""); return is_not_cr_submit;'>
<input type=hidden name=func value="form_administration">
<input type=hidden name=SID value="%%SID%%">
<input type=hidden name=USER value="%%USER%%">
<input type=hidden name=form_type value="%%FORM_TYPE%%">
<input type=hidden name=transmitters_vals value="%%transmitters_vals%%">
<input type=hidden name=submission value="%%SUBMISSION%%">
<input type=hidden name=reports value="">
<input type=hidden name=invitees_vals value="">
<input type=hidden name=constraints value="%%CONSTRAINTS%%">
<input type=hidden name=showing value="%%SHOWING%%">
<input type=hidden name=thisrep value="%%THISREP%%">
<center><table border=1 class=outside_table>
    <tr class=outside_table><th class=outside_table><select class=outside_table
        onChange='light_up( this.options[this.selectedIndex].value );'>
	<option class=outside_table_title value=select_page_light>XL(Select information to modify)
	<option class=outside_table_unchecked value=transmitter_light>XL(Available transmitters)
	<option class=outside_table_unchecked value=submission_light>XL(Submission information)
	<option class=outside_table_unchecked value=lookandfeel_light>XL(Look and feel/CSS)
	<option class=outside_table_unchecked value=content_light>XL(Content editor)
	<option class=outside_table_unchecked value=upload_light>XL(Upload data from local machine)
	<option class=outside_table_unchecked value=invitees_light>XL(Invite people to fill out this form)
	<option class=outside_table_unchecked value=user_light>XL(Manage privileges for this form)
	<option class=outside_table_unchecked value=report_light>XL(Manage reporting in this form database)
	<option class=outside_table_unchecked value=resetdb_light>XL(Reset contents of database)
	</select></th></tr>
    <tr class=outside_table id=select_page_light><th class=outside_table>XL(Select information to modify)</th></tr>
    <tr class=outside_table id=transmitter_light><th class=outside_table id=transmitter_table>XL(Transmitter table)</th></tr>
    <tr class=outside_table id=submission_light><th class=outside_table id=submission_table>XL(Submission table)</th></tr>
    <tr class=outside_table id=lookandfeel_light><td class=outside_table><b>XL(URL for CSS or CSS script):</b><br>
        <center><textarea name=css_url rows=40 cols=80
	    onChange='trigger_change(1);'>%%CSS_URL%%</textarea>
	</center></td></tr>
    <tr class=outside_table id=content_light><td class=outside_table><b>XL(Script):</b><br><center>
	<textarea name=new_contents
	 onChange='trigger_change(1);'
	 rows=40 cols=80>%%CONTENT%%</textarea></center></td></tr>
    <tr class=outside_table id=upload_light><th class=outside_table><table width=100%>
	%%UPLOAD_TABLE%%
        <tr class=outside_table><th class=outside_table align=left>XL(File name to upload to):</th>
	    <td class=outside_table><input type=text name=new_file_name></td></tr>
	<tr class=outside_table><th class=outside_table align=left>XL(File to upload):</th>
	    <td class=outside_table><input type=file name=new_file
		 onChange='send_to_server("form_administration_update");'>
		 (XL(forces an update))</td></tr>
	</table></td></tr>
    <tr class=outside_table id=invitees_light><th class=outside_table id=invitee_table>XL(Invitee table)</th></tr>
    <tr class=outside_table id=user_light>
        <th class=outside_table><table border=1 class=outside_table>
	    %%USER_TABLE%%</table></th></tr>
    <tr class=outside_table id=report_light>
        <th class=outside_table id=report_table>XL(Report table)</th></tr>
<tr class=outside_table id=resetdb_light><th align=center>
    XL(This will remove all records for this form but keep the form's
    administration settings intact)<br>
    <table class=outside_table><tr>
	<th align=left>XL(Confirm resetting database)</th>
    <td class=outside_table align=left>
	<input type=checkbox name=reset_database onClick='trigger_change(1);'>
	</td></tr></table></th></tr>
<tr class=outside_table><th class=outside_table><input type=button value="XL(Update)" id=subbutton_light
    onClick='send_to_server("form_administration_update");' style='display:none'>
    %%MSG%%</th></tr>
</table>
</form>
<script>
setup_caches();
</script>

