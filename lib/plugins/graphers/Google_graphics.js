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

<script type="text/javascript" src="https://www.google.com/jsapi"></script>
<script type="text/javascript" src="chart_configuration.js"></script>
<script type="text/javascript">

var data;
var chart;

var select_mapper =
    {%%SELECT_MAPPER%%};

function select_handler()
    {
    var selection = chart.getSelection();
    // alert("Top of select_handler()\n");
    for (var i = 0; i < selection.length; i++)
	{
	var item = selection[i];
	var matchstr = "X";
	// alert("item.row="+item.row+", item.column="+item.column);
	if( item.row != null && item.column != null )
	    { matchstr = item.row + "-" + item.column; }
	else if( item.row != null )
	    { matchstr = item.row; }
	if( matchstr != "X" )
	    {
	    if( select_mapper[matchstr] )
		{
		// alert("Match[ "+select_mapper[matchstr]+" ]");
		eval( select_mapper[matchstr] );
		}
	    else
	        {
		// alert("No match[ "+matchstr+" ]");
		}
	    }
	}
    }

function drawChart()
    {
%%DATA_STATEMENTS%%
    chart_configuration.title = "%%TITLE%%";
    chart_configuration.colors = %%COLORS%%;
    chart_configuration.isStacked = true;
    chart.draw(data, chart_configuration);
    google.visualization.events.addListener( chart, 'select', select_handler );
    }

google.setOnLoadCallback(drawChart);
google.load("visualization", "1", {packages:["%%GOOGLE_PACKAGE%%"]});
</script>
<div id="chart_div" style="width: 900px; height: 500px;"></div>
