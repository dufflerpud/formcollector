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
    return grep( &inlist($_,"text","HTML","Report"), &legal_dumpers() );
    }

#########################################################################
#	Send it off to the local printer.				#
#########################################################################
sub main::send_records
    {
    my( $dumper_type, $dest, $subj, $fields, @keys_to_dump ) = @_;
    if( ! defined($dest) )
        { $dest = ""; }
    elsif( $dest ne "" )
        { $dest = " -P$dest"; }
    my $msg = &records_to_type({
        "transmitter_type"=>"print",
	"dumper_type"=>$dumper_type,
	"fields"=>$fields,
	"dest"=>$dest,
	"subj"=>$subj,
	"colorind"=>"color"
	},@keys_to_dump);
    my $formatted_data = &cpi_file::tempfile(".$default_extension");
    my $cmd = "lpr$dest";
    #$cmd = "dd of=/tmp/toprint";
    &cpi_file::write_file( $formatted_data, $msg );
    if( $default_extension eq "html" )
        #{ system_cmd( "$cpi_vars::HTML2PS -d --colour $formatted_data | $cmd" ); }
        { system_cmd( "$cpi_vars::HTML2PDF -q $formatted_data - | $cmd" ); }
    elsif( $default_extension eq "txt" )
        { system_cmd( "$cmd < $formatted_data" ); }
    return "<ul>" .
	( $dest ? "<li>XL(Printing to) $dest" : "<li>XL(Printing)" ) .
	"</ul>";
    }
1;
