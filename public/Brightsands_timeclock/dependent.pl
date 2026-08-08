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

my $SECONDS_PER_DAY = 86400;

my @TBLFIELDS=
    ("Worker","Project","Type_of_work","Comments",
    "Actual_time","Billable_time","Cost","Status");

my $DEFAULT_RATE		= 15.00;
my %PROJECT_INFO =
    (
    "Linear_Air_Software" =>
        {
	"Rate"		=>	125.00,
	"Name"		=>	"Linear Air",
	"Contact"	=>	"Billing c/o Peter Schmidt",
	"Address"	=>	"P.O. Box 589<br>Concord, MA 01742",
	"Salutation"	=>	"Mr. Schmidt",
	"Email"		=>	"c.m.caldwell\@alumni.unh.edu"
	},
    "Test_project" =>
        {
	"Rate"		=>	125.00,
	"Name"		=>	"Test",
	"Contact"	=>	"Joe Tester",
	"Address"	=>	"P.O. Box 783<br>Bailey Island, ME 04003",
	"Salutation"	=>	"Joe",
	"Email"		=>	"c.m.caldwell\@alumni.unh.edu"
	},
    "Dustin" =>
        {
	"Rate"		=>	0.00,
	"Name"		=>	"Sweetser",
	"Contact"	=>	"Susan Hawthorne, Mary Kunhardt",
	"Address"	=>	"329 Bath Road, Suite One<br>Brunswick, ME 04011",
	"Salutation"	=>	"Ms. Hawthorne and Ms. Kunhardt",
	"Email"		=>	"SHawthorne\@sweetser.org,MKunhardt\@sweetser.org"
	#"Email"	=>	"c.m.caldwell\@alumni.unh.edu"
	},
    "Baystate_Milling" =>
        {
	"Rate"		=>	120.00,
	"Name"		=>	"Baystate",
	"Contact"	=>	"Kim Yaworsky",
	"Address"	=>	"100 Congress Street<br>Quincy, MA 02169",
	"Salutation"	=>	"Mr. Yaworsky",
	"Email"		=>	"kimy\@bsm.com"
	#"Email"		=>	"c.m.caldwell\@alumni.unh.edu"
	}
    );

#sub hard_coded_report {}
#sub faux_field {}

my $start_at;
my $stop_at;

# print scalar(localtime( &COMMON::parsedate( join(" ",@ARGV) ) ) ), "\n";

my %key_starts	= ();
my %key_times	= ();
my %keys_on_day	= ();

#########################################################################
#	Display the items found by a search.				#
#########################################################################
sub setup_time_report()
    {
    my $earliest;
    my $latest = 0;
    foreach my $key ( @_ )
        {
	my $startdt = &DBFcache($key,"Started_working");
	if( $startdt =~ m=(\d+/\d+/\d+)= )
	    {
	    my $ind	= $1;
	    my $start	= &COMMON::parsedate($startdt);
	    my $stop	= &COMMON::parsedate(&DBFcache($key,"Stopped_working"));
	    $earliest = $start if( !defined($earliest) || $start < $earliest );
	    $latest = $stop if( $stop > $latest );
	    $key_starts{$key} = $start;
	    $key_times{$key} = $stop - $start;
	    #print "Adding key $key to $ind<br>\n";
	    push( @{$keys_on_day{$ind}}, $key );
	    }
	}
    $earliest = &COMMON::parsedate($constraints{$thisrep}{"Search_from"})
	if( $constraints{$thisrep}{"Search_from"} );
    $latest = &COMMON::parsedate($constraints{$thisrep}{"Search_to"})
	if( $constraints{$thisrep}{"Search_to"} );
#    my $a = localtime( $earliest );
#    my $b = localtime( $latest );
#    print "setup_time_report returns $a to $b<br>\n";
    return ( $earliest, $latest )
    }

#########################################################################
#	If we intercept this command, we need to return true.		#
#########################################################################
sub form_command
    {
    my( $cmd ) = @_;
    return 0;
    }

#########################################################################
#	Turn seconds into colon notation.				#
#########################################################################
sub printable_time
    {
    my( $left ) = @_;
    my $seconds	= $left % 60;	$left = int( $left / 60 );
    my $minutes	= $left % 60;	$left = int( $left / 60 );
    my $hours	= $left % 24;	$left = int( $left / 24 );
    my $days	= $left;
    if( $days )
	{ return sprintf("%d+%02d:%02d",$days,$hours,$minutes); }
    elsif( $hours )
	{ return sprintf("%02d:%02d",$hours,$minutes); }
    else
	{ return sprintf("%02d",$minutes); }
    }

