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

our $default_extension = "json";

#########################################################################
#	Return records JSON format.					#
#########################################################################
sub main::records_to_type
    {
    my( $argp, @keys_to_dump ) = @_;
    my @fields =
	($argp->{fields} ? split(/$SEP{FIELD}/,$argp->{fields}) : @field_names);
    my @pieces = ();
    my $keysep = "{\n\"";
    foreach $key_to_dump ( @keys_to_dump )
        {
	push( @pieces, $keysep, $key_to_dump, "\":\t{\n" );
	my $fieldsep = "\t\"";
	foreach my $fld ( @fields )
	    {
	    $_ = &DBFcache($key_to_dump,$fld);
	    push( @pieces, $fieldsep, $fld, "\":\t\"", $_, "\"" );
	    $fieldsep = ",\n\t\"";
	    }
	push( @pieces, "\n\t}" );
	$keysep = ",\n\"";
	}
    push( @pieces, "\n}\n" );
    return join("",@pieces);
    }
1;
