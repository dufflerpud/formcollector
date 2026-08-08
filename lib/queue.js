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
//	Queing software

var UPLOAD_PREFIX = "_to_upload";

//////////////////////////////////////////////////////////////////////////
//	Send next file or die						//
//////////////////////////////////////////////////////////////////////////
function send_next_file()
    {
    var todo_str = localStorage( UPLOAD_PREFIX );
    if( ! todo_str )
	{
	transmission_in_progress = 0;
	return;
	}
    var todo_list = todo_str.split(",");
    var todo = todo_list.shift();
    if( todo_list.length )
	{ localStorage.putItem( UPLOAD_PREFIX, todo_list.join(","); }
    else
	{ localStorage.removeItem( UPLOAD_PREFIX ); }

    var fname = new Date().getTime() + ".html";
    var params = "uploadid="+uploadid+"&file="+escape(new_html);
    var req =
	( window.XMLHttpRequest
	? new XMLHttpRequest()
	: new ActiveXObject("Microsoft.XMLHTTP")
	);
    req.open("POST","%%ACTION%%", true );
    req.onreadystatechange = function()
        {
	if (req.readyState == 4)
	    {
	    if (req.status != 200 && req.status != 304)
		{
		// alert('HTTP error ' + req.status);
		}
	    return send_next_file();	// Check recursively if work to do
	    }
	return false;
	}
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.setRequestHeader("Content-length", params.length);
    req.setRequestHeader("Connection", "close");
    req.send( params );
    }

var transmission_in_progress = 0;
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
function check_queue()
    {
    if( ! transmission_in_progress )
        {
	transmission_in_progress = 1;
	send_a_file();
	}
    }

//////////////////////////////////////////////////////////////////////////
//	Check to see if we've got anything left in the queue on disk.	//
//////////////////////////////////////////////////////////////////////////
function start_queue()
    {
    }

//////////////////////////////////////////////////////////////////////////
//	Call-back when we've succeeded sending an item to the server.	//
//////////////////////////////////////////////////////////////////////////
function item_sent()
    {
    }

//////////////////////////////////////////////////////////////////////////
//	Figure out what to transmit as if we were a normal submission.	//
//////////////////////////////////////////////////////////////////////////
function get_form_var_value( obj )
    {
    return obj.value;
    }

//////////////////////////////////////////////////////////////////////////
//	Convert a form to a transmittable/storable string.		//
//////////////////////////////////////////////////////////////////////////
function form_to_string( form_elem )
    {
    var varparts = new Array();
    for( var elind in form_elem )
        {
	var form_elem_var = form_elem[elind];
	if( !form_elem_var.length )
	    {varparts.push(elind+"="+get_form_var_value(form_elem_var))};
	else
	    {
	    for( var i=0; i<form_elem_var; i++ )
		{varparts.push(elind+"="+get_form_var_value(form_elem_var[i]))};
	    }
	}
    return varparts.join("&");
    }

//////////////////////////////////////////////////////////////////////////
//	Direct replacement for window.document.form.submit() that	//
//	queues request to prevent lost data.				//
//////////////////////////////////////////////////////////////////////////
function queued_submit( form_name, dest_fname )
    {
    localStorage.setItem( UPLOAD_PREFIX + dest_fname, 
	form_to_string( window.document[form_name] ) );
    var todo_str = localStorage.getItem( UPLOAD_PREFIX );
    localStorage.putItem( UPLOAD_PREFIX,
	( todo_str
	? todo_str+","
	: ""
	) + dest_fname );
    check_queue();
    }

function setup()
    {
    }

redraw()
    {
    check_queue();
    }
