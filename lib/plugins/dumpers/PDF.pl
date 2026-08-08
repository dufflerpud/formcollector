#!/usr/bin/perl
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

our $default_extension = "pdf";

do &mapfile("$main::LIBDIR/reconstitute_html.pl");

sub main::records_to_type
    {
    my $temp = &cpi_file::tempfile(".pdf.html");
    my $htmldata = &generate_html( @_ );
    foreach my $htmlpart
	( split(/(<img[^>]*style='display:none'[^>]*>)/s,$htmldata) )
	{
	if( $htmlpart =~ /^<img.*style='display:none'.*>$/s )
	    {
	    my $htmlsub = $htmlpart;
	    $htmlsub =~ s+ style='display:none'++;
	    $htmlsub =~ s+cid:+file://+;
	    $htmldata .= "<br>$htmlsub";
	    }
	}
    &cpi_file::write_file( $temp, $htmldata );
    print STDERR "+ $cpi_vars::HTML2PDF -q $temp - |\n";
    return &cpi_file::read_file( "$cpi_vars::HTML2PDF -q $temp - |" );
    }
1;
