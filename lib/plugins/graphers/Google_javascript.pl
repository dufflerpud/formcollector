#!/usr/bin/perl -w
#@HDR@	$Id$
#@HDR@		Copyright 2024 by
#@HDR@		Christopher Caldwell/Brightsands
#@HDR@		P.O. Box 401, Bailey Island, ME 04003
#@HDR@		All Rights Reserved
#@HDR@
#@HDR@	This software comprises unpublished confidential information
#@HDR@	of Brightsands and may not be used, copied or made available
#@HDR@	to anyone, except in accordance with the license under which
#@HDR@	it is furnished.

use strict;

our %SEP;
our $thisrep;
our %reports;
our %showing;
our $form_type;
our @aggregated_field_names;
our @field_names;
our @AXES;
our @axlist;
our %axes;
our %vals;
our $GRAPHERS;

my $GOOGLE_API = "https://chart.googleapis.com/chart";
my $GOOGLE_GRAPHICS_JS = &mapfile("$GRAPHERS/Google_graphics.js");

my $click_to;

#########################################################################
#	Return the javascript necessary to take the user to the desired	#
#	report when he clicks on the javascript generated chart.	#
#########################################################################
sub genjs
    {
    my( $nmatch, @constraints ) = @_;
    if( ! $nmatch || ! scalar(@$nmatch) )
        {
	print STDERR "genjs called with constraint matching no values.\n";
	return "'Unknown'";
	}
    elsif( scalar(@$nmatch) == 1 )
        { return "'submit_func(\"\",\"\",\"".$nmatch->[0]."\");'"; }
    else
        {
	return "'submit_func(\"view\",\"$click_to\",\""
	    . join( $SEP{FIELD}, $click_to, @constraints ) . "\");'";
	}
    }

