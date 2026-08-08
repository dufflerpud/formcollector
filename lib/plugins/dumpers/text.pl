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

our $default_extension = "txt";

do &mapfile("$main::LIBDIR/reconstitute_html.pl");

sub main::records_to_type
    {
    my $formatted_data = &cpi_file::tempfile(".html");
    &cpi_file::write_file( $formatted_data, &generate_html( @_ ) );
    return &cpi_file::read_file( "lynx -dump $formatted_data |" );
    }
1;
