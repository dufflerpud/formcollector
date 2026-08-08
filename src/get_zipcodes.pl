#!/usr/bin/perl -w

#########################################################################
#	get_zipcodes	Script to retrieve city/town and state		#
#			information for every possible 5 digit zip	#
#			code.  Takes about 20 hours to run, since it	#
#			gets them one entry at a time (therefore this	#
#			program issues 100000 wget's to the US post	#
#			office.						#
#									#
#			Result is used by conference.cgi to allow the	#
#			user to only specify the zipcode (rather than	#
#			typing in city and state), and to verify that	#
#			the user is typing in a legal (known) code.	#
#									#
#			City/towns come from the post office as upper-	#
#			case only, but are stored with only the first	#
#			character of each word capitalized.		#
#########################################################################

use strict;

my $USPS_LOOKUP="http://zip4.usps.com/zip4/zcl_3_results.jsp?zip5=%05d";

my $PROG=$0;
$PROG =~ s+.*/++;
$PROG =~ s+\.[^\.]*$++;
my $RETRY_MAX = 600;
my $TMPFILE = "/tmp/$PROG.$$";
$| = 1;

#########################################################################
#	Print an error message and usage message and exit.		#
#########################################################################
sub usage
    {
    print <<EOF;
$_[0]

Usage:	$PROG -a
	Get city/town state information for all zip codes.
	(Equivalent to "$PROG 00000..99999")

Usage:  $PROG nnnnn
	Get city/town state information for specified zip code

Usage:  $PROG mmmmm..nnnnn
	Get city/town state information for zip codes in specified list

Usage:  $PROG -t
	Get a small chunk of zips just to verify code is working.

Examples:
	$PROG 01108 03820..03822 03824  # Print info for 5 zipcodes
	$PROG -a                        # Print all zipcodes

Note:
	We don't use zzzzz-zzzzz to indicate a range because 9 digit
	zipcodes have a dash in them.  This program currently doesn't
	know about anything other than 5 digit zipcodes, but we might
	as well not get into any bad habits.
EOF
    exit(1);
    }

#########################################################################
#	Return number of seconds in a humanly readable form.		#
#########################################################################
sub pretty_seconds
    {
    my( $duration ) = @_;
    return "1 second"					if( $duration == 1 );
    return "$duration seconds"				if( $duration < 60 );
    return sprintf("%d:%02d",$duration/60,$duration%60)	if( $duration < 3600 );
    return sprintf("%d:%02d:%02d",
        $duration/3600, ($duration/60)%60, $duration%60 );
    }

#########################################################################
#	Print an event with a time stamp.				#
#########################################################################
sub event
    {
    my( $txt ) = @_;
    my( $now ) = `date '+%D %T'`;
    chomp($now);
    print STDERR "${now}:  $txt.\n";
    print "# ${now}:  $txt.\n";
    }

#########################################################################
#	Main								#
#########################################################################
#	Process arguments
my @ziplist;
while ( $_ = shift(@ARGV) )
    {
    if( $_ eq "-a" )
        { @ziplist = 0 .. 99999; }
    elsif( /^0*(\d+?)$/ )
        { push( @ziplist, $1 ); }
    elsif( /^0*(\d+?)\.+0*(\d+?)$/ )
        { push( @ziplist, $1 .. $2 ); }
    elsif( $_ eq "-t" )
        { push( @ziplist, 2490 .. 2495 ); }
    else
        { usage("Unknown argument \"$_\"."); }
    }

&usage("No zip codes specified") if( ! @ziplist );

my $totaltime = time();

my @ziptodo = @ziplist;
my %cityof;
#my $seenind = 0;

for( my $iter=0; @ziptodo; $iter++ )
    {
    &event("Generating list of " . scalar(@ziptodo) . " URLs");
    my $urlfile = "$TMPFILE.$iter.urls";
    open( OUT, ">$urlfile" ) || die("Cannot write ${urlfile}:  $!");
    foreach my $z ( @ziptodo )
        { printf OUT ( "$USPS_LOOKUP\n", $z ); }
    close( OUT );

    my $wgettime;
    my $retry = 2;
    while( 1 )
        {
	&event("Wget'ing URLs");
	$wgettime = time();
	my $res = open(INF,"wget --no-cache -t 1 -q -i $urlfile -O - |")
	    || die("Cannot wget ${urlfile}:  $!");
	$wgettime = time() - $wgettime;
	last if( $res );
	&event("Failed after "
	    . &pretty_seconds($wgettime)
	    . ", retrying in "
	    . &pretty_seconds($retry) );
	sleep( $retry );
	$retry = $RETRY_MAX if( ($retry *= 2) > $RETRY_MAX );
	}

    &event("Scanning after ".&pretty_seconds($wgettime));
    my $scantime = time();
    my $curzip = "XXXXX";
    while( $_ = <INF> )
        {
	my $found;
	if( m#<input tabindex="1" value="(\d\d\d\d\d)" id="zip5"# )
	    { $cityof{$found=$1} = "UNKNOWN"; }
	elsif( m#<span class="main">(\d\d\d\d\d)</span># )
	    { $curzip = $1; }
	elsif( $cityof{$curzip} )
	    { next; }
	elsif( m#<b>(.*), (.*)</b># )
	    {
	    $cityof{$found=$curzip} =
		join(" ", map( ucfirst(lc($_)), split(/\s/,$1))).", $2";
	    }
	elsif( m# padding:5px 10px;" headers="pre">(.*?), (.*?)</td># )
	    {
	    $cityof{$found=$curzip} =
		join(" ", map( ucfirst(lc($_)), split(/\s/,$1))).", $2";
	    }
	if( defined($found) )
	    {
# This commented out logic would make sure that the zipcodes come out in
# order - which we don't need.  However, if a particular zip fails, we
# process the rest in the stream and then go back and get just the ones
# that fail - and if we're printing things out in order, that makes a huge
# delay.  Since we don't need it and its better to see thing progress,
# this is disabled.
#	    my $count = 0;
#	    while( $seenind < scalar(@ziptodo) )
#	        {
#		my $ztext = sprintf("%05d",$ziptodo[$seenind]);
#		last if( ! $cityof{$ztext} );
#		print "$cityof{$ztext} $ztext\n";
#		    #if( $cityof{$ztext} ne "UNKNOWN" );
#		$seenind++;
#		$count++;
#		}
#	    print "$cityof{$found} $found\n" if( $count == 0 );
	    print "$cityof{$found} $found\n" if( $cityof{$found} ne "UNKNOWN" );
	    }
	}
    close( INF );

    my @zipleft = ();
    foreach $_ ( @ziptodo )
        {
	push(@zipleft,$_) if( ! $cityof{ sprintf("%05d",$_) } );
	}
    my $numleft = scalar(@ziptodo) - scalar(@zipleft);
    $scantime = time() - $scantime;
    &event("Scanning found $numleft in " . &pretty_seconds( $scantime ) );
    @ziptodo = @zipleft;
    }

system("rm -f $TMPFILE.*");
$totaltime = time() - $totaltime;
&event("Complete in ".&pretty_seconds($totaltime));
exit(0);