#########################################################################
#	Only deals with dollars for now.				#
#########################################################################
sub printable_money
    {
    my( $dollars ) = @_;
    return sprintf("\$%.2f",$dollars);
    }

#########################################################################
#	Figure out how much time to bill according to minimum billable	#
#	increment for the project/person.				#
#########################################################################
sub billing_increment
    {
    my( $key )			= @_;
    my $seconds			= $key_times{$key};
    my $Worker			= &DBFcache($key,"Worker");
    my $Project			= &DBFcache($key,"Project");
    my $Type_of_work		= &DBFcache($key,"Type_of_work");
    my $policy			= ($Type_of_work eq "UB" ? 1 : "240,15");
    $policy = 15 if( $Type_of_work eq "NR" || $Type_of_work eq "ER" );
    my( @rest_of_policy )	= map { 60*$_ } split(/,/,$policy);
    my $accumulated		= 0;
    my $increment		= 1;
    while( $seconds > 0 )
        {
	$increment = shift(@rest_of_policy) if( @rest_of_policy );
	$accumulated += $increment;
	$seconds -= $increment;
	}
    return $accumulated;
    }

#########################################################################
#	Figure out cost of specified time for project.			#
#########################################################################
sub cost_of
    {
    my( $key ) = @_;
    my $Project = &DBFcache($key,"Project");
    my $rate = $DEFAULT_RATE;
    my $Type_of_work = &DBFcache($key,"Type_of_work");
    my $seconds = &billing_increment( $key );
    if( $PROJECT_INFO{$Project} )
	{
	if( defined( $PROJECT_INFO{$Project}{$Type_of_work} ) )
	    { $rate = $PROJECT_INFO{$Project}{$Type_of_work}; }
	elsif( $Type_of_work eq "UB" )
	    { $rate = 0.00; }
	elsif( defined( $PROJECT_INFO{$Project}{Rate} ) )
	    { $rate = $PROJECT_INFO{$Project}{Rate}; }
	}
    elsif( $Type_of_work eq "UB" )
	{ $rate = 0.00; }
    return $seconds * $rate / ( 3600 );
    }

#########################################################################
#	Return printable version of key and field.			#
#########################################################################
sub printable
    {
    my( $key, $field ) = @_;
    my $res = &DBFcache(@_);
    $res =
        ( &inlist($field,"Worker","Project","Type_of_work","Status")
	? &token_to_text( $res )
	: $res
	);
    $res =~ s:[\r\n]+:<br>:gs;
    return $res;
    }

#########################################################################
#	Print a calendar						#
#########################################################################
sub calendar
    {
    my( $need_header, $fieldp, @klist ) = @_;
    &setup_time_report(@klist);
    #my( $start_at, $stop_at ) = &setup_time_report(@klist);

    my $s = "<input type=hidden name=key><table border=1><tr>" .
        join( "", map { "<th>XL(${_}day)</th>" }
	    ("Sun","Mon","Tues","Wednes","Thurs","Fri","Satur") );
    
    my($csec,$cmin,$chour,$cmday,$cmonth,$cyear,$wday) = localtime($start_at);
    my $firstmonth = &COMMON::revlocaltime($csec,$cmin,$chour,1,$cmonth,$cyear);
    ($csec,$cmin,$chour,$cmday,$cmonth,$cyear,$wday) = localtime($firstmonth);
    my $timeind = $firstmonth - $SECONDS_PER_DAY*$wday;
    ($csec,$cmin,$chour,$cmday,$cmonth,$cyear,$wday) = localtime($timeind);

    my $check_year;
    my $check_month;
    do  {
	$s .= "</tr>\n<tr>" if( $wday==0 );
	$s .= "<td valign=top><b>"
	    . "<a href='javascript:window.document.$FORM_NAME.func.value"
	    . "=\"new\";window.document.$FORM_NAME.submit();'>";
	my $dateind = sprintf("%02d/%02d/%04d",$cmonth+1,$cmday,$cyear+1900);
	$s.=( ( $cmonth==$check_month && $cyear==$check_year )
	    ? sprintf("%02d",$cmday)
	    : $dateind );
	$s .= "</a></b>";
	if( $keys_on_day{$dateind} )
	    {
	    foreach my $key ( @{$keys_on_day{$dateind}} )
	        {
		my @toprint = ();
		foreach my $fld ( @TBLFIELDS )
		    {
		    push( @toprint, &printable($key,$fld) )
			if( $showing{$thisrep}{$fld} );
		    }
		$s .= "<br>"
		    . "<a href='javascript:window.document.$FORM_NAME.key.value"
		    . "=$key;window.document.$FORM_NAME.submit();'>"
		    . join(" ",@toprint) . "</a>";
		}
	    }
	$s .= "</td>";
	$timeind += $SECONDS_PER_DAY;
	$check_year = $cyear;
	$check_month = $cmonth;
	($csec,$cmin,$chour,$cmday,$cmonth,$cyear,$wday) = localtime($timeind);
	} while( $timeind<=$stop_at || $cmonth==$check_month );
    $s .= "</tr></table>\n";
    return $s;
    }

