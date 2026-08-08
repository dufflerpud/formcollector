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

# Based on http://www.cs.tut.fi/~jkorpela/ftpurl.html which says that
# the basic format of an FTP URL is
#	ftp://user:password@host:port/path 

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
    my $user;
    my $pass;
    my $host;
    my $port;
    my $path;
    my $type;

    &cpi_file::fatal("$dest is an illegal ftp URL")
	if( $dest !~ m+^ftp://(.*)$+ );
    $host = $1;
    if( $host=~/^(.*);type=([aid])$/ )	{ $host = $1;	$type = $2;	}
    if( $host=~/^(.*?)\/(.*)$/ )	{ $host = $1;	$path = $2;	}
    if( $host=~/^(.*):([^@]*)$/ )	{ $host = $1;	$port = $2;	}
    if( $host=~/^([^:@]*)(.*?@.*?)$/ )	{ $host = $2;	$user = $1;	}
    if( $host=~/:(.*)@(.*)/ )		{ $host = $2;	$pass = $1;	}
    if( $host=~/@(.*)/ )		{ $host = $1;			}
    my $msg = &records_to_type( { "fields"=>$fields }, @keys_to_dump );
    my $file_to_send = &cpi_file::tempfile();
    &cpi_file::write_file( $file_to_send, &records_to_type( {}, @keys_to_dump ) );
    my $cmdfile = &cpi_file::tempfile();
    open( OUT, "> $cmdfile" ) || &cpi_file::fatal("Cannot write ${cmdfile}:  $!");
    print OUT "open $host", (defined($port)?" $port":""), "\n";
    print OUT "user $user", (defined($pass)?" $pass":""), "\n"
	if(defined($user));
    if( $type eq "b" )
        { print OUT "binary\n"; }
    elsif( $type eq "a" )
        { print OUT "ascii\n"; }
    print OUT "put $file_to_send $path\n";
    close( OUT );
    my @outlines;
    open( INF, "ftp -n < $cmdfile |" ) ||
        &cpi_file::fatal("Cannot invoke ftp for ${dest}:  $!");
    push( @outlines, "<li>", $_ ) while( $_ = <INF> );
    close( INF );
    return join("","Output from \"ftp -n $host\" was:<ul>",@outlines,"</ul>");
    }

1;
