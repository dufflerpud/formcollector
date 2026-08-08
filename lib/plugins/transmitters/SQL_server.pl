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
    return grep( &inlist($_,"SQL"), &legal_dumpers() );
    }

#########################################################################
#	Send SQL to some SQL server.					#
#########################################################################
sub main::send_records
    {
    my( $dumper_type, $dest, $subj, $fields, @keys_to_dump ) = @_;
    my( $prot, $dbname, $host, $user, $password );
    my $msg = &records_to_type({
    	"transmitter"=>"fax",
	"fields"=>$fields,
	"dest"=>$dest,
	"subj"=>$subj,
	"colorind"=>"gray"
	},@keys_to_dump);
    my $formatted_data = &cpi_file::tempfile(".$default_extension");
    &cpi_file::write_file( $formatted_data, $msg );

    $_ = $dest;
    if( m=^(\w*sql):(.*)= )
	{ ( $prot, $_ ) = ($1, $2); }
    else
	{ $prot = "mysql"; }
    if( ! m=^//(.*?)$= )
	{ ( $host, $dbname ) = ( "localhost", $1 ); }
    elsif( m=^//(.*?)/(.*)$= )
	{
	( $_, $dbname ) = ( $1, $2 );
	if( ! m=^(.*)@(.*?)$= )
	    { $host = $_; }
	else
	    {
	    ( $_, $host ) = ( $1, $2 );
	    if( ! /^(.*?):(.*)$/ )
		{ $user = $_; }
	    else
		{ ( $user, $password ) = ( $1, $2 ); }
	    }
	}

    return "<ul><li>$dest XL(in incorrect format)</ul>"
        if( ! $host );

    my $cmd = ( $prot ? $prot : "mysql" );
    $cmd .= " --database='$dbname'"	if( $dbname );
    $cmd .= " --host='$host'"		if( $host && $host ne "localhost" );
    $cmd .= " --user='$user'"		if( $user );
    $cmd .= " --password='$password'"	if( $password );
    print STDERR "CMD [$cmd]\n";
    open( INF, "$cmd < $formatted_data 2>&1 |" )
        || &cpi_file::fatal("Cannot attach to user $user on SQL server for ${dbname}:  $!");
    my( @msgs ) = <INF>;
    close( INF );

    push( @msgs, "$default_extension XL(data sent to local server)" ) if( ! @msgs );

    return "<ul><li>" . join("<li>",@msgs) . "</ul>";
    }

1;
