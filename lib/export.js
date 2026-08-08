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
var show_dump_fields = 0
var current_transmitter = "";
var current_datatype = "";
var dump_fields = "";
var report_mode = %%REPORT_MODE%%;
var SEP =
    {
	%%SEPS%%
    }

var possible_transmitters =
    {
    %%TRANSMITTER_DUMPERS%%
    }

function export_done()
    {
//    alert("transmitter="+current_transmitter+"\n"+
//    		"datatype="+current_datatype+"\n"+
//		"dump_fields="+dump_fields);
    window.document.%%FORM_NAME%%.transmit_info.value =
        current_datatype + SEP.FIELD + current_transmitter;
    send_to_server( dump_fields );
    }

function redraw_export_widget()
    {
    var s = "";
    if( report_mode )
	{
	s +="<input type=button value='XL(Report)'"
	    +" class=report_button"
	    +" onClick='current_transmitter=\"browser\";current_datatype=\"HTML\";dump_fields=\"report\";export_done();'><br>";
	}
    s +="<input type=button value='XL(Export)' class=export_widget"
	+(show_dump_fields ? "_checked" : "_unchecked" )
	+" onClick='show_dump_fields=1;dump_fields=\"\";"
	+"current_transmitter=\"\";redraw_export_widget();'>";
    if( show_dump_fields == 0 )
	{ dump_fields = ""; }
    else if( report_mode )
	{
	s += "<select class=export_widget onChange="
	    +"'dump_fields=this.options[this.selectedIndex].value;"
	    +"current_transmitter=\"\";redraw_export_widget();'>"
	    +"<option class=export_widget_title value=\"\">"
	    +"XL(Export which fields)"
	    +"<option value=dump_records class=export_widget"
	    +(dump_fields=="dump_records"?"_checked selected":"_unchecked")
	    +">XL(All fields)"
	    +"<option value=report class=export_widget"
	    +(dump_fields=="report"?"_checked selected":"_unchecked")
	    +">XL(Just fields in report)"
	    +"</select>";
	}
    else
        {
	dump_fields = "full_record";
	}
    if( ! dump_fields )
        { current_transmitter=""; }
    else
	{
	var sep_pat = new RegExp( SEP.FIELD, "g" );
	s += " XL(to) <select class=export_widget onChange="
	    +"'current_transmitter=this.options[this.selectedIndex].value;"
	    +"current_datatype=\"\";redraw_export_widget();'>"
	    +"<option class=export_widget_title"
	    +" value=\"\">XL(Select transmitter)";
	for( var pdi in possible_transmitters )
	    {
	    s += "<option value=\""+pdi+"\" class=export_widget"
		+(pdi==current_transmitter?"_checked selected":"_unchecked")
		+">"+pdi.replace( sep_pat, " " );
	    }
	s += "</select>";
	}
    if( !current_transmitter )
	{ current_datatype = ""; }
    else
	{
	s += " XL(as) <select class=export_widget onChange="
	    +"'current_datatype=this.options[this.selectedIndex].value;"
	    +"export_done();'>"
	    +"<option value=\"\" class=export_widget_title>"
	    +"XL(Select data type)";
	for( var dti in possible_transmitters[current_transmitter] )
	    {
	    var v = possible_transmitters[current_transmitter][dti];
	    s += "<option value=\""+v+"\" class=export_widget"
		+(v==current_datatype?"_checked selected":"_unchecked")
		+">"+v;
	    }
	s += "</select>";
	}
    (window.document.getElementById("export_widget")).innerHTML = s;
    }
</script>
