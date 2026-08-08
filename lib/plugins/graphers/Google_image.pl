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

use POSIX qw( log10 );

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

my $GOOGLE_API = "https://chart.googleapis.com/chart";

#########################################################################
#	Add arguments to the current string.				#
#########################################################################
my @googargs;
sub addargs
    {
    my( @args ) = @_;
    my( $varname, $val );
    while( $varname = shift( @args ) )
        {
	push( @googargs, "$varname=".shift(@args) );
	}
    }

#########################################################################
#	Return number of digits past decimal point to show on axes.	#
#########################################################################
sub digits_required
    {
    my( $minv, $maxv, $divs ) = @_;
    my $diff = ($maxv - $minv) / $divs;
    my $ldiff = log10( $diff );
    #printf("diff=%.10f ldiff=%6.2f\n",$diff,$ldiff);
    my $digs = - $ldiff;
    $digs++ if( int($digs) != $digs );
    return int( $digs < 0 ? 0 : $digs );
    }

#########################################################################
#	Setup data for the Google chart generator to create png files	#
#	See: https://google-developers.appspot.com/...			#
#		chart/image/docs/chart_params#gcharts_legend for API	#
#########################################################################
sub generate_graph
    {
    my( $need_header, $argp, $overlap, @keys_to_output ) = @_;
    #
    my %labels;
    foreach my $axis ( @axlist )
        {
	@{$labels{$axis}}
	    = map { &urlescape( $_ ? &token_to_text($_) : "XL(Unspecified)" ) }
		sort keys %{$axes{$axis}{Vals}};
	}

    if( $axes{Z}
    # &&  $axes{X} && $axes{X}{Type} eq "number"
    # &&  $axes{Y} && $axes{Y}{Type} eq "number"
        )
	{
	my $ncolors = scalar( keys $axes{$axlist[2]}{Vals} );
	my @color_array = split(/,/,&generate_color_list( $ncolors, 0 ));
	my %item_to_color = ();
	my %gens;
	foreach my $ind ( sort keys %vals )
	    {
	    my @pieces = split($SEP{FIELD},$ind);
	    push( @pieces, "" ) if( scalar(@pieces) <= 0 );
	    grep( s/_/ /g, @pieces );
	    foreach my $rec ( @{$vals{$ind}} )
	        {
		push( @{$gens{Xs}},
		    5+int(90 * ( $axes{$axlist[0]}{position}{$pieces[0]} - $axes{$axlist[0]}{minv} )
		    / ( $axes{$axlist[0]}{maxv} - $axes{$axlist[0]}{minv} ) ));
		push( @{$gens{Ys}},
		    5+int(90 * ( $axes{$axlist[1]}{position}{$pieces[1]} - $axes{$axlist[1]}{minv} )
		    / ( $axes{$axlist[1]}{maxv} - $axes{$axlist[1]}{minv} ) ));
		push( @{$gens{Sizes}},
		    40 + int( 400*($pieces[3]-$axes{$axlist[3]}{minv})
		        /($axes{$axlist[3]}{maxv}-$axes{$axlist[3]}{minv}+1) ) );
		if( !defined( $item_to_color{$pieces[2]} ) )
		    {
		    $item_to_color{$pieces[2]} = shift( @color_array );
		    push( @{$gens{Titles}},
			( (defined($pieces[2]) && $pieces[2] ne "")
			? $pieces[2]
			: "Unspecified" ) );
		    }
		push( @{$gens{Colors}}, $item_to_color{$pieces[2]} );
		}
	    }

	my $xdecimals = &digits_required(
	    $axes{$axlist[0]}{minv},$axes{$axlist[0]}{maxv},10);
	my $ydecimals = &digits_required(
	    $axes{$axlist[1]}{minv},$axes{$axlist[1]}{maxv},10);
	&addargs(
	    "cht", "s",
	    "chtt", &token_to_text($form_type),
	    "chs", "700x300",
	    "chxt", "x,x,y,y",
	    "chxs", join("|","0N*f${xdecimals}*,000000,10","2N*f${ydecimals}*,000000,10"),
	    "chxr",
	        join("|",
		join(",",0,$axes{$axlist[0]}{minv},$axes{$axlist[0]}{maxv}),
		join(",",2,$axes{$axlist[1]}{minv},$axes{$axlist[1]}{maxv})
		),
	    "chxl",
		join("|",
		join("|","1:","",$axes{$axlist[0]}{Title}),
		join("|","3:","",$axes{$axlist[1]}{Title})
		),
	    #"chf", "c,lg,0,FFE7C6,0,76A4FB,1",
	    "chd", "t:".join("|",
	        join(",",@{$gens{Xs}}),
		join(",",@{$gens{Ys}}),
		join(",",@{$gens{Sizes}})),
	    "chco", join("|",@{$gens{Colors}}),
	    "chdl", join("|",@{$gens{Titles}})
	    );
	}
    elsif( scalar(@axlist) == 1 )
        {
	my @values = map { scalar(@{$vals{$_}}) } sort keys %{$axes{X}{Vals}};
	&addargs(
	    "cht", "p3",
	    "chtt", &token_to_text($form_type),
	    "chs", "700x300",
	    "chl", join("|",@{$labels{X}}),
	    "chco", &generate_color_list( scalar(@{$labels{X}}) ),
	    "chf", "c,lg,0,FFE7C6,0,76A4FB,1",
	    "chd", "t:". join(",",@values)
	    );
	}
    elsif( scalar(@axlist) == 2 )
        {
	my @values;
	my $wid = 700;
	my $numxs = scalar( keys %{$axes{X}{Vals}} );
	my $numys = scalar( keys %{$axes{Y}{Vals}} );
	my $maxcount = 0;

	foreach my $y ( sort keys %{$axes{Y}{Vals}} )
	    {
	    my @xvalues;
	    foreach my $x ( sort keys %{$axes{X}{Vals}} )
	        {
		my $ind = $vals{ join($SEP{FIELD},$x,$y) };
		my $val = ( $ind ? scalar(@{$ind}) : 0 );
		push( @xvalues, $val );
		$maxcount = $val if( $val > $maxcount );
		}
	    push( @values, join(",",@xvalues) );
	    }
	my $barspcwid = int( ($wid-20)/$numxs );
	my $barwid = int( 0.8 * $barspcwid );

	print STDERR "About to generate with numys=$numys.\n";
	&addargs(
	    "cht", "bvs",
	    "chtt", &token_to_text($form_type),
	    "chs", "${wid}x300",
	    "chxt", "x,x,y",
	    "chxl", join("|",
	    		"0:",@{$labels{X}},
			"1:",$axes{X}{Title}),
	    "chbh", join(",",$barwid,$barspcwid-$barwid,0),
	    "chdl", join("|",@{$labels{Y}}),
	    "chdlp", "t",
	    "chco", &generate_color_list( $numys ),
	    "chds", "0,$maxcount",
	    "chxr", "1,0,$maxcount",
	    "chf", "c,lg,0,FFE7C6,0,76A4FB,1",
	    "chd", "t:".join("|",@values)
	    );
	}
    return "<img align=middle src='" .
        $GOOGLE_API."?".join("&",@googargs)."'/><br>";
    }
1;
