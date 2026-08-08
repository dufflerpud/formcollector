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

use MIME::Lite;
use strict;

my $SRC="c.m.caldwell\@alumni.unh.edu";
my $Status="New";
my $SENDMAIL="/usr/lib/sendmail";
my $MSG_FILE="/tmp/mime_message";
my $Project;
my $dest;
my $over_dest;

while( @ARGV )
    {
    $_ = shift( @ARGV );
    if( /@/ )
        { $over_dest = $_; }
    else
        { $Project = $_; }
    }

if( ! $Project )
    {
    print STDERR "Project not specified.\n";
    exit(1);
    }

my $URL = "http://www.brightsands.com/~chris/formcollector.cgi"
.   "?user=chris&password=ratcatcher"
.   "&form_type=Brightsands_timeclock"
.   "&thisrep=Invoice"
.   "&l4_Status=$Status&l4_Project=$Project"
.   "&show_Type_of_work=checked"
.   "&show_Comments=checked"
.   "&show_Billable_time=checked"
.   "&show_Cost=checked"
.   "&transmit_info=HTML-SEP1-browser&func=report";

my( @lines );
open( INF, "wget -q -O - '$URL' |" ) || die("Cannot wget:  $!");
while( $_ = <INF> )
    {
    last if( /width=50%/ );
    }
while( $_ = <INF> )
    {
    last if( / records* found/ );
    s/<input[^>]*>//g;
    s/<td/<td style='padding:3px'/g;
    s/<th/<th style='padding:3px'/g;
    s+<table frame=border+<table border=1><tr><th><table+;
    s+</td></tr></table>+</td></tr></table></th></tr></table>+;
    if( ! /^([^ ]*@[^ ]*)<br>$/ )
	{ push( @lines, $_ ); }
    else
        {
	#if( ! $dest )
	    {
	    $dest = $1;
	    chomp( $dest );
	    }
	}
    }
while( $_ = <INF> ) {}
close( INF );

if( ! @lines )
    {
    print STDERR "No work for invoice of $Project with status $Status.\n";
    exit(1);
    }

$dest = $over_dest if( $over_dest );

my $mime_msg = MIME::Lite->new
    ( 
    From	=> $SRC,
    To		=> $dest,
    Subject	=> "$Project invoice",
    Type	=> 'multipart/mixed',
    ) || die("Cannot setup mime:  $!");

my $head = <<EOF;
<html><head>
<STYLE TYPE='text/css'><!--
table	{
	border-width: 5px;
	border-spacing:	5px;
	border-padding:	5px;
	border-type: solid;
	}
--></STYLE>
</head><body>
<table cellspacing=3><tr><td width=50%></td><td width=50%>
EOF

$mime_msg->attach
    (
    Type	=> "text/html",
    Data	=> join("",$head,@lines,"</body></html>")
    ) || die("Cannot attach to mime message:  $!");

if( $MSG_FILE )
    {
    open( OUT, "> $MSG_FILE" ) || die("Cannot write $MSG_FILE:  $!");
    print OUT $mime_msg->as_string;
    close( OUT );
    }
open( OUT, "| $SENDMAIL -t -f $SRC 2>&1" ) || die("Cannot run $SENDMAIL:  $!");
print OUT $mime_msg->as_string;
close( OUT );

exit(0);
