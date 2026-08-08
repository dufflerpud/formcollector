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

use lib "/usr/local/lib/perl";
use cpi_send_file qw( sendfax );

#########################################################################
#	Return a list of dumpers that this transmitter can handle.	#
#########################################################################
sub main::transmitters_dumpers
    {
    return grep( &inlist($_,"HTML","Report","text"), &legal_dumpers() );
    }

#########################################################################
#	Create a fax from the form.					#
#########################################################################
sub main::send_records
    {
    my( $dumper_type, $dest, $subj, $fields, @keys_to_dump ) = @_;
    my $msg = &records_to_type({
    	"transmitter"=>"fax",
	"fields"=>$fields,
	"dest"=>$dest,
	"subj"=>$subj,
	"colorind"=>"gray"
	},@keys_to_dump);
    my $formatted_data = &cpi_file::tempfile(".$default_extension");
    &cpi_file::write_file( $formatted_data, $msg );
    if( $default_extension eq "html" )
	{
	#system_cmd( "$cpi_vars::HTML2PS --colour $formatted_data | $cpi_vars::PS2PDF - - > $formatted_data.pdf" );
	system_cmd( "$cpi_vars::HTML2PDF -q $formatted_data $formatted_data.pdf" );
	}
    elsif( $default_extension eq "txt" )
        {
	system_cmd( "enscript -p - $formatted_data | $cpi_vars::PS2PDF - - > $formatted_data.pdf" );
	}
    else
        {
	&cpi_file::fatal("Do not know how to fax a $default_extesion file.");
	}
    &cpi_send_file::sendfax( $dest, undef, "$formatted_data.pdf" );
    return "<ul><li>XL(Sending to) $dest</ul>";
    }

1;
