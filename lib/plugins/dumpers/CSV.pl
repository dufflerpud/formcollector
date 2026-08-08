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

our $default_extension = "csv";

my $FIELD_SEPARATOR=",";	# In true CSV, this is always a comma
my $RECORD_TERMINATOR="\n";	# and this is always a new line.
				# However, we don't want to hard code
				# this because there may be variants
				# and I'd rather not duplicate the code.
my $ESCAPE="\\";		# CSV doesn't know how to handle escape
				# chars, but it is an easy extension.

#########################################################################
#	Return records CSV format.					#
#########################################################################
sub main::records_to_type
    {
    my( $argp, @keys_to_dump ) = @_;
    my @fields =
	($argp->{fields} ? split(/$SEP{FIELD}/,$argp->{fields}) : @field_names);
    my @pieces = join( $FIELD_SEPARATOR, @fields );
    push( @pieces, $RECORD_TERMINATOR );
    foreach $key_to_dump ( @keys_to_dump )
        {
	my $field_count = 0;
	foreach my $fld ( @fields )
	    {
	    $_ = &DBFcache($key_to_dump,$fld);
	    foreach my $char_to_escape
		( $ESCAPE, $FIELD_SEPARATOR, $RECORD_TERMINATOR )
		{
		if( $char_to_escape eq "\\" )
		    { s+\\+$ESCAPE$char_to_escape+gs; }
		else
		    { s+$char_to_escape+$ESCAPE$char_to_escape+gs; }
		}
	    push( @pieces, $FIELD_SEPARATOR ) if( $field_count++ );
	    push( @pieces, $_ );
	    }
	push( @pieces, $RECORD_TERMINATOR );
	}
    return join("",@pieces);
    }
1;