#########################################################################
#	Setup data for the Google javascript chart generator.		#
#	See https://google-developers.appspot.com/chart for API.	#
#########################################################################
sub generate_graph
    {
    my( $need_header, $argp, $overlap, @keys_to_output ) = @_;
    my @chart_lines=("    var data=new google.visualization.DataTable();\n");
    my @select_lines;
    my $chtype;
    my $ncolors = 1;
    my $google_package = "corechart";

    $click_to = $argp->{_click_to};

    #if( 1 || ! $overlap )
    if( $axes{Z}
#    &&	$axes{X} && $axes{X}{Type} eq "number"
#    &&  $axes{Y} && $axes{Y}{Type} eq "number"
    	)
	{
	$chart_lines[0]=
	    ("    var data = google.visualization.arrayToDataTable([\n");

	push( @chart_lines, "\t['ID'" );
	foreach my $axis ( @axlist )
	    {
	    push( @chart_lines, ", '$axes{$axis}{Title}'");
	    }
	push( @chart_lines, "]" );
	my $rownum = 0;
	my $sep = "\n\t";
	foreach my $ind ( sort keys %vals )
	    {
	    my @pieces = split($SEP{FIELD},$ind);
	    push( @pieces, "" ) if( scalar(@pieces) <= 0 );
	    grep( s/_/ /g, @pieces );
	    print STDERR "pieces=",join("/",@pieces),".\n";
	    foreach my $rec ( @{$vals{$ind}} )
	        {
		push( @select_lines, "$sep${rownum}:" . &genjs([$rec]) );
		my @vals = ( "'".$rec."'" );
		foreach $_ ( 0 .. 1 )
		    {
		    my $v = $axes{$axlist[$_]}{position}{$pieces[$_]};
		    if( 1 || $axes{$axlist[$_]}{Type} ne "datetime" )
		        { push(@vals,$v); }
		    else
		        {
			my($sec,$min,$hour,$mday,$month,$year) = localtime($v);
			push( @vals,
			    sprintf("new Date(%d,%d,%d,%d,%d,%d)",
			        $year+1900, $month, $mday, $hour, $min, $sec) );
			}
		    }
		if( defined( $axlist[2] ) )
		    {
		    push(@vals,&js_quoting(defined($pieces[2])?$pieces[2]:"Unspecified"));
		    if( defined( $axlist[3] ) )
			{
			push(@vals,
			    ( !defined($pieces[3])
			    ? 0
			    : int( 100*($pieces[3]-$axes{$axlist[3]}{minv})
				/($axes{$axlist[3]}{maxv}-$axes{$axlist[3]}{minv}))
			    ) );
			push(@vals,map{&js_quoting($_,0)} @pieces[4..$#pieces]);
			}
		    }
		push(@chart_lines, ",\n\t[", join(",",@vals), "]");
		$rownum++;
		$sep = ",\n\t";
		}
	    }
	push( @chart_lines, "\n    ]);\n" );
	push( @chart_lines,
	    "    chart_configuration.hAxis = {title: '", $axes{X}{Title}, "'};\n");
	push( @chart_lines,
	    "    chart_configuration.vAxis = {title: '", $axes{Y}{Title}, "'};\n");
	if( $axes{$axlist[0]}{Type} eq "datetime" ||
	    $axes{$axlist[1]}{Type} eq "datetime" )
	    {
	    push( @chart_lines,
	        "    var formatter = new google.visualization.DateFormat({pattern: 'MM/dd/yy HH:mm:ss'});\n" );
	    push( @chart_lines, "    formatter.format( data, 1 );\n" )
		if( $axes{$axlist[0]}{Type} eq "datetime" );
	    push( @chart_lines, "    formatter.format( data, 2 );\n" )
		if( $axes{$axlist[1]}{Type} eq "datetime" );
	    }
	$ncolors = scalar( keys %{$axes{Z}{Vals}} );
	$chtype = "BubbleChart";
	}
    elsif( scalar(@axlist) == 1 )
	{
	foreach my $axis ( @axlist )
	    {
	    push( @chart_lines,
	    "    data.addColumn('$axes{$axis}{Type}','$axes{$axis}{Title}');\n"
		);
	    }
	push( @chart_lines, "    data.addColumn('number','Count');\n" );
	push( @chart_lines, "    data.addRows([" );
	my $sep = "\n\t";
	my $isep = "\t";
	my $xindex = 0;
	foreach my $ind ( sort keys %vals )
	    {
	    my @pieces = split($SEP{FIELD},$ind);
	    push( @pieces, "" ) if( scalar(@pieces) <= 0 );
	    my $numvals = scalar( @{ $vals{$ind} } );
	    if( $numvals > 0 )
		{
		push( @select_lines,
		    "$isep${xindex}:" .
		    &genjs( ${vals{$ind}}, $axes{X}{Var}, $pieces[0] ) );
		$isep = ",\n\t";
		}
	    $xindex++;
	    grep( s/_/ /g, @pieces );
	    push( @pieces, $numvals );
	    push( @chart_lines,
		$sep, "[",
		join( ",", map { &js_quoting($_,0) } @pieces ),
		"]" );
	    $sep = ",\n\t";
	    }
	$ncolors = $xindex;
	push( @chart_lines, "\n    ]);\n" );
	push( @chart_lines,
	    "    chart_configuration.hAxis = {title: '", $axes{X}{Title}, "'};\n");
	$chtype = "PieChart";
	}
    elsif( scalar(@axlist) == 2 )
	{
	push( @chart_lines, "    data.addColumn('$axes{X}{Type}','$axes{X}{Title}');\n" );
	my @yvals = sort keys %{$axes{Y}{Vals}};
	foreach my $yval ( @yvals )
	    {
	    $_ = &token_to_text($yval);
	    push( @chart_lines, "    data.addColumn('number','$_');\n" );
	    }
	my $sep = "\n\t";
	my $isep = "\t";
	push( @chart_lines, "    data.addRows([" );
	my $xindex = 0;
	foreach my $xval ( sort keys %{$axes{X}{Vals}} )
	    {
	    $_ = &token_to_text($xval);
	    push( @chart_lines, "$sep\[ '$_'" );
	    my $yindex = 1;
	    foreach my $yval ( @yvals )
		{
		my $ind = join( $SEP{FIELD}, $xval, $yval );
		my $numvals = ( $vals{$ind} ? scalar(@{$vals{$ind}}) : 0 );
		push( @chart_lines, ", ", $numvals );
		if( $numvals > 0 )
		    {
		    push( @select_lines,
			"$isep\"${xindex}-${yindex}\":" .
			&genjs( $vals{$ind},
			    $axes{X}{Var},$xval, $axes{Y}{Var},$yval ) );
		    $isep = ",\n\t";
		    }
		$yindex++;
		}
	    $ncolors = $yindex;
	    push( @chart_lines, " ]" );
	    $xindex++;
	    $sep = ",\n\t";
	    }
	push( @chart_lines, "\n    ]);\n" );
	push( @chart_lines,
	    "    chart_configuration.hAxis = {title: '", $axes{X}{Title}, "'};\n");
	push( @chart_lines,
	    "    chart_configuration.vAxis = {title: '", $axes{Y}{Title}, "'};\n");
	$chtype = "ColumnChart";
	$google_package = "columnchart";
	}
    else
	{
	print STDERR "Incorrect number of axes.\n";
	$chtype = "Unknown";
	}

    push( @chart_lines, "    chart = new google.visualization.$chtype(document.getElementById('chart_div'));\n" );
    return &template_substitutions( $GOOGLE_GRAPHICS_JS,
	"GOOGLE_PACKAGE",		$google_package,
	"DATA_STATEMENTS",		join("",@chart_lines),
	"SELECT_MAPPER",		join("",@select_lines),
	"COLORS",			"[".&generate_color_list($ncolors,1)."]",
	"TITLE",			&token_to_text($form_type) );
    }
1;
