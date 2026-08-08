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

our $default_extension = "html";

print STDERR "LIBDIR=[$main::LIBDIR]\n";
do &mapfile("$main::LIBDIR/reconstitute_html.pl");

sub main::records_to_type
    {
    return &generate_html( @_ );
    }
1;
