#!/usr/local/bin/perl -w
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
use lib "/usr/local/lib/perl";
use cpi_time qw(parsedate);
use cpi_sortable qw(sortable);



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

our $PLUGINS;
our $GRAPHERS		= &mapfile( "$PLUGINS/graphers" );

#########################################################################
#	Get rid of any characters that are likely to have special	#
#	meaning to a URL parser.					#
#########################################################################
sub urlescape
    {
    my ( $s ) = @_;
    $s =~ s/%([A-F0-9][A-F0-9])/pack("C", hex($1))/gie;
    return $s;
    }

#########################################################################
#	Return a list of $ncols HHHHHH (hex color strings) as different	#
#	as can be.							#
#########################################################################
sub generate_color_list
    {
    my( $ncols, $fmt ) = @_;
    my( @ret );
    my $ndigs = 3;
    my $maxcolor = 0xdf;
    my( $float_values_per_color ) = ( $ncols + 2 ) ** ( 1.0/$ndigs );
    my $values_per_color = int( $float_values_per_color );
    $values_per_color++ if( $float_values_per_color > $values_per_color );
    for( my $ind=1; $ind<=$ncols; $ind++ )
        {
	my $temp = $ind;
	my $digind = $ndigs;
	my $lighter = "";
	my $darker = "";
	while( $digind-- > 0 )
	    {
	    my $dig = $temp % $values_per_color;
	    my $adjusted_dig = $dig * $maxcolor / ($values_per_color-1);
	    $lighter .= sprintf("%02X",$adjusted_dig);
	    $darker .= sprintf("%02X",0.8*$adjusted_dig);
	    $temp = int( $temp / $values_per_color );
	    }
	if( $fmt )
	    { push( @ret, "{color:'#$lighter',darker:'#$darker'}" ); }
	else
	    { push( @ret, $lighter ); }
        }
    return join(",",@ret);
    }

#########################################################################
#	Generate a graphic report.  Read through the data into %val	#
#	and invoke the appropriate handler.				#
#########################################################################
sub graph_report
    {
    my( $need_header, $argp, @keys_to_output ) = @_;

    #return "${form_type}:  [" .join(",",@keys_to_output)."]<br>\n";

    my $image_technology;

    if( ! $argp || ! $argp->{transmitter_type} )
        { $image_technology = "browser"; }
    else
        { $image_technology = $argp->{transmitter_type}; }

    if( $thisrep && $reports{$thisrep} )
        {
	my $axis;
	foreach my $v ( keys %{$reports{$thisrep}} )
	    {
	    if( ref( $reports{$thisrep}{$v} ) eq "HASH"
		&& ($axis=$reports{$thisrep}{$v}{Axis}) )
		{
		$axes{$axis}{Var} = $v;
		$axes{$axis}{Title} = $v;
		$axes{$axis}{Title} =~ s+_+ +g;
		}
	    }
	@axlist = ();
	foreach $axis ( @AXES )
	    {
	    push( @axlist, $axis ) if( $axes{$axis} );
	    }
	  
	my $overlap = 0;
	foreach my $key ( @keys_to_output )
	    {
	    my @keyvals = ();
	    foreach $axis ( @axlist )
		{
		my $varname = $axes{$axis}{Var};
		my $val = &DBFcachen( $key, $varname );
		push( @keyvals, $val );
		push( @{$axes{$axis}{Vals}{$val}}, $key );
		my $ntype;
		if( $val =~ /^[-\d\.][\d\.]+$/ )
		    { $ntype = "number"; }
		elsif( $val =~ m=^\d+/\d+/\d\d+ \d+:\d= )
		    { $ntype = "datetime"; }
		else
		    { $ntype = "string"; }
		if( ! $axes{$axis}{Type} )
		    { $axes{$axis}{Type} = $ntype; }
		elsif( $axes{$axis}{Type} ne $ntype )
		    { $axes{$axis}{Type} = "string"; }
		}
	    my $indstr = join($SEP{FIELD},@keyvals);
	    push( @{$vals{$indstr}}, $key );
	    $overlap=1 if( scalar(@{$vals{$indstr}}) > 1 );
	    }

	print STDERR "Pre order logic...\n";
	foreach my $axis ( @axlist )
	    {
	    print STDERR "Axis=$axis.\n";
	    my @valkeys = keys %{$axes{$axis}{Vals}};
	    if( $axes{$axis}{Type} eq "number" )
	        {
		%{$axes{$axis}{position}} = %{$axes{$axis}{Vals}};
		grep( $axes{$axis}{position}{$_} = $_, @valkeys );
		}
	    elsif( $axes{$axis}{Type} eq "datetime" )
	        {
		grep( $axes{$axis}{position}{$_} = &parsedate( $_ ),
		    @valkeys );
		}
	    elsif( $axes{$axis}{Type} eq "string" )
	        {
		grep($axes{$axis}{parsed}{$_}=&sortable($_),@valkeys);
		my $ind = 0;
		grep( $axes{$axis}{position}{$_} = $ind++,
		    sort {$axes{$axis}{parsed}{$a}<=>$axes{$axis}{parsed}{$b}}
		    @valkeys );
		}
	    foreach my $v ( map { $axes{$axis}{position}{$_} } @valkeys )
		{
		if( ! defined($axes{$axis}{minv}) )
		    { $axes{$axis}{minv} = $axes{$axis}{maxv} = $v; }
		else
		    {
		    $axes{$axis}{minv} = $v if( $axes{$axis}{minv} > $v );
		    $axes{$axis}{maxv} = $v if( $axes{$axis}{maxv} < $v );
		    }
		}
	    print STDERR "minv{$axis}=", $axes{$axis}{minv}, " ",
	    		 "maxv{$axis}=", $axes{$axis}{maxv}, "\n";
	    }

	if( -f &mapfile("$GRAPHERS/vrml.pl") )
	    { do &mapfile("$GRAPHERS/vrml.pl"); }
	elsif( $image_technology eq "browser" )
	    { do &mapfile("$GRAPHERS/Google_javascript.pl"); }
	else
	    { do &mapfile("$GRAPHERS/Google_image.pl"); }
	return &generate_graph( $need_header, $argp, $overlap, @keys_to_output );
	}
    }
1;
