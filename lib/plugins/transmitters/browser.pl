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

#########################################################################
#	Return a list of dumpers that this transmitter can handle.	#
#########################################################################
sub main::transmitters_dumpers
    {
    return &legal_dumpers();
    }

#########################################################################
#	Send it off!							#
#########################################################################
sub main::send_records
    {
    my( $dumper_type, $dest, $subj, $fields, @keys_to_dump ) = @_;
    if( ! defined($dest) || $dest eq "" )
        { $dest = $cpi_vars::PROG; }
    print	"Content-type:  text/plain\n",
		"Content-disposition:  attachment; filename=$form_type.$default_extension\n\n",
		&records_to_type( {"fields"=>$fields}, @keys_to_dump );
    &cpi_file::cleanup(0);
    }

1;
