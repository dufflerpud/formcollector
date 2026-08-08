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

our $default_extension = "xml";

#########################################################################
#	Return records in XML format.					#
#########################################################################
sub main::records_to_type
    {
    my( $argp, @keys_to_dump ) = @_;
    my @fields =
	($argp->{fields} ? split(/$SEP{FIELD}/,$argp->{fields}) : @field_names);
    my @pieces = ( "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n" );
    foreach $key_to_dump ( @keys_to_dump )
        {
	push( @pieces, "<$cpi_vars::PROG>\n" );
	foreach my $fld ( @fields )
	    {
	    $_ = &DBFcache($key_to_dump,$fld);
	    push( @pieces, "\t<", $fld, ">", $_ , "</", $fld, ">\n" );
	    }
	push( @pieces, "</$cpi_vars::PROG>\n" );
	}
    return join("",@pieces);
    }
1;