#########################################################################
#	Print out a list of entries as a straight table.		#
#########################################################################
sub time_table
    {
    my( $need_header, $fieldp, @klist ) = @_;
    #my( $start_at, $stop_at ) = &setup_time_report( @klist );

    my $timeind = $start_at;

    my $total_Actual_time = 0;
    my $total_Billable_time = 0;
    my $total_Cost = 0;

    my %TDARGS = map { $_, "" } @TBLFIELDS;
    grep( $TDARGS{$_}=" align=right", "Actual_time","Billable_time","Cost");

    my $s = "<input type=hidden name=key><table frame=border><tr>";
    $s .= "<th>XL(Date)</th>";

    foreach my $fld ( @TBLFIELDS )
        {
	$s .= "<th$TDARGS{$fld}>XL(" . &token_to_text($fld) . ")</th>"
	    if( $showing{$thisrep}{$fld} );
	}
    my($nsec,$nmin,$nhour,$nmday,$nmonth,$nyear) = localtime($stop_at);
    my $endind = sprintf("%02d/%02d/%04d",$nmonth+1,$nmday,$nyear+1900);
    my $dateind;
    do  {
        my($nsec,$nmin,$nhour,$nmday,$nmonth,$nyear) = localtime($timeind);
	$dateind = sprintf("%02d/%02d/%04d",$nmonth+1,$nmday,$nyear+1900);
	if( $keys_on_day{$dateind} )
	    {
	    foreach my $key ( @{$keys_on_day{$dateind}} )
		{
		$s .= "</tr>\n<tr><td valign=top><input type=button value=' '"
		    . " onClick='window.document.$FORM_NAME.key.value=$key;"
		    . "window.document.$FORM_NAME.submit();'>"
		    . $dateind . "</td>";
		foreach my $fld ( @TBLFIELDS )
		    {
		    $s .= "<td valign=top$TDARGS{$fld}>" . &printable($key,$fld) . "</td>"
			if( $showing{$thisrep}{$fld} );
		    }
		$total_Actual_time += $key_times{$key};
		$total_Billable_time += &billing_increment( $key );
		$total_Cost += &cost_of( $key );
		}
	    }
	$timeind += $SECONDS_PER_DAY;
	} while( $dateind ne $endind );
    $s .= "</tr>\n<tr><td></td>";
    foreach my $fld ( @TBLFIELDS )
        {
	if( $showing{$thisrep}{$fld} )
	    {
	    $s .= "<td$TDARGS{$fld}>";
	    if( $fld eq "Actual_time" )
	        { $s .= &printable_time($total_Actual_time); }
	    elsif( $fld eq "Billable_time" )
	        { $s .= &printable_time($total_Billable_time); }
	    elsif( $fld eq "Cost" )
	        { $s .= &printable_money($total_Cost); }
	    $s .= "</td>"
	    }
	}
    $s .= "</tr></table>";
    return $s;
    }

