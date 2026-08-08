#!/usr/bin/perl -w
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

use strict;

my $PROG = $0;
$PROG =~ s+.*/++g;

sub usage
    {
    print STDERR <<EOF;
$_[0]

Usage:  $PROG <phone_number>
EOF
    exit(1);
    }

&usage("Invalid arguments")
    if( scalar(@ARGV) != 1 || $ARGV[0] !~ /^(\d\d\d)-(\d\d\d)-(\d\d\d\d)$/ );

my( $area_code, $exchange, $num_in_exchange ) = ( $1, $2, $3 );

my $url = "http://www.fonefinder.net/findome.php?npa=$area_code&nxx=$exchange&thoublock=$num_in_exchange&usaquerytype=Search+by+Number";

open( INF, "wget -q -O - '$url' |" ) || die("Cannot wget ${url}:  $!");

my $errstat = 1;
while( $errstat && defined($_ = <INF>) )
    {
    #print "Processing [$_]\n";
    if( m=<TR><TD><A[^>]*>$area_code</A><TD><A[^>]*>$exchange<TD><A[^>]*>([^<]*)<TD><A[^>]*>([^<]*)</A><TD>(.*?)<TD>(.*?)<TD>= )
        {
	my( $town, $state, $full_carrier, $carrier_type ) = ( $1, $2, $3 );
	my $carrier =
	    ( ( $full_carrier =~ m~<A[^>]*>(.*)</A>~ )
	    ? $1
	    : $full_carrier
	    );
	print "Carrier [$carrier] type in $town, $state.\n";
	$errstat = 0;
	}
    }
close( INF );

exit($errstat);