#########################################################################
#	Return an invoice						#
#########################################################################
sub invoice
    {
    my( $need_header, $fieldp, @klist ) = @_;
    my $timetable_string = &time_table( $need_header, $fieldp, @klist );
    my $invoice_total =
	( $timetable_string =~ /.*[^\d](\d+\.\d\d)[^\d]*$/s
	? $1 : 0 );
    my $what_to_do =
	( $invoice_total =~ /^[0\.]*$/
	? "No action is required, but any inquiries can be sent to:"
	: "Please pay \$$invoice_total to:"
	);
    my $Project = &DBFcache($klist[0],"Project");
    my $date_string= `date +'%B %d, %Y'`;
    my $s = <<EOF;
<table><tr><td width=50%></td><td width=50%>
Christopher Caldwell<br>
P.O. Box 783<br>
Bailey Island, ME 04003<p>
(207)319-7496<br>
c.m.caldwell\@alumni.unh.edu<br>
<br>
$date_string</td></tr><tr><td colspan=2>
$PROJECT_INFO{$Project}{Contact}<br>
$PROJECT_INFO{$Project}{Name}<br>
$PROJECT_INFO{$Project}{Address}<br>
$PROJECT_INFO{$Project}{Email}<br>
<br>
Dear $PROJECT_INFO{$Project}{Salutation},<br>
<p>
I have performed the following consulting services on behalf of $PROJECT_INFO{$Project}{Name}:<p>
$timetable_string
<p>$what_to_do
</td></tr>
<tr><td></td><td>
Christopher Caldwell<br>
P.O. Box 783<br>
Bailey Island, ME 04003</td></tr>
<tr><td colspan=2> 
&nbsp;<p>
If you have any questions, please call me at 207-319-7496.<br>
<p>Sincerely,
<p>&nbsp;<p>
Christopher Caldwell
</td></tr></table>
EOF
    return $s;
    }

#########################################################################
#	Return a list of keys matching the current constraints.		#
#########################################################################
sub dependent_search
    {
    my @useful_fields = keys %{$constraints{$thisrep}};
    my %seen_ctr = ();
    my $num_fields_that_must_match = 0;
    my @list_to_check = &DBFget($ALL_KEYS);
    if( !&has_privilege("View_instances_of_form") )
        {
	$num_fields_that_must_match++;
	grep( /\d/ && $seen_ctr{$_}++,
	    &COMMON::dbget($COMMON::DB,"users",$COMMON::USER,
	        $form_type,"privs"));
	}
    foreach my $fld ( @useful_fields )
        {
	my $cv = $constraints{$thisrep}{$fld};
	if( defined($cv) && $cv ne "*" )
	    {
	    $num_fields_that_must_match++;
	    grep( $seen_ctr{$_}++, &DBFget($KEYS_WITH_FIELD_VALUE,$fld,$cv) );
	    }
	}
    my @ret = grep(($seen_ctr{$_}||0)==$num_fields_that_must_match,@list_to_check);
    ( $start_at, $stop_at ) = &setup_time_report( @ret );
    return @ret;
    }

#########################################################################
#	Return text for search selection.				#
#########################################################################
sub dependent_selector
    {
    my $s = <<EOF;
    <table $COMMON::TABLE_TAGS border=4>
    <tr><th colspan=3>Timeclock selector</th></tr>
<tr><th>XL(Field)</th><th>XL(Show)</th><th>XL(Search constraint)</th></tr>
EOF
    #foreach my $fld ( @aggregated_field_names, @faux_fields )
    foreach my $fld ( @TBLFIELDS )
        {
	my @values = sort keys %{$aggregated_values{$fld}};
	if( scalar(@values) >= 0 )
	    {
	    my $cv = $constraints{$thisrep}{$fld};
	    $_ = &token_to_text($fld) if( ! defined($_ = $varlabels{$fld}) );
	    $s.="<tr><th align=left>${_}:</th>";
	    $s.="<th><input type=checkbox name=show_$fld";
	    $s.=" checked" if( $showing{$thisrep}{$fld} );
	    $s.="></th><td>";
	    $s .= "<select name=l4_$fld onChange='submit_func();'>";
	    $s.="<option value='*'>* XL(Any) *\n";
	    foreach my $value ( sort @values )
		{
		$s .= "<option value=\"$value\"";
		$s .= " selected" if( defined($cv) && ($value eq $cv) );
		$s .= ">XL(" . sprintf("%.30s",$value) . ")\n";
		}
	    $s .= "</select></td></tr>\n";
	    }
	}
    $s .= "</table>";
    return $s;
    }

#########################################################################
sub actual_time		{ return &printable_time( $key_times{$_[0]} ); }
sub billable_time	{ return &printable_time( &billing_increment($_[0]) ); }
sub cost		{ return &printable_money( &cost_of($_[0]) ); }

#########################################################################
#	Print a usage message for the bill function.			#
#########################################################################
sub bill_usage()
    {
    printf STDERR "Usage:  $PROG form=$form_type bill project\n";
    exit(1);
    }

#########################################################################
#	Helper function for billing and paying.				#
#########################################################################
sub bill_pay_proc()
    {
    my( $search_for_billed_on ) = @_;
    my($sec,$min,$hour,$mday,$month,$year) = localtime(time);
    my $timestr = sprintf("%02d/%02d/%04d %02d:%02d",
        $month+1,$mday,$year+1900,$hour,$min);
    &COMMON::dbwrite( $COMMON::DB );
    my %klist = ();
    my $must_match = 0;
    grep( $klist{$_}++, &DBFget($KEYS_WITH_FIELD_VALUE,"Project",$ARGV[2]) );
    if( ! $search_for_billed_on )
        {
	grep( $klist{$_}++, &DBFget($KEYS_WITH_FIELD_VALUE,"Status","New") );
	$must_match = 2;
	}
    else
        {
	grep( $klist{$_}++, &DBFget($KEYS_WITH_FIELD_VALUE,"Status","Billed") );
	grep( $klist{$_}++,
	    &DBFget($KEYS_WITH_FIELD_VALUE,"Billed_on",$search_for_billed_on) );
	$must_match = 3;
	}
    %form_values_map = ();
    foreach my $k ( keys %klist )
        {
	if( $klist{$k} == $must_match )
	    {
	    if( ! $search_for_billed_on )
		{
		print "Setting $k Billed_on to $timestr.\n";
		&update_key( $k, "Status", "Billed" );
		&update_key( $k, "Billed_on", $timestr );
		}
	    else
		{
		print "Setting $k Paid_on to $timestr.\n";
		&update_key( $k, "Status", "Paid" );
		&update_key( $k, "Paid_on", $timestr );
		}
	    }
	}
    &COMMON::dbclose( $COMMON::DB );
    &COMMON::cleanup(0);
    }

#########################################################################
#	Call the helper for billing.					#
#########################################################################
sub do_bill()
    {
    &bill_usage() if( scalar(@ARGV) != 3 );
    &bill_pay_proc("");
    }

#########################################################################
#	Print a usage message for the paid function.			#
#########################################################################
sub paid_usage()
    {
    printf STDERR "Usage:  $PROG form=$form_type paid project invoice_date\n";
    }

#########################################################################
#	Call the helper for paying.					#
#########################################################################
sub do_paid()
    {
    print "do_paid...\n";
    &paid_usage() if( scalar(@ARGV) != 4 );
    &bill_pay_proc( $ARGV[3] );
    }

#########################################################################
#	Parse the interactive command line and dispatch to appropriate	#
#	handler.							#
#########################################################################
sub interactive
    {
#    for( my $i=1; $i<scalar(@ARGV); $i++ )
#        { print "argv[$i]=\"$ARGV[$i]\".\n"; }
    &do_bill() if( $ARGV[1] && $ARGV[1] eq "bill" );
    &do_paid() if( $ARGV[1] && $ARGV[1] eq "paid" );
    print STDERR "Unknown function.  Must bill 'bill' or 'paid'.\n";
    exit(1);
    }

#sub billable_time
#    {
#    my( $k ) = @_;
#    my $kt = $key_times{$k};
#    my $bi = &billing_increment($k);
#    my $pbi = &printable_time( $bi );
#    print "billable_time $k =&gt; $kt =&gt; $bi =&gt; $pbi.<br>\n";
#    }

&faux_field( "Actual_time",	\&actual_time );
&faux_field( "Billable_time",	\&billable_time );
&faux_field( "Cost",		\&cost );

&hard_coded_report( "Invoice",
       (
       _report_name	=>	"Invoice",
       _selector	=>	\&dependent_selector,
       _search		=>	\&dependent_search,
       _report		=>	\&invoice
       ) );

&hard_coded_report( "Time table",
       (
       _report_name	=>	"Time table",
       _selector	=>	\&dependent_selector,
       _search		=>	\&dependent_search,
       _report		=>	\&time_table
       ) );

&hard_coded_report( "Calendar",
       (
       _report_name	=>	"Calendar",
       _selector	=>	\&dependent_selector,
       _search		=>	\&dependent_search,
       _report		=>	\&calendar
       ) );

1;
