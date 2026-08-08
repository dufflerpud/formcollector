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

$| = 1;
#print "Content-type:  text/text\n\n";

use strict;
use MIME::Lite;
use lib "/usr/local/lib/perl";
use cpi_setup qw(setup);
use cpi_trace qw(stack_trace);
use cpi_sortable qw(sortable);
use cpi_db qw(dbadd dbarr dbdel dbget dbpop dbput dbread dbwrite);
use cpi_cgi qw(CGIheader show_vars);
use cpi_user qw(all_users in_group invite logout logout_select name_to_group);
use cpi_file qw(files_in cleanup autopsy fatal read_file tempfile write_file);
use cpi_translate qw(xlate xprint);


$cpi_vars::TABLE_TAGS	= "bgcolor=\"#c0c0d0\"";
$cpi_vars::TABLE_TAGS	= "USECSS";

our $FORMNAME = "form";

sub send_records;
sub records_to_type;
sub transmitters_dumpers;

our %SEP		= ("REC"=>"-SEP0-","FIELD"=>"-SEP1-","DATA"=>"-SEP2-");
our @QUOTES		= ( '"', "'" );

&setup(
	anonymous_user		=> "anonymous",
	allow_account_creation	=> 1,
	preset_language		=> "en",
	stderr			=> "formcollector",
	Qrequire_captcha	=> 1
	);

our $MAILSRC		= "$cpi_vars::PROG\@brightsands.com";
our $MAILDEST		= "c.m.caldwell\@alumni.unh.edu";
#undef $MAILDEST;

our $DEFAULT_ADMIN	= $MAILDEST;

our $WGET		= "wget";
our $JPEGTOPNM		= "jpegtopnm";
our $PPMDRAW		= "ppmdraw";
our $PNMTOJPEG		= "pnmtojpeg";

#########################################################################
#	Variable declarations.						#
#########################################################################

our $AGENT		= $ENV{HTTP_USER_AGENT};

our $LIBDIR		= &mapfile( "$cpi_vars::BASEDIR/lib" );
our $FORMS_DIR		= &mapfile( "$cpi_vars::BASEDIR/public" );
our $PLUGINS		= &mapfile( "$LIBDIR/plugins" );
our $TRANSMITTERS	= &mapfile( "$PLUGINS/transmitters" );
our $DUMPERS		= &mapfile( "$PLUGINS/dumpers" );
our $GLUE		= &mapfile( "$cpi_vars::BASEDIR/glue.html" );
our $FORM_ADMIN_JS	= &mapfile( "$LIBDIR/form_administration.js" );
our $EXPORT_JS		= &mapfile( "$LIBDIR/export.js" );
our $INTERP_TFS		= &mapfile( "$cpi_vars::BASEDIR/src/interp_tfs.pl" );
our $AUX_FILES		= &mapfile( "$cpi_vars::BASEDIR/aux_files" );
my $ZIPCODES		= &mapfile( "$cpi_vars::BASEDIR/zipcodes" );
my $LIBRARY_JS		= &mapfile( "$LIBDIR/library.js" );

our $LOCK_FIELD		= "locked";

our $linenum;		# For error messages
our @toks;		# Enter file is broken into tokens
our @field_names	= ();
our %vartypes		= ();
our %varlabels		= ();
our $form_type;
our $thisrep;
our %constraints;
our %transient_constraints;
our %showing;
our %form_prefix	= ();
$cpi_vars::SAME_RELATIVE	= <<EOF;
	table				{font-size:inherit;}
	h1                      	{font-size:2em;}
	h2                      	{font-size:1.6em;}
	h3                      	{font-size:1.4em;}
	td                      	{font-size:1em;}
	th                      	{font-size:1em;}
	button                      	{font-size:1em;}
	input[type=button]      	{font-size:1em;}
	input[type=submit]      	{font-size:1em;}
	input[type=number]        	{font-size:0.9em;}
	input[type=email]        	{font-size:0.9em;}
	input[type=tel] 	       	{font-size:0.9em;}
	input[type=text]        	{font-size:0.8em;}
	input[type=checkbox]    	{height:4em; width:4em;}
	input[type=radio]       	{height:4em; width:4em;}
	textarea                	{font-size:0.8em;}
	select                  	{font-size:1em;}
EOF

@cpi_vars::CSS_PER_DEVICE_TYPE	=
    (					# Set base font sizes
    "PhoneGap_iPhone"	=> <<EOF,	# for devices we know about
	body				{font-size:20px;}
	input.fixed_width_button	{width:90%;}
$cpi_vars::SAME_RELATIVE
	.legend				{display:none;}
	.Unanswered_checked		{display:none;}
	.Unanswered_unchecked		{display:none;}
	.Unanswered_label		{display:none;}
	input.outside_table		{display:none;}
	.export_widget_unchecked	{display:none;}
EOF
    "iPhone"		=> <<EOF,	# for devices we know about
	body				{font-size:45px;}
	input.fixed_width_button	{width:90%;}
$cpi_vars::SAME_RELATIVE
EOF
    "PhoneGap_iPad"	=> <<EOF,
	body                    	{font-size:10px;}
	input.fixed_width_button	{width:90%;}
$cpi_vars::SAME_RELATIVE
EOF
    "iPad"		=> <<EOF,
	body                    	{font-size:20px;}
	input.fixed_width_button	{width:90%;}
$cpi_vars::SAME_RELATIVE
EOF
    "."			=> <<EOF
    	input.fixed_width_button	{width:90%;}
	td input.fixed_width_button	{width:90%;}
EOF
    );

# lightskyblue khaki coral
our $STATE_DEFS = <<EOF;
    td.input_ok				{ background-color: #87cefa; }
    td.input_unanswered			{ background-color: #f0e68c; }
    td.input_abnormal			{ background-color: #f08080; }
    td.input_required			{ background-color: #f08000; }
EOF
$STATE_DEFS="";

our $css;

our @LEGAL_LABELS = ("A".."Z","0".."9","a".."z");
our @AXES = ("X","Y","Z","Color","A","B","C");
our $ALL_KEYS				= ":all";
our $VALUES_FOR_FIELD			= ":V";	# ":",$fld
our $KEYS_WITH_FIELD_VALUE		= ":K";	# ":",$fld,$val
our $FIELDS_IN_FORM			= ":F";	# ":"
our $OLD_FIELDS_IN_FORM			= ":F";	# Used for re-indexing

our @ORDERED_PRIVILEGES =
    (
    "Fill_out_new_form",		"Fill out new form",
    "View_instances_of_form",		"Search/View instances of form",
    "Modify_instances_of_form",		"Modify instances of form",
    "Modify_attributes_of_form",	"Modify attributes of form"
    );
our %PRIVILEGE_TEXT = @ORDERED_PRIVILEGES;
@ORDERED_PRIVILEGES = grep( /_/, @ORDERED_PRIVILEGES );

our %aggregated_values;
our @aggregated_field_names;
our %reports;

our %field_handler;

my $SECONDS_PER_DAY = 86400;

#########################################################################
#	If a debug file is available, use that name.  Else use the	#
#	supplied name.							#
#########################################################################
sub mapfile
    {
    my( $fnbase ) = @_;
    my $fntry = $fnbase . "." . $cpi_vars::USER;
    return ( -f $fntry ? $fntry : $fnbase );
    }

#########################################################################
#	Simplify accessing database for form information.		#
#########################################################################
sub DBFget { return &dbget($cpi_vars::DB,$form_type,@_); }
sub DBFput { return &dbput($cpi_vars::DB,$form_type,@_); }
sub DBFadd { return &dbadd($cpi_vars::DB,$form_type,@_); }
sub DBFdel { return &dbdel($cpi_vars::DB,$form_type,@_); }
sub DBFget0	# If return is not defined or "", return 0
    {
    my $ret = &dbget($cpi_vars::DB,$form_type,@_);
    return ( $ret ? $ret : 0 );
    }
sub DBFgetn	# If return is not defined, return "" 
    {
    my $ret = &dbget($cpi_vars::DB,$form_type,@_);
    return ( defined($ret) ? $ret : "" );
    }

#########################################################################
#	Return value for a particular key's field, using a cache.	#
#########################################################################
my %DBFcache_data = ();
sub DBFcache
    {
    my( $key, $fld ) = @_;
    return $DBFcache_data{$key}{$fld}
	if( defined($DBFcache_data{$key})
	    && defined($DBFcache_data{$key}{$fld}) );
    my $res =
	( $field_handler{$fld}
	? &{$field_handler{$fld}}($key)
	: &dbget($cpi_vars::DB,$form_type,$key,$fld) );
    $DBFcache_data{$key}{$fld} = $res;
    return $res;
    }

#########################################################################
#	Return value for a particular key's field, using a cache.	#
#	If return is not defined, return "" 				#
#########################################################################
sub DBFcachen
    {
    my $ret = &DBFcache( @_ );
    return ( defined($ret) ? $ret : "" );
    }

#########################################################################
#	Return true if the first item appears in the remaining list.	#
#########################################################################
sub inlist
    {
    my( $item, @list ) = @_;
    return grep( $_ eq $item, @list );
    }

#########################################################################
#	Turn a string into a token that would remind you of the string	#
#	Not used in perl, but template.js has equivalent.		#
#########################################################################
sub text_to_token
    {
    my( $tokname ) = @_;
    $tokname =~ s/[^\w]+/_/g;
    $tokname =~ s/^_*//;
    $tokname =~ s/_*$//;
    return $tokname;
    }

#########################################################################
#	Convert a token into something resembling text.			#
#	Will probably guess wrong.					#
#########################################################################
sub token_to_text
    {
    my( $ret ) = @_;
    $ret =~ s/_/ /g;
    return $ret;
    }

#########################################################################
#	Make a relative URL absolute so it can be used from elsewhere.	#
#########################################################################
sub abs_url
    {
    my( $url ) = @_;
    return $url					if( $url =~ /^\w+:/ );
    return "http:$url"				if( $url =~ /^\/\// );
    return "http://$ENV{SERVER_NAME}$url"	if( $url =~ /^\// );
    my $ret = $cpi_vars::URL;
    $ret =~ s+$cpi_vars::PROG.cgi+$url+g;
    return $ret;
    }

#########################################################################
#	Get the specified URL.						#
#########################################################################
sub get_abs_url
    {
    my( $url ) = @_;
    return &read_file( "wget --quiet -O - '" . &abs_url($url) . "'|" );
    }

#########################################################################
#	Read in all of the 5-digit zipcodes for the US.			#
#########################################################################
our %zipcity = ();
our %zipstate = ();
our $zips_read = 0;
sub read_zip_table
    {
    if( !$zips_read && -r $ZIPCODES )
	{
	open( INF, $ZIPCODES ) || die( "Cannot open ${ZIPCODES}:  $!");
	while( $_ = <INF> )
	    {
	    if( /^(.*?),\s(.*?)\s+(\d\d\d\d\d)/ )
		{
		$zipcity{$3} = $1;
		$zipstate{$3} = $2;
		$zips_read++;
		}
	    }
	close( INF );
	}
    }

#########################################################################
#	Generate zipmap							#
#########################################################################
sub generate_zipmap
    {
    &read_zip_table();
    my( @lns ) = ();
    my $pos = 80;
    foreach my $zip ( sort keys %zipcity )
        {
	$_ = $zip;
	s/^0*//g;
	$_ = "${_}:\"$zipcity{$zip}, $zipstate{$zip}\"";
	my( $l ) = length($_);
	$pos += $l;
	if( $pos > 79 )
	    {
	    $_ = "\n$_";
	    $pos = $l;
	    }
	push( @lns, $_ )
	}
    close( INF );
    return join(",",@lns) . "\n";
    }

#########################################################################
#	Go find the zip code from the United States Postal Service.	#
#########################################################################
sub lookup_zipcode
    {
    my( $zip ) = @_;
    my $USPS_LOOKUP = "http://zip4.usps.com/zip4/zcl_3_results.jsp?zip5=";
    my $USPS_LOOKUP = "https://tools.usps.com/go/ZipLookupResultsAction!input.action?resultMode=2&postalCode=";
    my $USPS_LOOKUP = "http://www.zip-info.com/cgi-local/zipsrch.exe?Go=Go&zip=";

    #&read_zip_table();

    $zip = substr($zip,0,5) if( length($zip) > 5 );
    unless( defined( $zipcity{$zip} ) )
        {
	#my $urlzip = sprintf("%05d",$zip);
	#my $lookupurl = $USPS_LOOKUP.$urlzip;
	my $lookupurl = $USPS_LOOKUP.$zip;
	open( INF, "wget -q -O - '$lookupurl' | tee /tmp/ziptmp |" ) ||
	    die("Cannot wget $USPS_LOOKUP:  $!");
	while( $_ = <INF> )
	    {
#	    if( m#<b>(.*), (.*)</b>#					||
#		m# padding:5px 10px;" headers="pre">(.*?), (.*?)</td>#	)
	    if( m#<tr><td align=center>(.*?)</font></td><td align=center>(.*?)</font></td><td align=center>(.*?)</font></td></tr># )
		{
		$zipcity{$zip} =
		    join(" ", map( ucfirst(lc($_)), split(/\s/,$1)));
		$zipstate{$zip} = $2;
		last;
		}
	    }
	close( inf );
	}
    return ( $zipcity{$zip} ? $zip : undef );
    }

#########################################################################
#	Incoming request to turn a zipcode into a City, ST Zipcode	#
#########################################################################
sub get_zipcode
    {
    my( $fname, $fullzip ) = @_;
    $fullzip =~ m/^(\d\d\d\d\d)/;
    my $zipind = &lookup_zipcode($1);
    return "alert(\"Lookup of $fullzip failed.\");" if( !$zipind );
    return "parent.reply_citystatezip("
        . &js_quoting($fname). ","
	. &js_quoting($zipcity{$zipind}). ","
	. &js_quoting($zipstate{$zipind}). ","
	. &js_quoting($fullzip) . ");";
    }

#########################################################################
#	Incoming request with full address.  Return broken up.		#
#########################################################################
sub get_address
    {
    my( $fname, $fulladdr ) = @_;
    my $before;
    my $zip;
    my $after;
    my $zipind;

    open( DEB, ">/tmp/debug.log" );
    print DEB $fname, "\n", $fulladdr;
    close( DEB );

    $fulladdr =~ s+\r++gs;
    my @addrlines = split(/\n/,$fulladdr);
    my $lnum = scalar(@addrlines);

    while( !defined($zip) && $lnum-- > 0 )
        {
	$_ = $addrlines[$lnum];
	if( /^([^,]*?)\s*,\s*([^,]*?)\s+(\d\d\d\d\d)(.*)$/ && $4 !~ /^\d/ )
	    { ( $zip, $after ) = ( $3, $4 ); }
	elsif( /^(.*?)\s*,\s*([^,]*?)\s*,([^,]*?)\s+(\d\d\d\d\d)(.*)$/ )
	    { ( $before, $zip, $after ) = ( $1, $4, $5 ); }
	elsif( /^(\d\d\d\d\d)(.*)$/ && $2 !~ /^\d/ )
	    { ( $zip, $after ) = ( $1, $2 ); }
	}
    open( DEB, ">>/tmp/debug.log" );
    print DEB "About to lookup [$zip].\n";
    close( DEB );
    if( !defined($zip) || !defined($zipind=lookup_zipcode($zip)) )
        {
	open( DEB, ">>/tmp/debug.log" );
	print DEB "Query failed.\n";
	close( DEB );
	return "parent.reply_address("
	    . &js_quoting($fname) . ",[". &js_quoting($fulladdr) . "]);";
	}
    else
        {
	if( $after =~ /^([\d\-]*)(.*?)/ )
	    {
	    $zip .= $1;
	    $after = $2;
	    }
	my $address =
	    ( $before
	    ? join("\n",@addrlines[0..$lnum-1],$before)
	    : join("\n",@addrlines[0..$lnum-1])
	    );
	my $postaddress =
	    ( $after
	    ? join("\n",@addrlines[$lnum+1..scalar(@addrlines)-1])
	    : join("\n",$after,@addrlines[$lnum+1..scalar(@addrlines)-1])
	    );
	$fulladdr = join("\n",
	    $address,
	    $zipcity{$zipind}.", ".$zipstate{$zipind}." ".$zip,
	    $postaddress
	    );
	open( DEB, ">>/tmp/debug.log" );
	print DEB "Lnum=$lnum.\n";
	print DEB "Before=$before.\n";
	print DEB "After=$after.\n";
	print DEB "address=$address.\n";
	print DEB "zip=$zip.\n";
	print DEB "postaddress=$postaddress.\n";
	close( DEB );
	return "parent.reply_address("
	    . &js_quoting($fname) . ",[". &js_quoting($fulladdr). ","
	    . &js_quoting("address") .",". &js_quoting($address) .","
	    . &js_quoting("city") .",". &js_quoting($zipcity{$zipind}) .","
	    . &js_quoting("state") .",". &js_quoting($zipstate{$zipind}) .","
	    . &js_quoting("zipcode") .",". &js_quoting($zip) . "]);";
	}
    }

#########################################################################
#	Print a <link> or do substitution if required.			#
#########################################################################
sub get_link_text
    {
    my( $url, $args ) = @_;
    if( $url !~ /\s/ && ! $cpi_vars::FORM{genform} )
        { return "<LINK REL=StyleSheet HREF=\"$url\" $args>\n"; }
    else
        {
	return "<STYLE $args><!--" . ( "" && $url !~ /\s/ ? $url : "" ) . "\n" .
	    ( ( $url =~ /\s/ ) ? $url : &get_abs_url( $url ) ) .
	    "\n--></STYLE>\n";
	}
    }

#########################################################################
#	Parse through a query variable looking for all the queries and	#
#	call the routines for the various query types.  Pack up all the	#
#	replies and send them back as one string.			#
#########################################################################
sub app_intro
    {
    if( $cpi_vars::FORM{query} )	# Handle javascript queries
	{
	my @replies = ();
	foreach my $query ( split(/$SEP{REC}/,$cpi_vars::FORM{query}) )
	    {
	    my( $fnc, $fname, @args ) = split(/$SEP{FIELD}/,$query);
	    if( $fnc eq "address" )
	        { push( @replies, &get_address($fname,$args[0]) ); }
	    elsif( $fnc eq "zipcode" )
		{ push( @replies, &get_zipcode($fname,$args[0]) ); }
	    }
	print "<script type='text/javascript'>", join("",@replies), "parent.query_reply();</script>\n";
	exit(0);
	}
    if( $cpi_vars::FORM{uploadid}
	&& $cpi_vars::FORM{uploadid} !~ /^\./
	&& $cpi_vars::FORM{uploadid} !~ /\// )
        {
	&CGIheader();
	&write_file( "$cpi_vars::BASEDIR/uploads/$cpi_vars::FORM{uploadid}",
	    $cpi_vars::FORM{file} );
	print "Uploaded $cpi_vars::BASEDIR/uploads/$cpi_vars::FORM{uploadid}.\n";
	print STDERR "Uploaded $cpi_vars::BASEDIR/uploads/$cpi_vars::FORM{uploadid}.\n";
	exit(0);
	}
    my $css_url = "";
    $form_type = $cpi_vars::FORM{form_type};
    if( $form_type )
	{
	&dbread( $cpi_vars::DB );
	$css_url=&DBFget("css_url");
	}
    print &get_link_text( "Print.css", "TYPE='text/css' MEDIA=print" );
    print &get_link_text( "$cpi_vars::PROG/shared/states.css", "TYPE='text/css'" );
    print &get_link_text( ( $css_url ? $css_url : $cpi_vars::CSS_URL ), "TYPE='text/css'" );
    if( $cpi_vars::FORM{genform} )
        {
	print &get_link_text( "$cpi_vars::PROG/shared/genform.css", "TYPE='text/css'" );
	}
    else
        {
	print &get_link_text( "$cpi_vars::PROG/shared/live.css", "TYPE='text/css'" );
	}
    }

#########################################################################
#	Do substitutions in a javascript template file.			#
#########################################################################
sub template_substitutions
    {
    my( $fn, @varvals ) = @_;
    my $text = &read_file( $fn );
    push( @varvals,
	"BODY_TAGS",	$cpi_vars::BODY_TAGS,
	"TABLE_TAGS",	$cpi_vars::TABLE_TAGS,
	"SID",		( $cpi_vars::FORM{genform} ? "" : $cpi_vars::SID ),
	"SEPS",		join(",\n\t", map {"${_}:\t'$SEP{$_}'"} keys %SEP )
	);
    grep( $text =~ s/\b${_}_SEP\b/'$SEP{$_}'/gs, keys %SEP );
    while( my $tvar = shift(@varvals) )
        {
	my $tval = shift(@varvals);
	$text =~ s/%%${tvar}%%/$tval/gs;
	}
    return $text;
    }

#########################################################################
#	Returns true if a character is a quote.				#
#########################################################################
sub is_quote
    {
    my( $s )= @_;
    return &inlist( $s, @QUOTES );
    }

#########################################################################
#	Return a string quoted with quotes that won't interfere with	#
#	the contents of the string, if possible.			#
#########################################################################
sub add_quotes
    {
    my( $s, $xlflag ) = @_;
    my $q;
    my $use_q;
    foreach $q ( @QUOTES )
	{
	if( $s !~ /$q/ )
	    {
	    $use_q = $q;
	    last;
	    }
	}
    $use_q ||= $QUOTES[0];
    $s =~ s/$use_q/\\$use_q/gs;
    return ( $xlflag ? ($use_q."XL(".$s.")".$use_q) : ($use_q . $s . $use_q) );
    }

#########################################################################
#	Numbers don't need to be quoted, but everything else should be.	#
#########################################################################
sub js_quoting
    {
    my( $val, $isfield ) = @_;
    return $val if( $val eq "0" || $val =~ /^[1-9]\d*$/ );
    if( $isfield )
        {
	return $val if( $val =~ /^[^\d]/ && $val =~ /^\w+$/ );
	}
    else
	{
	return $val if( $val =~ /^-[1-9]\d*$/ );
	}
    $val = &add_quotes( $val );
    $val =~ s+\r++gs;
    $val =~ s+\n[\s\n]*\n+\n+gs;
    $val =~ s+\n[\n]*+\\n+gs;
    return $val;
    }

#########################################################################
#	Return a string of "on" clauses pointing to the interupt stuff.	#
#########################################################################
sub interupt_string
    {
    my( $obj ) = @_;

    return join( "\n\t", "",
	map( "on$_='mouse_in_image($obj,\"$_\",event);'",
	    "MouseMove","MouseOut","MouseUp","MouseDown","MouseOver",
	    "Click","TouchStart","TouchMove","TouchEnd",
	    "onSelectStart","onDragStart") );
    }

#########################################################################
#	Create a unique id with the use of an ever-increasing integer.	#
#########################################################################
my $unid = 0;
sub unique_id
    {
    return "U" . ($unid++) . "i";
    }

#########################################################################
#	Return the contents of the template file (or generate it from	#
#	a tfs file if required.						#
#########################################################################
sub form_file
    {
    my( $pfn ) = @_;
    $pfn =~ m/(.*)\.(.*?)$/;
    my $file_name = $form_prefix{$form_type}.$1;
    my $ext = $2;
    if( ! -f "$file_name.$ext" )
        {
	return "" if( ! -f "$file_name.tfs" );
	#system( "$INTERP_TFS -$ext -i $file_name.tfs -o $file_name.$ext" );
	system( "$INTERP_TFS -i $file_name.tfs -o $file_name.$ext" );
	}
    &fatal("Failed to $INTERP_TFS file $file_name.$ext file from $file_name.tfs.  pfn=$pfn fd=$FORMS_DIR bd=$cpi_vars::BASEDIR.")
        if( ! -s "$file_name.$ext" );
    return &read_file( &mapfile("$file_name.$ext") );
    }

#########################################################################
#	Return something quoted enough to get through expression	#
#	parser.								#
#########################################################################
sub htmlquote
    {
    my( $ret ) = @_;
    $ret =~ s/'/\\'/g;
    return $ret;
    }

#########################################################################
#	Return a list of variables in the order they appear.		#
#########################################################################
sub determine_variables
    {
    my %seen_var = ();
    my $varind = 0;
    my $fname;
    foreach my $part ( split(/(name:".*?")/,&form_file(&mapfile("Dialog.js"))) )
        {
	if( $part =~ /name:"(.*)"/ )
	    {
	    $fname = $1;
	    $seen_var{$fname} = $varind++;
	    }
	elsif( $part =~ /text:"(.*?)"/ )
	    { $varlabels{$fname} = $1; }
	}
    foreach $fname ( &DBFget($OLD_FIELDS_IN_FORM) )
        {
	if( ! defined( $seen_var{$fname} ) )
	    {
	    #print "Adding unspecific variable [$fname]<br>\n";
	    $seen_var{$fname} = $varind++;
	    }
	}
    @field_names = sort { $seen_var{$a}<=>$seen_var{$b} }
    		    grep( $_ ne "html", keys %seen_var );
    #print "determine_variables returns [",join(",",@field_names),"]<br>\n";
    }

#########################################################################
#	Return true if user can access named form.			#
#########################################################################
sub has_privilege
    {
    my( $priv, $check_form_type, $username ) = @_;
    $check_form_type = $form_type if( ! $check_form_type );
    $username = $cpi_vars::REALUSER if( ! defined( $username ) );
    return 1
	if( $cpi_vars::ANONYMOUS ||
	    &in_group($username,"formcollector_admin") );
    return
        ( &inlist( $priv,
	    &dbget($cpi_vars::DB,"users",$username,$check_form_type,
	        "privs"))
	? 1
	: 0
	);
    }

#########################################################################
#########################################################################
sub can_even_see
    {
    my( $check_form_type, $username ) = @_;
    $check_form_type ||= $form_type;
    $username ||= $cpi_vars::REALUSER;
    my $ret =
     ( &in_group($username,"formcollector_admin")
     || $cpi_vars::ANONYMOUS
     || &dbget($cpi_vars::DB,"users",$username,$check_form_type,"privs")
     || &dbget($cpi_vars::DB,"users",$username,$check_form_type,"count"));
    print STDERR "Checking if $username is in $check_form_type:  ",
        ( $ret ? "yes" : "no" ), "\n";
    return $ret;
    }

#########################################################################
#	Add user to a form group.					#
#########################################################################
sub add_privilege_to_user
    {
    my( $priv, $username ) = @_;
    $username = $cpi_vars::REALUSER if( ! defined( $username ) );
    my $priv_name = &name_to_group($priv);
    print "Adding privilege $priv to $username<br>\n";
    &dbwrite($cpi_vars::DB);
    &dbadd($cpi_vars::DB,"users",$username,"privs",$priv_name);
    &dbpop($cpi_vars::DB);
    }

#########################################################################
#	Remove a user's privilege					#
#########################################################################
sub remove_privilege_from_form
    {
    my( $form_name, $username ) = @_;
    $username = $cpi_vars::REALUSER if( ! defined( $username ) );
    print "Removing $username from $form_type.<br>\n";
    &dbwrite($cpi_vars::DB);
    &dbput($cpi_vars::DB,"users",$username,$form_name,"privs","");
    &dbput($cpi_vars::DB,"users",$username,$form_name,"count",0);
    &dbpop($cpi_vars::DB);
    }

#########################################################################
#	Remove a user's privilege					#
#########################################################################
sub remove_privilege_from_user
    {
    my( $form_name, $priv, $username ) = @_;
    $username = $cpi_vars::REALUSER if( ! defined( $username ) );
    print "Removing privilege $priv from $username<br>\n";
    &dbwrite($cpi_vars::DB);
    &dbdel($cpi_vars::DB,"users",$username,$form_name,"privs",$priv);
    &dbpop($cpi_vars::DB);
    }

#########################################################################
#	Get list of by reading the directory for Dialog files.		#
#########################################################################
sub discover_forms
    {
    my ( $set_type ) = @_;
    foreach my $dname ( &files_in( $FORMS_DIR ) )
	{
	if( $set_type && ! &can_even_see($dname) )
	    { }
	elsif( -r ($_ = "$FORMS_DIR/$dname/Dialog.tfs") )
	    { $form_prefix{$dname} = "$FORMS_DIR/$dname/"; }
	elsif( -r ($_ = "$FORMS_DIR/$dname/Dialog.js") )
	    { $form_prefix{$dname} = "$FORMS_DIR/$dname/"; }
	}

    if( defined($cpi_vars::FORM{form_type}) && $cpi_vars::FORM{form_type} )
        { $form_type = $cpi_vars::FORM{form_type}; }
    else
	{ $form_type = (keys %form_prefix)[0]; }

    if( &in_group($cpi_vars::REALUSER,"formcollector_admin")
	&& defined($form_type) && $form_type ne ""
	&& !defined($form_prefix{$form_type}) )
	{ $form_prefix{$form_type} = ""; }
    elsif( $set_type && !defined($form_prefix{$form_type}) )
	{
	&xprint("XL(User [[$cpi_vars::REALUSER]] is not a member of [[".
	    &name_to_group($form_type) . "($form_type)]].)");
	&cleanup(0);
	}
    if( $form_type )
        {
	my $depfile = &mapfile("$FORMS_DIR/$form_type/dependent.pl");
	do $depfile if( -f $depfile );
	}
    #$form_type = "tsheet";
    }

#########################################################################
#	Return an included javascript or a ref if appropriate.		#
#########################################################################
sub get_script_text
    {
    my( $url, $args ) = @_;
    if( $url !~ /\s/ && ! $cpi_vars::FORM{genform} )
        { return "<SCRIPT SRC=\"$url\" $args></SCRIPT>\n"; }
    else
        {
	return "<SCRIPT $args>\n" .
	    ( $url !~ /\s/ ? "//$url\n" : "" ) .
	    ( ( $url =~ /\s/ ) ? $url : &get_abs_url( $url ) ) .
	    "\n</SCRIPT>\n";
	}
    }

#########################################################################
#	Do substitutions to create javascript for a form.		#
#########################################################################
sub print_form
    {
    my( $tfname, $key, $loading_message ) = @_;
    print STDERR "print_form key=$key.\n";
    my $use_phonegap =
	(&inlist($cpi_vars::FORM{genform}||"","iPad","iPhone","iTouch","Android")
	? 1
	: 0
	);

    my $loading_mode;
    if( $tfname eq "Search" )
        { $loading_mode = "action_mode"; }
    elsif( $cpi_vars::ANONYMOUS || ! defined($key) )
        { $loading_mode = "rw_mode"; }
    else
        { $loading_mode = "ro_mode"; }

    my @scripts = ();
    push( @scripts, "sprintf.js" );
    push( @scripts, "strokeText.js" )	if($AGENT =~ /iPad/);
    push( @scripts, "excanvas.js" )	if($AGENT =~ /MSIE/);
    push( @scripts, "usprompt.js" )	if($cpi_vars::FORM{user} eq "anonymous");
    my $script_hook =
	join( "", map { &get_script_text($_,"TYPE='text/javascript'") } @scripts );

    if( $use_phonegap )
        {
    $script_hook .= <<EOF;
<SCRIPT SRC='phonegap.js' TYPE='text/javascript'></SCRIPT>
<SCRIPT SRC='phonegap_interface.js' TYPE='text/javascript'></SCRIPT>
EOF
	}

#    $script_hook .= <<EOF;
#<SCRIPT TYPE='text/javascript'>
#var is_phonegap = $use_phonegap;
#</SCRIPT>
#EOF

    $script_hook .= <<EOF if( $cpi_vars::FORM{genform} );
	<link rel="apple-touch-icon" href="icon.png" />
	<link rel="apple-touch-startup-image" href="startup.png" />
	<meta name="viewport" content="width=device-width; initial-scale = 1.0; maximum-scale=1.0; user-scalable=no" />
EOF

    my @values_list = ();
    if( defined($key) )
	{
	&determine_variables();
	foreach my $fld ( @field_names )
	    {
	    push( @values_list,
	        &js_quoting($fld,1) . ":" . &js_quoting( &DBFcachen($key,$fld) ) );
	    }
	}
    &xprint( &template_substitutions( $GLUE,
	"PROGRAM",		$cpi_vars::PROG,
	"CAN_EDIT",		( $cpi_vars::ANONYMOUS
				|| ( !$key
				    && &has_privilege("Fill_out_new_form") )
				|| &has_privilege("Modify_instances_of_form")
				|| ( &has_privilege($key)
				  && (&DBFcachen($key,$LOCK_FIELD) ne "Yes" ) ) ),
	"CAN_SUBMIT",		( !$key
				|| !&DBFcachen($key,$LOCK_FIELD) ne "Yes" ),
	"CAN_UNLOCK",		&has_privilege("Modify_instances_of_form"),
	"ANON_MODE",		( $cpi_vars::USER eq "anonymous" ? 1 : "" ),
	"FIRST_MODE",		$loading_mode,
	"LOADING_MESSAGE",	$loading_message,
	"FORM_NAME",		$FORMNAME,
	"LIBRARY",		&read_file( $LIBRARY_JS ),
	"DIALOG",		&form_file(&mapfile("$tfname.js")),
	"SCRIPT_HOOK",		$script_hook,
	"FORM_TYPE",		$form_type,
	"VALUES",		"\t".join(",\n\t",@values_list),
	"DISPOSITIONS",		&generate_transmitter_dumper(0),
	"LEGAL_LABELS",		join("",@LEGAL_LABELS),
	"USER",			$cpi_vars::USER,
	"THISREP",		$cpi_vars::FORM{thisrep},
	"CONSTRAINTS",		$cpi_vars::FORM{constraints},
	"SHOWING",		$cpi_vars::FORM{showing},
	"GENFORM",		$cpi_vars::FORM{genform},
	"KEY",			(defined($key)?$key:""),
	"CSS",			$STATE_DEFS.$css,
	"ACTION",		( $cpi_vars::FORM{POST_URL} ? $cpi_vars::FORM{POST_URL} : "" ),
	"BODY_ARGS",		( $use_phonegap ? "onLoad='onBodyLoad();'" : "" )
	) );
    &footer( $key ? "old" : "new" )
	if( ! $cpi_vars::ANONYMOUS && ! $cpi_vars::FORM{genform} );
    }

#########################################################################
#	Dump a form in a way that it can be used as a mobil app.	#
#########################################################################
sub dump_js
    {
    &print_form( "Dialog", undef, "XL(Loading) ..." );
    &cleanup(0);
    }

#########################################################################
#	This function goes through all of the indices and verifies	#
#	that they are internally consistant.  Doesn't mean they are	#
#	right - but it does mean that we can't prove they are wrong.	#
#########################################################################
sub sanity
    {
    &dbread( $cpi_vars::ACCOUNTDB );
    &dbread( $cpi_vars::DB );
    &discover_forms(0);
    foreach $form_type ( sort keys %form_prefix )
	{
	print "$form_type ...\n";
	&determine_variables();
	my @keys_in_form = &DBFget($ALL_KEYS);
	my %key_exists;
	grep( $key_exists{$_}=1, @keys_in_form );
	print scalar(@keys_in_form), " keys:  ", join(",",sort keys %key_exists), ".\n";
	foreach my $fld ( @field_names )
	    {
	    foreach my $val ( &DBFget($VALUES_FOR_FIELD,$fld) )
		{
		my @klist = &DBFget($KEYS_WITH_FIELD_VALUE,$fld,$val);
		print "fld=$fld val=$val...\n";
		print "Field[$fld] value [$val] has no keys.\n" if(!@klist);
		foreach my $key ( @klist )
		    {
		    print "Field [$fld] value [$val] has non existant key [$key]\n"
			if( ! $key_exists{$key} );
		    $_ = &DBFcache($key,$fld);
		    print "Field [$fld] value [$val]",
			" does not agree with key [$key] value [$_]\n"
			if( $val ne $_ );
		    }
		}
	    }
	foreach my $key ( @keys_in_form )
	    {
	    foreach my $fld ( @field_names )
		{
		my $should_be = &DBFcache($key,$fld);
		my @possvals = &DBFget($VALUES_FOR_FIELD,$fld);
		print "key=$key fld=$fld...\n";
		foreach my $pval ( @possvals )
		    {
		    my %keys_in_val;
		    grep($keys_in_val{$_}=1,
			&DBFget($KEYS_WITH_FIELD_VALUE,$fld,$pval) );
		    if( defined($keys_in_val{$key}) && $should_be ne $pval )
			{ print "Field [$fld] value [$pval] contains $key and it should not.\n"; }
		    elsif( !defined($keys_in_val{$key}) && $should_be eq $pval )
			{ print "Field [$fld] value [$pval] does not contain $key and it should.\n"; }
		    }
		}
	    }
	}
    &dbpop( $cpi_vars::DB );
    &dbpop( $cpi_vars::ACCOUNTDB );
    &cleanup(0);
    }

#########################################################################
sub dump_indices
#########################################################################
    {
    &dbread( $cpi_vars::ACCOUNTDB );
    &dbread( $cpi_vars::DB );
    &discover_forms(0);
    foreach $form_type ( sort keys %form_prefix )
	{
	print "$form_type ...\n";
	&determine_variables();
	foreach my $fld ( @field_names )
	    {
	    print "  Field ${fld}:\n";
	    foreach my $val ( &DBFget($VALUES_FOR_FIELD,$fld) )
		{
		printf("    Value %-20.20s:  %s\n",$val,
		    join(" ",
		    &DBFget($KEYS_WITH_FIELD_VALUE,$fld,$val) ), "\n");
		}
	    }
	foreach my $key ( &DBFget($ALL_KEYS) )
	    {
	    print "  Key ${key}:\n";
	    foreach my $fld ( @field_names )
		{
		printf("    Field %-20.20s:  %s\n",$fld, &DBFcache($key,$fld));
		}
	    }
	}
    &dbpop( $cpi_vars::DB );
    &dbpop( $cpi_vars::ACCOUNTDB );
    &cleanup(0);
    }

#########################################################################
#	Re-index based on values per field per key.			#
#########################################################################
sub reindex
    {
    my( $newdb ) = @_;
    &dbread( $cpi_vars::DB );
    &dbread( $cpi_vars::ACCOUNTDB );
    &dbwrite( $newdb );
    &discover_forms(0);
    print "Reindexing, templates_list = ",join(",",sort keys %form_prefix),"\n";
    foreach $form_type ( sort keys %form_prefix )
        {
	print "Indexing form $form_type ...\n";
	&determine_variables();
	&dbput($newdb,$form_type,$ALL_KEYS,"");
	&dbput($newdb,$form_type,$FIELDS_IN_FORM,"");
	my $last_key = 0;
	my %field_exists = ();
	foreach my $key ( 1 .. &DBFget() )
	    {
	    print "    key=$key\n";
	    my $key_exists;
	    foreach my $fld ( @field_names )
		{
		print "      fld=$fld\n";
		my $val = &DBFcache($key,$fld);
		if( defined($val) )
		    {
		    my $aggname = &aggregate_name( $fld );
		    &dbadd($newdb,$form_type,
		        $KEYS_WITH_FIELD_VALUE,$aggname,$val,$key);
		    &dbadd($newdb,$form_type,
		        $VALUES_FOR_FIELD,$aggname,$val);
		    &dbadd($newdb,$form_type,$FIELDS_IN_FORM,$fld);
		    &dbput($newdb,$form_type,$key,$fld,$val);
		    $key_exists = 1;
		    $field_exists{$fld} = 1;
		    }
		}
	    if( $key_exists )
	        {
		print "    Adding to :all\n";
		&dbadd($newdb,$form_type,$ALL_KEYS,$key);
		$last_key = $key if( $key > $last_key );
		}
	    }
	&dbput( $newdb,$form_type,
	    $FIELDS_IN_FORM,&dbarr(sort keys %field_exists));
	&dbput( $newdb,$form_type,$last_key);
	}
    &dbpop( $newdb );
    &dbpop( $cpi_vars::ACCOUNTDB );
    &dbpop( $cpi_vars::DB );
    &cleanup(0);
    }

#########################################################################
#	Make mods to a key and update key index fields.			#
#########################################################################
my %form_values_map = ();
sub update_key
    {
    my( $key, $fld, $new_val ) = @_;
    my $old_val = &DBFcache($key,$fld);
    $new_val = "" if( ! defined($new_val) );
    if( $old_val ne $new_val )
	{
	my $aggname = &aggregate_name( $fld );
	if( defined($old_val) &&
	    ! defined( $form_values_map{$aggname}{$old_val} ) )
	    {
	    &DBFdel($KEYS_WITH_FIELD_VALUE,$aggname,$old_val,$key);
	    &DBFdel($VALUES_FOR_FIELD,$aggname,$old_val)
		if( !&DBFget($KEYS_WITH_FIELD_VALUE,$aggname,$old_val));
	    }
	&DBFadd($KEYS_WITH_FIELD_VALUE,$aggname,$new_val,$key);
	&DBFadd($VALUES_FOR_FIELD,$aggname,$new_val)
	&DBFadd($FIELDS_IN_FORM,$fld);
	&DBFput($key,$fld,$new_val);
	}
    }

#########################################################################
#	Update database from a form.					#
#########################################################################
sub update_form
    {
    my( $flag ) = @_;
    my( $key ) = $cpi_vars::FORM{key};
    my( $key_defined ) = ( defined( $key ) && $key ne "" );
    my $val;

    $_ = $cpi_vars::FORM{returndata};
    $_ = "" if( ! defined($_) );
    s+\r\n+\n+gs;	# Fix new line conventions for RT11, Windows, etc.
    s+\r+\n+gs;		# Fix new line conventions for Early MacOS, TRS80 ;)
    my %formval = split(/$SEP{DATA}/,$_);

    &determine_variables();

    &dbwrite( $cpi_vars::DB );
    if( ! $key_defined )
        {
	&DBFput( $key = &DBFget0() + 1 );
	$cpi_vars::FORM{key} = $key;
	}

    my $destdir = "$AUX_FILES/$form_type/$key";

    if( $flag ne "delete" )
        {
	foreach my $formind ( keys %formval )
	    {
	    my $oldfile = "$cpi_vars::BASEDIR/uploads/$formval{$formind}";
	    if( $formval{$formind}=~/^\d+\.(\w+)$/ && -f $oldfile )
		{
		my $newfile = "$destdir/$formind.$1";
		if( ! -d $destdir )
		    {
		    printf STDERR "Making $destdir...\n";
		    system("mkdir -p $destdir")
		    }
		printf STDERR "Renaming $oldfile to $newfile...\n";
		rename( $oldfile, $newfile ) ||
		    &fatal("Cannot rename $oldfile to $newfile:  $!");
		#$formval{$formind} = $newfile;
		}
	    }
	}

    $formval{$LOCK_FIELD} = "Yes" if( $flag eq "lock_modify" );

    my %seen_var = map { $_, 1 } @field_names;
    push( @field_names, grep( ! defined($seen_var{$_}), keys %formval ) );
    @field_names = grep( $_ ne "html", @field_names );

    if( $flag eq "delete" )
        {
	&DBFdel($ALL_KEYS,$key);
	foreach my $fld ( @field_names )
	    {
	    if(defined($val=&DBFcache($key,$fld)))
		{
		my $aggname = &aggregate_name($fld);
		&DBFdel($KEYS_WITH_FIELD_VALUE,$aggname,$val,$key);
		&DBFdel($VALUES_FOR_FIELD,$aggname,$val)
		    if( !&DBFget($KEYS_WITH_FIELD_VALUE,$aggname,$val));
		&DBFput($key,$fld,undef);
		}
	    }
	&DBFput( $key, "html", "" );
	system("rm -rf $AUX_FILES/$form_type/$key");
	}
    elsif( ! $key_defined )
	{
	&DBFadd($ALL_KEYS,$key);
	foreach my $fld ( @field_names )
	    {
	    if( defined($val = $formval{$fld}) )
		{
		my $aggname = &aggregate_name( $fld );
		&DBFadd($KEYS_WITH_FIELD_VALUE,$aggname,$val,$key)
		&DBFadd($VALUES_FOR_FIELD,$aggname,$val);
		&DBFput($key,$fld,$val);
		}
	    }
	&DBFput($FIELDS_IN_FORM,&dbarr(@field_names));
	&DBFput($key,"key_owner",$cpi_vars::REALUSER);
	&DBFput( $key, "html", $formval{html}||"" );
	&dbadd($cpi_vars::DB,
	    "users",$cpi_vars::REALUSER,$form_type,"privs",$key)
	    if( ! $cpi_vars::ANONYMOUS );
	}
    else
        {
	%form_values_map = ();
	foreach my $fld ( keys %formval )
	    {
	    my $aggname = &aggregate_name( $fld );
	    $form_values_map{$aggname}{$formval{$fld}} = 1;
	    }
	foreach my $fld ( @field_names )
	    {
	    &update_key( $key, $fld, $formval{$fld} );
	    }
	&DBFput( $key, "html", $formval{html}||"" );
	&DBFput($FIELDS_IN_FORM,&dbarr(@field_names));
	}
    &dbpop( $cpi_vars::DB );
    if( $flag ne "delete" )
	{
	foreach my $formind ( keys %cpi_vars::FORM )
	    {
	    if( $formind =~ /^file_([^\/\.]*)$/
		&& length( $cpi_vars::FORM{$formind} > 100 ) )
	        {
		my $fld = $1;
		system("mkdir -p $destdir") if( ! -d $destdir );
		my $fname = &DBFget( $key, $fld );
		$fname = "$destdir/$fld".($fname =~ /.*\.(\w+)$/ ? ".$1" : "");
		open( OUT, "> $fname" )
		    || &fatal("Cannot write ${fname}:  $!");
		binmode OUT;
		print OUT $cpi_vars::FORM{$formind};
		close( OUT );
		}
	    }
	}
    return $key;
    }

#########################################################################
#########################################################################
sub reset_form_records
    {
    my $fld;
    &aggregate_variables();
    my @keys_to_remove = &DBFget($ALL_KEYS);
    foreach my $key ( @keys_to_remove )
	{
	foreach $fld ( @field_names )
	    {
	    my $v = &DBFget( $key, $fld );
	    &DBFput( $key, $fld, "" );
	    &DBFput($KEYS_WITH_FIELD_VALUE,&aggregate_name($fld),$v,"");
	    }
	&DBFput($key,"html","");
	&DBFput($key,"key_owner","");
	}
    foreach my $fld ( @aggregated_field_names )
        {
	&DBFput( $VALUES_FOR_FIELD, $fld, "" );
	}
    &DBFput($FIELDS_IN_FORM,&dbarr(@field_names));
    &DBFput($ALL_KEYS,"");	# Remove all keys
    &DBFput("");		# Reset last key to unset
    }

#########################################################################
#	Return text for search selection.				#
#########################################################################
sub generic_selector
    {
    my $constraint_count = 0;
    my $s = <<EOF;
    <table $cpi_vars::TABLE_TAGS>
<tr><th>XL(Field)</th><th>XL(Show)</th><th>XL(Search constraint)</th></tr>
EOF
    foreach my $fld ( @aggregated_field_names )
        {
	my @values = sort keys %{$aggregated_values{$fld}};
	if( scalar(@values) > 1 )
	    {
	    $constraint_count++;
	    my $cv = $constraints{$thisrep}{$fld};
	    $_ = &token_to_text($fld)
		if( ! defined($_ = $varlabels{$fld}) || $_ eq "" );
	    $s.="<tr><th align=left>${_}:</th>";
	    $s.="<th><input type=checkbox name=show_$fld";
	    $s.=" checked" if( $showing{$thisrep}{$fld} );
	    $s.="></th><td>";
	    $s .= "<select name=l4_$fld onChange='send_to_server();'>";
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
    return ( $constraint_count ? $s : "" );
    }

#########################################################################
#	Dump a printable version of report table.			#
#########################################################################
sub dump_report_table
    {
    foreach my $ri ( sort keys %reports )
        {
	print "Report ", $ri, ":<ul>";
	foreach my $f ( sort keys %{$reports{$ri}} )
	    {
	    next if( &inlist($f,
	        "_report_name","_selector","_search","_report",
		"Row","Column","Order") );
	    print "<li>", $f, ":";
	    foreach my $c ( sort keys %{$reports{$ri}{$f}} )
	        {
		print " ", $c, "=", $reports{$ri}{$f}{$c};
		}
	    }
	print "<p>\n";
	foreach my $f ( "Row", "Column", "Order" )
	    {
	    print "<li>", $f, ": ", join(" ",@{$reports{$ri}{$f}}),"\n"
		if( $reports{$ri}{$f} );
	    }
	print "</ul>";
	}
    }

#########################################################################
#	Hook for form-dependent pseudo-fields (calculated values).	#
#########################################################################
sub faux_field
    {
    my( $field_name, $handler ) = @_;
    $field_handler{$field_name} = $handler;
    #print "Registering $field_name handler.<br>\n";
    }

my %hard_coded_reports = ();
#########################################################################
#	Hook for form dependent hard coded reports.			#
#########################################################################
sub hard_coded_report
    {
    my( $report_name, %report_structure ) = @_;
    %{$hard_coded_reports{$report_name}} = %report_structure;
    }

#########################################################################
#	Return text for search selection.				#
#########################################################################
sub create_report_structure
    {
    &hard_coded_report("Generic",
        (
	_report_name	=>	"Generic",
	_selector	=>	\&generic_selector,
	_search		=>	\&generic_search,
	_report		=>	\&html_report
	) );
    %reports = %hard_coded_reports;

    if( defined($_ = &DBFget("reports")) )
	{
	foreach my $report_string ( split(/$SEP{REC}/,$_) )
	    {
	    my %rephash = ();
	    my @variable_strings = ();
	    my $repinfo;
	    ( $repinfo, @variable_strings )
		= split(/$SEP{FIELD}/,$report_string);

	    my @rep_strings = split(/$SEP{DATA}/,$repinfo);
	    unshift( @rep_strings, "_report_name" );
	    %rephash = @rep_strings;
	    
	    my $vname;
	    foreach my $variable_string ( @variable_strings )
		{
		my( $vvar, $vval ) = split(/$SEP{DATA}/,$variable_string);
		if( $vvar eq "variable" )
		    { $vname = $vval; }
		else
		    {
		    $rephash{$vname}{$vvar} = $vval;
		    $rephash{$vvar}[$vval] = $vname
			if( &inlist($vvar,"Row","Column","Order")
			    && $vval=~/^\d+$/ );
		    }
		}
	    $reports{ $rephash{"_report_name"} } = \%rephash;
	    }
	}
    #&dump_report_table();
    }

#########################################################################
#	Dump constraints and showing variables.				#
#########################################################################
sub dump_constraints
    {
    my( $msg ) = @_;
    print "<table border=1><tr><th colspan=4>$msg</th></tr>";
    print "<tr><td>FORM{showing}</td><td colspan=3>",
	$cpi_vars::FORM{showing}, "</td></tr>\n"
        if( $cpi_vars::FORM{showing} );
    print "<tr><td>FORM{constraints}</td><td colspan=3>",
        $cpi_vars::FORM{constraints}, "</td></tr>"
        if( $cpi_vars::FORM{constraints} );
    my %seen;
    grep( $seen{ $_ } = 1, keys %constraints );
    grep( $seen{ $_ } = 1, keys %showing );
    foreach my $repname ( sort keys %seen )
        {
	print "<tr><td>Report ${repname}:</td></tr>";
	print "<tr><td></td><td>Showing:</td><td colspan=2>",
	    join(" ",sort keys %{$showing{$repname}}), "</td></tr>"
	    if( $showing{$repname} );
	if( $constraints{$repname} )
	    {
	    print "<tr><td></td><td>Constraints:</td></tr>\n";
	    foreach my $fieldname ( sort keys %{$constraints{$repname}} )
		{
		print "<tr><td></td><td></td><td>${fieldname}:</td><td>",
		    $constraints{$repname}{$fieldname}, "</td></tr>";
		}
	    }
	}
    print "</table>\n";
    }

#########################################################################
#	Merge previous and current constraints and showings.		#
#########################################################################
sub merge_report_constraints
    {
    #&dump_constraints("Before:");
    %constraints = ();
    %transient_constraints = ();
    if( $cpi_vars::FORM{constraints} )
	{
	foreach $_ ( split(/$SEP{REC}/,$cpi_vars::FORM{constraints}) )
	    {
	    my ( $repname, @pieces ) = split(/$SEP{FIELD}/,$_);
	    %{$constraints{$repname}} = ( @pieces );
	    }
	}
    if( $cpi_vars::FORM{transient_constraints} )
	{
	foreach $_ ( split(/$SEP{REC}/,$cpi_vars::FORM{transient_constraints}) )
	    {
	    my ( $repname, @pieces ) = split(/$SEP{FIELD}/,$_);
	    %{$transient_constraints{$repname}} = ( @pieces );
	    }
	}
    my @special_keys;
    if( @special_keys = grep( /^l4_/, keys %cpi_vars::FORM ) )
	{
	grep( s/^l4_//, @special_keys );
	%{$constraints{$thisrep}}
	    = map { $_, $cpi_vars::FORM{"l4_$_"} } @special_keys;
	}

    my @repstrings = ();
    foreach my $repname ( keys %constraints )
        {
	push(@repstrings,join($SEP{FIELD}, $repname, %{$constraints{$repname}}));
	}
    $cpi_vars::FORM{constraints} = join( $SEP{REC}, @repstrings );

    if( $cpi_vars::FORM{showing} )
        {
	foreach my $repiece ( split(/$SEP{REC}/,$cpi_vars::FORM{showing}) )
	    {
	    my ( $repname, @show_fields ) = split(/$SEP{FIELD}/,$repiece);
	    grep( $showing{$repname}{$_} = 1, @show_fields );
	    }
	}
    if( @special_keys = grep( /^show_/, keys %cpi_vars::FORM ) )
	{
	%{$showing{$thisrep}} = ();
	grep( s/^show_//, @special_keys );
	grep( $showing{$thisrep}{$_}=1, @special_keys );
	}
    $cpi_vars::FORM{showing} =
        join( $SEP{REC},
	    map { join( $SEP{FIELD}, $_, keys %{$showing{$_}} ) }
	        keys %showing );
    #&dump_constraints("After:");
    }

#########################################################################
#	Return text for search selection.				#
#########################################################################
sub selector
    {
    return "" if( ! $reports{$thisrep}{Row} );
    my $s = <<EOF;
    <table $cpi_vars::TABLE_TAGS>
<tr><th>XL(Field)</th><th>XL(Search constraint)</th></tr>
EOF
    foreach my $fld ( @{$reports{$thisrep}{Row}} )
        {
	$_ = &token_to_text($fld)
	    if( ! defined($_ = $varlabels{$fld}) || $_ eq "" );
	$s.="<tr><th align=left>${_}:</th><td>";
	$s .= "<select name=l4_$fld onChange='send_to_server();'>";
	my $report_constraint = $reports{$thisrep}{$fld}{Constraint};
	my $cv =
	    ( defined( $constraints{$thisrep}{$fld} )
	    ? $constraints{$thisrep}{$fld}
	    : $report_constraint
	    );
	my %vlist = %{$aggregated_values{$fld}};
	$vlist{"*"} = 1;
	$vlist{ $cpi_vars::FORM{"l4_$fld"} } = 1
	    if( defined($cpi_vars::FORM{"l4_$fld"}) );
	$vlist{ $cv } = 1
	    if( defined($cv) && $cv ne "" );
	foreach my $value ( sort keys %vlist )
	    {
	    $s .= "<option value=\"$value\"";
	    if( defined($cv) && ($value eq $cv) )
	        {
		$s .= " selected";
		$cpi_vars::FORM{"l4_$fld"} = $cv;
		}
	    $s .= ">"
	        . ( $value eq "*"
		    ? "*XL(Any)*"
		    : "XL(" . sprintf("%.30s",$value) . ")"
		  )
		. "\n";
	    }
	$s .= "</select></td></tr>\n";
	}
    $s .= "</table>";
    return $s;
    }

#########################################################################
#	Return a list of keys matching the current constraints.		#
#########################################################################
sub generic_search
    {
    my @match_fields = grep( /l4_/, keys %cpi_vars::FORM );
    grep( s/^l4_//, @match_fields );
    my %seen_ctr = ();
    my $num_fields_that_must_match = 0;
    my @list_to_check = &DBFget($ALL_KEYS);
    if( !&has_privilege("View_instances_of_form") )
        {
	$num_fields_that_must_match++;
	grep( /\d/ && $seen_ctr{$_}++,
	    &dbget($cpi_vars::DB,"users",$cpi_vars::USER,
	        $form_type,"privs"));
	}
    foreach my $fld ( @match_fields )
        {
	my $cv = $cpi_vars::FORM{"l4_$fld"};
	if( defined($cv) && $cv ne "*" )
	    {
	    $num_fields_that_must_match++;
	    grep( $seen_ctr{$_}++, &DBFget($KEYS_WITH_FIELD_VALUE,$fld,$cv) );
	    }
	}
    return grep(($seen_ctr{$_}||0)==$num_fields_that_must_match,@list_to_check);
    }

#########################################################################
#	Return a list of keys matching the current constraints.		#
#########################################################################
sub search
    {
    my %seen_ctr = ();
    my $num_fields_that_must_match = 0;
    my @list_to_check = &DBFget($ALL_KEYS);
    if( !&has_privilege("View_instances_of_form") )
        {
	$num_fields_that_must_match++;
	grep( /\d/ && $seen_ctr{$_}++,
	    &dbget($cpi_vars::DB,"users",$cpi_vars::USER,
	        $form_type,"privs"));
	}

    print STDERR "Non generic search ...\n";
    my @match_fields = ();
    foreach my $fld ( keys %{$reports{$thisrep}} )
        {
	print STDERR "Examining $fld...\n";
	if( ref($reports{$thisrep}{$fld}) eq "HASH" )
	    {
	    print STDERR "Hash logic ...\n";
	    if( (defined($reports{$thisrep}{$fld}{Row})
		&& $reports{$thisrep}{$fld}{Row} >= 0 )
		)
		{
		print STDERR "query logic: ",$reports{$thisrep}{$fld}{Row}, ".<br>\n";
		my $cv = $constraints{$thisrep}{$fld};
		push( @match_fields, $fld ) if( defined($cv) && $cv ne "*" );
		}
	    elsif( defined($_ = $reports{$thisrep}{$fld}{Constraint} ) && $_ ne "" )
		{
		print STDERR "Pushing field $fld due to Constraint [$_].<br>\n";
		$cpi_vars::FORM{"l4_$fld"} = $_;
		push( @match_fields, $fld );
		}
	    elsif( defined($constraints{$thisrep})
		&& defined($constraints{$thisrep}{$fld})
		&& ($_=$constraints{$thisrep}{$fld}) ne "*" )
		{
		print STDERR "Pushing field $fld due to constraint [$_].<br>\n";
		$cpi_vars::FORM{"l4_$fld"} = $_;
		push( @match_fields, $fld );
		}
	    elsif( defined($transient_constraints{$thisrep})
		&& defined($transient_constraints{$thisrep}{$fld})
		&& ($_=$transient_constraints{$thisrep}{$fld}) ne "*" )
		{
		print STDERR "Pushing field $fld due to transient_constraint [$_].<br>\n";
		$cpi_vars::FORM{"l4_$fld"} = $_;
		push( @match_fields, $fld );
		}
	    }
	}

    $num_fields_that_must_match += scalar(@match_fields);
    foreach my $fld ( @match_fields )
        {
	my $cv = $cpi_vars::FORM{"l4_$fld"};
	print STDERR "field that must match:  $fld value=$cv.<br>\n";
	grep( $seen_ctr{$_}++, &DBFget($KEYS_WITH_FIELD_VALUE,$fld,$cv) );
	}
    return grep(($seen_ctr{$_}||0)==$num_fields_that_must_match,@list_to_check);
    }

#########################################################################
#	Get a value for sorting purposes, and keep a cache.		#
#	Note that the value will get converted to a format appropriate	#
#	for sorting before it is cached.				#
#########################################################################
my %sort_cache = ();
sub sort_get
    {
    my( $ind, $fname, $sort_type ) = @_;
    my $v = $sort_cache{$ind}{$fname};
    if( ! defined($v) )
	{
	$v = &DBFcachen( $ind, $fname );
	if( $sort_type =~ /Last/ )
	    {
	    my @v_split = split(/\s/,$v);
	    $v = join(" ",$v_split[$#v_split],@v_split);
	    }
	elsif( $sort_type =~ /Numerical/ )
	    {
	    $v = &sortable( $v );
	    }
	$sort_cache{$ind}{$fname} = $v;
	}
    return $v;
    }

#########################################################################
#	Sort helper called by sort_order.				#
#########################################################################
my @sort_fields = ();
my @sort_direction = ();
sub ksort
    {
    my( $a, $b ) = @_;
    my $fi;
    my $res = 0;
    my $sort_field;
    for( $fi=0; defined($sort_field=$sort_fields[$fi]); $fi++ )
        {
	my $sort_dir = $sort_direction[$fi];
	my $a_val = &sort_get($a,$sort_field,$sort_dir);
	my $b_val = &sort_get($b,$sort_field,$sort_dir);
	if( $sort_dir =~ /Down/ )
	    { $res = ( $a_val cmp $b_val ); }
	else
	    { $res = ( $b_val cmp $a_val ); }
	return $res if( $res );
	}
    return ( $a <=> $b );
    }

#########################################################################
#	Return keys in proper sort order based on sort_descriptor.	#
#########################################################################
sub sort_order
    {
    my( @keys ) = @_;
    #print "Sort_order(",join(",",@keys),") returns (";
    %sort_cache = ();
    if( $reports{$thisrep}{Order} )
	{
	@sort_fields = @{$reports{$thisrep}{Order}};
	@sort_direction = ();
	grep(
	    push( @sort_direction, $reports{$thisrep}{$_}{Direction} ),
	        @sort_fields );
	return ( sort { &ksort($a,$b) } @keys ) if( @sort_fields );
	}
    #print join(",",@keys), ")<br>\n";
    return sort { $a <=> $b } @keys;
    }

#########################################################################
#	Return a report as graph embedded in HTML.			#
#########################################################################
sub graph_report
    {
    require &mapfile( "$LIBDIR/graph.pl" );
    return &graph_report( @_ );		# This only looks like recursion
    }

#########################################################################
#	Return a report as HTML table.  Assumes records are sorted and	#
#	does not provide <table> as this is probably glommed on to the	#
#	end of a table.  Some day it might be made smart enough to deal	#
#	with drawings.							#
#########################################################################
sub html_report
    {
    my( $need_header, $argp, @keys_to_output ) = @_;

    my @print_fields;
    &stack_trace("argp=$argp.") if( $argp == 1 );
    if( $argp && $argp->{"fields"} )
        {
	@print_fields =
	    ( ref($argp->{fields}) eq "LIST"
	    ? @{ $argp->{fields} }
	    : split(/$SEP{FIELD}/,$argp->{fields})
	    );
	}
    elsif( $thisrep && $reports{$thisrep} && $reports{$thisrep}{Column} )
	{ @print_fields = @{$reports{$thisrep}{Column}}; }
    elsif( $thisrep && $showing{$thisrep} && %{$showing{$thisrep}} )
	{ @print_fields=grep($showing{$thisrep}{$_},@aggregated_field_names); }
    else
	{
	push( @print_fields, $_ = $field_names[0] );
	$cpi_vars::FORM{"show_$_"} = 1;
	}

    my $s = "";
    $s .= "<table class=outside_table width=100%>"
	. "<tr class=outside_table><th colspan=".(scalar(@print_fields)+1).">"
	. "XL(Resulting data)</th></tr>" if( $need_header );
    $s .= "<tr><th class=\"noprint outside_table\">XL(Key)</th>";
    foreach my $fld ( @print_fields )
	{
	$_ = &token_to_text($fld) if( ! defined($_ = $varlabels{$fld}) );
	$_ =~ s/_/ /g;
	$s .= "<th class=outside_table>$_</th>";
	}

    foreach my $key ( @keys_to_output )
	{
	print STDERR "html_report working on key $key.\n";
	$s.="</tr>\n"
	  ."<tr><th class=\"noprint outside_table\">"
	  ."<input type=submit name=key value=$key></th>";
	foreach my $fld ( @print_fields )
	    {
	    $_ = substr( &DBFcachen($key,$fld), 0, 40 );
	    s/_/ /g;
	    $s .= ( /^[\-\d\.]+/ ? "<td align=right>" : "<td>" ) . $_ . "</td>";
	    }
	}
    $s .= "</tr>\n</table>";
    return $s;
    }

#########################################################################
#	Return a list of dumpers legal for user to use.			#
#########################################################################
sub legal_dumpers
    {
    my @dumpers = ();
    foreach $_ ( &files_in($DUMPERS) )
        {
	push( @dumpers, $1 )
	    if( /^([^\.].*)\.pl$/ &&
		&in_group( $cpi_vars::REALUSER,
		    &name_to_group( "can_$1" ) ) );
	}
    closedir( D );
    return @dumpers;
    }

#########################################################################
#	Return base name of field (without list suffixes)		#
#########################################################################
sub aggregate_name
    {
    my ( $fname ) = @_;
    $fname = $1 if( $fname =~ /(.*?)_[\d_]+$/ );
    return $fname;
    }

#########################################################################
#	Create hashes of arrays of contents of all fields.  Consider	#
#	xxx_i0, xxx_i1, etc. to be all the same field.			#
#########################################################################
sub aggregate_variables
    {
    &determine_variables();
    %aggregated_values = ();
    @aggregated_field_names = ();
    foreach my $fld ( @field_names )
	{
	my $aggname = &aggregate_name($fld);
	$varlabels{$aggname} = $varlabels{$fld}
	    if(defined($varlabels{fld}));
	my @values = grep( $_ ne "" && $_ ne "Unanswered",
	    &DBFget($VALUES_FOR_FIELD,$fld) );
	grep( $aggregated_values{$aggname}{$_}=1, @values );
	push( @aggregated_field_names, $aggname )
	    if( $aggregated_values{$aggname}
		&& ! &inlist($aggname,@aggregated_field_names) );
	}
    #print "[",join(",<br>",@field_names),"] => [",join(",",@aggregated_field_names),"]<br>\n";
    }

#########################################################################
#	Construct the first few lines of any form.			#
#########################################################################
sub form_top
    {
    $css = &get_link_text( $css ) if( $css );
    return <<EOF;
$css
<script type='text/javascript'>
function send_to_server( fnc, repname, newconstraints )
    {
    with( window.document.$FORMNAME )
	{
	func.value = fnc;
	if( repname )
	    {
	    thisrep.value = repname;
	    if( newconstraints )
		{ transient_constraints.value = newconstraints; }
	    }
	else if( newconstraints && typeof(key)!="undefined" )
	    { key.value = newconstraints; }
	submit();
	reset();
	}
    }

</script>
</head><body $cpi_vars::BODY_TAGS>
<form name=$FORMNAME method=post>
<input type=hidden name=func>
<input type=hidden name=SID value="$cpi_vars::SID">
<input type=hidden name=USER value="$cpi_vars::USER">
<input type=hidden name=form_type value="$form_type">
<input type=hidden name=constraints value="$cpi_vars::FORM{constraints}">
<input type=hidden name=transient_constraints value="">
<input type=hidden name=key value="">
<input type=hidden name=showing value="$cpi_vars::FORM{showing}">
EOF
    }

#########################################################################
#	Generate javascript for specifying transmitter and dumper.	#
#########################################################################
sub generate_transmitter_dumper
    {
    my( $report_mode ) = @_;
    my @tlines;
    my @dumpers = &legal_dumpers();
    my @transmitters = ( join($SEP{FIELD},
    			    "Browser",
			    join($SEP{DATA},
			        "browser",
				"local computer"
				)
			) );
    my $tstr;
    push( @transmitters, split(/$SEP{REC}/,$tstr) )
	if( $tstr = &DBFget("transmitters") );
    foreach my $transmitter ( @transmitters )
	{
	print STDERR "Processing transmitter[$transmitter]\n";
	my($transmitter_name,@typeaddrs) = split(/$SEP{FIELD}/,$transmitter);
	my( @todo ) = $transmitter_name;
	my %seendumper;
	my $num_checked = 0;
	my %seen_transmitter = ();
	while( @todo )
	    {
	    my $l4transmitter = shift(@todo);
	    next if( $seen_transmitter{$l4transmitter} );
	    $seen_transmitter{$l4transmitter} = 1;
	    print STDERR "l4transmitter=$l4transmitter.\n";
	    foreach my $ctransmitter ( @transmitters )
	        {
		my( $ctransmitter_name, @typeaddrs)
		    = split(/$SEP{FIELD}/,$ctransmitter);
		if( $ctransmitter_name eq $l4transmitter )
		    {
		    foreach my $typeaddr ( @typeaddrs )
			{
			my( $atype, $addr ) = split(/$SEP{DATA}/,$typeaddr);
			if( $atype eq "transmitter" )
			    {
			    push( @todo, $addr );
			    }
			else
			    {
			    do &mapfile("$TRANSMITTERS/$atype.pl");
			    grep( $seendumper{$_}++, &transmitters_dumpers() );
			    $num_checked++;
			    }
			}
		    }
		}
	    }
	my @dumpers =
	    grep( $seendumper{$_} == $num_checked, keys %seendumper );
	push( @tlines, "\"$transmitter_name\": [\""
	    . join('","',@dumpers) . "\"]" );
	}
    return &template_substitutions( $EXPORT_JS,
        "TRANSMITTER_DUMPERS",	join(",\n", @tlines ),
	"REPORT_MODE",		($report_mode?1:0),
	"FORM_NAME",		$FORMNAME
	);
    }

#########################################################################
#	Top level just gives a list of keys and allows him to create	#
#	new forms.  Obviously this is way too simple.			#
#########################################################################
sub top_level
    {
    my( $msg ) = @_;

    &aggregate_variables();
    &merge_report_constraints();

    my $s = &form_top()
        . &generate_transmitter_dumper(1)
	. "<input type=hidden name=transmit_info>"
	. "<center><table border=1 class=outside_table>"
	. "<tr class=outside_table><th align=center class=outside_table>"
	. ( $msg ? ($msg . "<br>") : "" )
	. "<span class=noprint>"
	. "<select name=thisrep class=outside_table"
	. " style='text-align:center' onChange='send_to_server(\"setrep\");'>\n";
    foreach my $ri ( sort keys %reports )
        {
	$s .= "<option value=\"$ri\""
	    . ( $ri eq $thisrep ? " selected>" : ">" )
	    . $reports{$ri}{_report_name}." XL(report)\n";
	}
    $s .= "</select></span>";

    my $selector_string =
	( $reports{$thisrep}{_selector}
	? &{ $reports{$thisrep}{_selector}}()
	: &selector()
	);
    $s .= $selector_string . "<br>";

    my @key_list =
	( $reports{$thisrep}{_search}
	? &{ $reports{$thisrep}{_search} }()
	: &search()
	);

    $s .=
	( ( $reports{$thisrep}{_report} )
	    ? &{$reports{$thisrep}{_report}}(1,undef,sort {$a<=>$b} @key_list)
	: ( ! $reports{$thisrep}{"_report_type"} )
	    ? &html_report(1,undef,&sort_order(@key_list))
	: ( $reports{$thisrep}{"_report_type"} eq "Graph" )
	    ? &graph_report(1,$reports{$thisrep},@key_list)
	    : &html_report(1,undef,&sort_order(@key_list))
	) if( @key_list &&
	    ( $selector_string eq "" ||
		($cpi_vars::FORM{transmit_info}||"") =~ /HTML.*browser/ ) );
    my $nrec = scalar(@key_list);
    $s .=
	( $nrec==1
	? "XL([[1]] record found.)"
	: "XL([[$nrec]] records found.)"
	);
    $s .= "<br><span class=noprint id=export_widget></span>" if( $nrec );
    $s .= "</th></tr></table></center></form>";
    $s .= "<script type='text/javascript'>redraw_export_widget();</script>" if( $nrec );
    &xprint( $s );
    &footer( "view" );
    }

#########################################################################
#	Used by the common administrative functions.			#
#########################################################################
sub footer
    {
    my( $mode ) = @_;

    #$mode = "admin" if( !defined($mode) );

    &discover_forms(1);
    my $s = <<EOF;
<script src=usprompt.js type=text/javascript></script>
<script type='text/javascript'>

function footerfunc( fnc )
    {
    with( window.document.footerform )
	{
	var fv = form_type.options[form_type.selectedIndex];
	if( fv.value == '*' ) 
	    {
	    fv.value = usprompt("XL(Enter new form name:)");
	    if( fv.value==null || fv.value=="" ) { return; }
	    fv.value = (fv.value.replace(/[^\\w]/g,"_")).replace(/_+/g,"_");
	    }
	func.value = fnc;

	if( fnc == "setform" )
	    { thisrep.value = ""; }
	submit();
	}
    }
</script>
<form name=footerform method=post>
<input type=hidden name=func>
<input type=hidden name=SID value="$cpi_vars::SID">
<input type=hidden name=USER value="$cpi_vars::USER">
<input type=hidden name=constraints value="$cpi_vars::FORM{constraints}">
<input type=hidden name=transient_constraints value="">
<input type=hidden name=showing value="$cpi_vars::FORM{showing}">
<input type=hidden name=thisrep value="$cpi_vars::FORM{thisrep}">
<span class=noprint>
EOF
    $s .= <<EOF;
    <center><table class=footer><tr class=footer><th class=footer
    ><select name=form_type class=footer onChange='footerfunc("setform");'>
    <option class=footer_title value="">XL(Select form)
EOF
    foreach my $ft ( sort keys %form_prefix )
	{
	$s .= "<option value=\"$ft\" class=footer_"
	    . ( $ft eq $form_type ? "checked selected":"unchecked" )
	    . ">" . &token_to_text($ft) . "\n";
	}
    $s .= "<option value='*' class=footer_unchecked>XL(Add a new form)\n"
        if( &in_group($cpi_vars::REALUSER,"formcollector_admin") );
    $s .= "</select></th";

    my @buts = ( "view:XL(Search and view)" );
    push( @buts, "new:XL(New form)" )
	if( &has_privilege("Fill_out_new_form") );
    push( @buts, "form_administration:XL(Form administration)" )
        if( &has_privilege("Modify_attributes_of_form") );
    foreach my $button ( @buts )
        {
	my( $butdest, $buttext ) = split(/:/,$button);
	next if( ! $form_type && !&inlist($butdest,"logout" ) );
	$s .= "></th><th class=footer>"
	    . "<input type=button onClick='footerfunc(\"$butdest\");'"
	    . " class=footer_" . (($butdest eq $mode) ? "checked" : "unchecked")
	    . " value=\"$buttext\"\n";
	}
    $s .= "></th><th>".&logout_select().<<EOF;
	</th></tr></table></center></form></span>
EOF
    &xprint( $s );
    #&dump_report_table();
    }

#########################################################################
#	Record has been updated, transmit to all who care.		#
#########################################################################
sub broadcast_updated_record
    {
    $_ = &DBFget("submission");
    my($anonflag,$lockflag,$url,$xmitflag,@dumpxmits)=split(/$SEP{REC}/,$_);
    while( $xmitflag && scalar(@dumpxmits) >= 2 )
	{
	my $dumper_type = shift(@dumpxmits);
	my $transmit_clause = shift(@dumpxmits);
	my($transmitter_name) = split(/$SEP{FIELD}/,$transmit_clause);
	do &mapfile("$DUMPERS/$dumper_type.pl");
	my $csubj = &token_to_text($form_type) . " submission";
	my $last_ttype = "";
	foreach my $ctypeaddr (
	    &map_transmitter_to_addresses( $transmitter_name ) )
	    {
	    my( $ttype, $addr ) = split(/$SEP{DATA}/,$ctypeaddr);
	    if( $ttype ne $last_ttype )
		{
		$last_ttype = $ttype;
		do &mapfile("$TRANSMITTERS/$ttype.pl");
		}
	    &send_records($dumper_type,$addr,$csubj,"", $cpi_vars::FORM{key});
	    }
	}
    if( exists( &clear_mail_queue ) ) { &clear_mail_queue(); }
    }

#########################################################################
#	Performs submission
#########################################################################
sub do_one_submission
    {
    if( !($_ = &DBFget("submission") ) )
	{
	&update_form("modify");
	&print_form( "Dialog", $cpi_vars::FORM{key}, "XL(Loading) ..." );
	&cleanup( 0 );
	}
    else
	{
	my($anonflag,$lockflag,$url,$xmitflag,@dumpxmits)=split(/$SEP{REC}/,$_);
	&update_form( ( $lockflag ? "lock_modify" : "modify" ) );
	&broadcast_updated_record() if( $xmitflag );

	if( $cpi_vars::ANONYMOUS )
	    {
	    my $tosend = &form_top() . <<EOF;
<center>
<h3>XL(Form submitted)</h3>
EOF
	    if( $cpi_vars::FORM{client} || $url )
	        {
		$tosend .= "<input type=button value='XL(Done)' onClick='";
		if( $cpi_vars::FORM{client} )
		    { $tosend .= "history.go(-1);'>"; }
		else
		    { $tosend .= "window.location = \"$url\";'>"; }
		}
	    $tosend .= "</center>";

	    &xprint( $tosend );

#XL(Returning in two seconds to [[<a href="$url">$url<a>]]) ...
#<a href="javascript:history.go(-1)">Bounce</a>
#</center>
#
#<meta http-equiv="refresh" content="2;url=$url" />
#EOF
	    &logout();
	    &cleanup( 0 );
	    }
	return $url;
	}
    }

#########################################################################
#	Handle anonymous user commands					#
#########################################################################
sub anonymous_logic
    {
    my($anonflag,$lockflag,$url,$xmitflag,@dumpxmits)
	= split(/$SEP{REC}/,&DBFgetn("submission"));

    &autopsy("Cannot access $form_type form anonymously for $cpi_vars::FORM{func}.")
        if( ! $anonflag );

    if( $cpi_vars::FORM{func} eq "cancel" )
        {
	&logout();
	&xprint(<<EOF);
<body $cpi_vars::BODY_TAGS>
<h1 align=center>Submission cancelled</h1>
EOF
	}
    elsif( $cpi_vars::FORM{func} eq "update" )
        {
	my $address = $cpi_vars::FORM{save_address};
	my $means = "E-mail";
	my $key = &update_form("modify");
	my @privcmd = ( "add_privilege_to_user", $form_type, $key );
	&invite($means,$address,&xlate(<<EOF),@privcmd);
XL(You have filled out a $form_type form and indicated that you wish
to be able to continue to view and modify it.  To do this, you must
associate the data with an $cpi_vars::PROG account.

Click on the following URL to login to your account (or create one if you
don't already have one), and associate this data with it.
EOF

	my $destmsg;

	if( $url )
	    {
	    $destmsg = <<EOF;
XL(Returning in ten seconds to [[<a href="$url">$_</a>]]) ...
<meta http-equiv="refresh" content="10;url=$url" />
EOF
	    }
	else
	    {
	    $destmsg = <<EOF;
XL(Returning in ten seconds to login) ...
<meta http-equiv="refresh" content="10;url=$cpi_vars::THIS" />
EOF
	    }
	&xprint( &form_top() . <<EOF);
<center>
<h2>XL(Form saved)</h2>

XL($means has been sent to [[$address]] telling you how to retrieve
and modify this data.)  $destmsg
</center>
EOF
	&logout();
	&cleanup(0);
	}
    elsif( $cpi_vars::FORM{func} eq "submit" )
	{ &do_one_submission(); }
    else
        { &print_form( "Dialog", undef, "XL(Loading) ..." ); }
    }

#########################################################################
#	This is what happens when a user has logged in but hasn't	#
#	selected a pge.							#
#########################################################################
sub empty_page
    {
    &xprint( &form_top() . "</form>" );
    &footer("form_administration");
    }

#########################################################################
#	Called when user logged in, accepting an invitation.		#
#########################################################################
sub invitation_handler
    {
    my( @args ) = @_;
    my $action;
    my $account_db_writable = 0;
    my $db_writable = 0;
    while( $action = shift( @args ) )
	{
	if( $action eq "add_privilege_to_user" )
	    {
	    $form_type = shift(@args);
	    my( $priv ) = shift(@args);
	    &dbwrite( $cpi_vars::DB ) if( !$db_writable++ );
	    &dbadd($cpi_vars::DB,"users",$cpi_vars::REALUSER,
	        $form_type,"privs",$priv);
	    print "Adding $priv privilege to $cpi_vars::REALUSER.<br>\n";
	    }
	elsif( $action eq "add_instances_to_user" )
	    {
	    $form_type = shift(@args);
	    my $instances = shift(@args);
	    my $count = &dbget($cpi_vars::DB,"users",$cpi_vars::REALUSER,
	        "counts",$form_type);
	    $count = ( $count ? $count : 0 ) + $instances;
	    &dbwrite( $cpi_vars::DB ) if( !$db_writable++ );
	    &dbput($cpi_vars::DB,"users",$cpi_vars::REALUSER,
	        $form_type,"count",$count);
	    print "Setting ${COMMON::REALUSER}'s instances of $form_type to $count.<br>\n";
	    }
	elsif( $action eq "add_to_group" )
	    {
	    my $newgroup = shift(@args);
	    &dbwrite( $cpi_vars::ACCOUNTDB ) if( !$account_db_writable++ );
	    &dbadd( $cpi_vars::ACCOUNTDB, "users", $cpi_vars::REALUSER,
	        "groups", $newgroup );
	    print "Adding $cpi_vars::REALUSER to group $newgroup.<br>\n";
	    }
	elsif( $action eq "set_email" )
	    {
	    my $newaddress = shift(@args);
	    if( ! &dbget($cpi_vars::ACCOUNTDB,
	        "users",$cpi_vars::REALUSER,"email") )
		{
		&dbwrite( $cpi_vars::ACCOUNTDB )
		    if( ! $account_db_writable++ );
		&dbput($cpi_vars::ACCOUNTDB,
		    "users",$cpi_vars::REALUSER,"email",$newaddress);
		}
	    }
	else
	    {
	    print "Unknown action [$action]<br>\n";
	    last;
	    }
	}
    &dbpop( $cpi_vars::DB ) if( $db_writable );
    &dbpop( $cpi_vars::ACCOUNTDB ) if( $account_db_writable );
    }

#########################################################################
#	Give a page administrator some control of where submissions go.	#
#########################################################################
sub form_administration
    {
    my @problems = ();
    my @msgs = ();
    my @allowed_to_delegate = @ORDERED_PRIVILEGES;
    my @field_lines = ();

    &aggregate_variables();

    my @things_to_choose = &files_in($PLUGINS);

    my $form_dir = "$FORMS_DIR/$form_type";

    my @users_with_privileges = ();
    foreach my $user ( &all_users() )
        {
	foreach my $priv ( @allowed_to_delegate )
	    {
	    if( &inlist( $priv,
		&dbget($cpi_vars::DB,"users",$user,$form_type,"privs") ) )
	        {
		push( @users_with_privileges, $user );
		last;
		}
	    }
	}

    if( $cpi_vars::FORM{func} eq "form_administration_update" )
        {
	&dbwrite( $cpi_vars::DB );
	&DBFput("submission", $cpi_vars::FORM{submission} );
	&DBFput("css_url", $cpi_vars::FORM{css_url} );
	foreach my $thing_to_choose ( @things_to_choose )
	    {
	    &DBFput($thing_to_choose,
		$cpi_vars::FORM{$thing_to_choose."_vals"} );
	    }

	foreach my $user ( @users_with_privileges )
	    {
	    foreach my $priv ( @allowed_to_delegate )
	        {
		if( $cpi_vars::FORM{$user."_".$priv} )
		    { &dbadd($cpi_vars::DB,"users",$cpi_vars::REALUSER,
			$form_type,"privs",$priv); }
		else
		    { &dbdel($cpi_vars::DB,"users",$cpi_vars::REALUSER,
			$form_type,"privs",$priv); }
		}
	    }
	$cpi_vars::FORM{new_contents} = $cpi_vars::FORM{new_file}
	    if( defined($cpi_vars::FORM{new_file})
		&& $cpi_vars::FORM{new_file} ne "");
	if( defined($cpi_vars::FORM{new_contents})
	    && $cpi_vars::FORM{new_contents} ne "")
	    {
	    if( ! -d $form_dir )
		{
		mkdir( $form_dir, 0777 ) ||
		    &fatal("Cannot mkdir ${form_dir}:  $!");
		chmod( 0777, $form_dir ) ||
		    &fatal("Cannot chmod 0777 ${form_dir}:  $!");
		}
	    $cpi_vars::FORM{new_file_name} = "Dialog.tfs"
	        if( ! $cpi_vars::FORM{new_file_name} );
	    my $dest_file_name = "$form_dir/$cpi_vars::FORM{new_file_name}";
	    my $old_contents =
	        (-r $dest_file_name
		? &read_file($dest_file_name) : "");
	    if( $dest_file_name =~ /\.tfs$/ )
	        {
		$cpi_vars::FORM{new_contents} =~ s/\r//gs;
		$old_contents =~ s/\r//gs;
		}
	    if( $old_contents ne $cpi_vars::FORM{new_contents} )
	        {
		print STDERR "nfn=$cpi_vars::FORM{new_file_name}.\n";
		my $tempfile = "$form_dir/temp.$cpi_vars::FORM{new_file_name}";
		&write_file( $tempfile, $cpi_vars::FORM{new_contents} );
		my @renames = ( $tempfile, $dest_file_name );
		my @chmod666s = ( $dest_file_name );
		if( $dest_file_name =~ /\.tfs$/ )
		    {
		    my $destjs = $dest_file_name;	$destjs=~s/\.tfs$/.js/;
		    my $tempjs = $tempfile;		$tempjs=~s/\.tfs$/.js/;
		    #my $cmd = "$INTERP_TFS -js -i $tempfile -o $tempjs";
		    my $cmd = "$INTERP_TFS -i $tempfile -o $tempjs";
		    &fatal("Could not run \"$cmd\":  $!")
			if( !open(INF,"($cmd) 2>&1|") );
		    my @problems = map { "<li>$_" } <INF>;
		    close( INF );
		    push( @renames, $tempjs, $destjs );
		    push( @chmod666s, $destjs );
		    }
		if( @problems )
		    {
		    push( @problems,
			"<b>XL(There is a problem with the new file:)</b><ul>"
			. join("",@problems) . "</ul>");
		    push( @problems,
			"XL(Hit the \"back\" button and correct the problems.)",
			"<b>XL(NOTE):</b>  XL(Your changes have not been saved."
			. "  If you navigate away from this screen without"
			. " saving your changes, you will lose them.)");
		    }
		else
		    {
		    print STDERR "renames=", join(",",@renames),".\n";
		    while( defined($_ = shift(@renames)) )
			{
			rename($_,shift(@renames)) ||
			    push( @problems, "Cannot rename ${_}:  $!" );
			}
		    push( @problems,
			"Cannot chmod ".join(" ",@chmod666s).": $!" )
		        if( chmod( 0666, @chmod666s ) != scalar(@chmod666s) );
		    }
		}
	    }

	foreach $_ ( keys %cpi_vars::FORM )
	    {
	    if( /delete_(.*)/ )
	        {
		unlink( "$form_dir/$1" ) ||
		    push(@problems,"Cannot unlink $form_dir/$1:  $!");
		}
	    }

	if( $cpi_vars::FORM{invitees_vals} )
	    {
	    foreach my $new_user_stuff
		( split(/$SEP{REC}/,$cpi_vars::FORM{invitees_vals}) )
		{
		my($means,$address,$privs)=split(/$SEP{FIELD}/,$new_user_stuff);
		my @options = ( "set_email", $address );
		foreach my $thing_to_choose ( @things_to_choose )
		    {
		    my $choose_dir = "$PLUGINS/$thing_to_choose";
		    foreach $_ ( &files_in( $choose_dir ) )
			{
			push( @options, "add_to_group",
			    &name_to_group("can_$1") )
			    if( /^([^\.].*)\.pl$/ );
			}
		    }
		my @parts = ();
		foreach my $priv ( split(/,/,$privs) )
		    {
		    push(@options,"add_privilege_to_user",$form_type,$priv);
		    if( $priv eq "Fill_out_new_form" )
			{ push( @parts, "fill out the $form_type form"); }
		    elsif( $priv eq "View_instances_of_form" )
			{ push( @parts, "review $form_type data"); }
		    elsif( $priv eq "Modify_instances_of_form" )
			{ push( @parts, "modify $form_type data"); }
		    elsif( $priv eq "Modify_attributes_of_form" )
			{ push( @parts, "modify $form_type form attributes"); }
		    }
		my $last_part = pop(@parts);
		my $invite_text =
		    ( @parts ? ( join(", ",@parts) . " and ") : "" )
		    . $last_part;
		&invite($means,$address,&xlate(<<EOF),@options);
$cpi_vars::REALUSER XL(invites you to $invite_text.)

XL(To do this, click on the following URL and login or create a new
account as necessary):
EOF
		push(@msgs, "XL(Invitation to $invite_text sent via [[$means]] to [[$address]].)");
		}
	    }
	push( @msgs, (@problems ? @problems : "<b>XL(Update complete.)</b>") );

	&DBFput("reports",$cpi_vars::FORM{reports});

	&reset_form_records() if( $cpi_vars::FORM{reset_database} );

	&dbpop( $cpi_vars::DB );

	&create_report_structure();		# Need to re-read this stuff
	&discover_forms(1);
	}

    my @substlist = ();
    my %translations = ();

    foreach my $priv ( @allowed_to_delegate )
        {
	$translations{"\"${priv}\":\"XL($PRIVILEGE_TEXT{$priv})\""} = 1;
	}
    foreach my $thing_to_choose ( @things_to_choose )
        {
	$translations{"\"$thing_to_choose\":\"XL($thing_to_choose)\""} = 1;
	my $choose_dir = "$PLUGINS/$thing_to_choose";
	my @opts = ();
	foreach $_ ( &files_in($choose_dir) )
	    {
	    if( $_ ne "browser.pl" && /^([^\.].*)\.pl$/ &&
		&in_group($cpi_vars::REALUSER,
		    &name_to_group("can_".$1)) )
		{
		$translations{"\"${1}\":\"XL($1)\""} = 1;
		push( @opts, $1 );
		}
	    }

	push( @substlist,
	    "${thing_to_choose}_vals",
	    (&DBFget($thing_to_choose)||""),
	    "${thing_to_choose}_list",
	    join($SEP{REC}, sort @opts));
	}

    my @user_parts = "<tr><th>XL(User)</th><th>XL(e-mail)</th>";
    foreach my $priv ( @allowed_to_delegate )
        {
	push( @user_parts, "<th>XL(", $PRIVILEGE_TEXT{$priv}, ")</th>" );
	}
    push( @user_parts, "</tr>" );
    foreach my $user ( @users_with_privileges )
	{
	my $email = &dbget($cpi_vars::ACCOUNTDB,"users",$user,"email");
	push( @user_parts, "<tr><th align=left>",
	    &dbget($cpi_vars::ACCOUNTDB,"users",$user,"fullname"),
	    "</th><td>",
	    ( $email ?  "<a href='mailto:$email'>$email</a>" : "" ),
	    "</td>" );
	my( @plist ) =
	    &dbget($cpi_vars::DB,"users",$user,$form_type,"privs");
	foreach my $priv ( @allowed_to_delegate )
	    {
	    push( @user_parts, "<th><input type=checkbox",
	        " name=${user}_${priv}",
		( &inlist($priv,@plist) ? " checked" : ""),
		" onClick='trigger_change(1);'",
		"></th>" );
	    }
	push( @user_parts, "</tr>" );
	}
    push( @user_parts,
	"<tr><th colspan=2>XL(No users in group [[$form_type]].)</th></tr>" )
        if( ! @user_parts );

    system("mkdir -p $form_dir; chmod 755 $form_dir")
        if( ! -d $form_dir );
    my @delfiles = grep ( /^[^\.].*\.(jpg|jpeg|tfs)$/, &files_in( $form_dir ) );
    my $upload_table = "";
    if( @delfiles )
        {
	$upload_table = join("\n",
	    "<tr><th>XL(Delete?)</th><th>XL(File)</th></tr>",
	    map { "<tr><th><input type=checkbox name='delete_$_'></th>"
	        . "<td>$_</td></tr>" } @delfiles );
	}

    foreach my $fname ( sort @aggregated_field_names )
        {
	push( @field_lines, "\"$fname\"" );
	}

    my $msg =
        ( @msgs
        ? "<center><table><tr><td>"
	    .join("<br>",@msgs)."</td></tr></table></center>"
	: ""
	);

    my @repieces = ();
    if( $_ = &DBFget("reports") )
	{
	my $rep_sep = "\n";
	foreach my $report ( split(/$SEP{REC}/) )
	    {
	    my( $report_info, @variable_fields ) = split(/$SEP{FIELD}/,$report);
	    my( @report_vars ) = split(/$SEP{DATA}/,$report_info);
	    my $var_sep = "";
	    unshift( @report_vars, "_report_name" );
	    push( @repieces, $rep_sep, "    {" );
	    while( defined($_ = shift(@report_vars) ) )
	        {
		push( @repieces, $var_sep,
		    "\n    ", $_, ":\t", &js_quoting(shift(@report_vars)) );
		$var_sep = ",";
		}
	    $rep_sep = "\n    },\n";
	    my $vf;
	    my $attr_sep;
	    while( defined($vf=shift(@variable_fields)) )
	        {
		my( $fname, $fvalue ) = split(/$SEP{DATA}/,$vf);
		if( $fname ne "variable" )
		    {
		    push(@repieces,
		        $attr_sep,"\n\t",
			&js_quoting($fname,1),":\t",&js_quoting($fvalue));
		    $attr_sep = ",";
		    }
		else
		    {
		    push(@repieces,$var_sep,"\n    ",
		        &js_quoting($fvalue,1),":\n\t{");
		    $var_sep = "\n\t},";
		    $attr_sep = "";
		    }
		}
	    push(@repieces, "\n\t}") if( $var_sep ne "," );
	    }
	push( @repieces, "\n    }\n" );
	}

    $_ = "$FORMS_DIR/$form_type/Dialog.tfs";
    $_ = ( -f $_ ? &read_file($_) : "" );
    &xprint( &template_substitutions( $FORM_ADMIN_JS,
	"CSS",$css,
	"FORM_TYPE",$form_type,
	"MSG",$msg,
	"ANONYMOUS_URL","$cpi_vars::URL?form_type=$form_type&user=anonymous",
	"CSS_URL",&DBFgetn("css_url"),
	"FORM_NAME",$FORMNAME,
	"TRANSLATIONS",join(",\n",keys %translations),
	"SUBMISSION",&DBFgetn("submission"),
	"CONTENT",$_,
	"UPLOAD_TABLE",$upload_table,
	"USER_TABLE",join("",@user_parts),
	"USER",$cpi_vars::USER,
	"INVITE_PRIVS",join($SEP{REC},@allowed_to_delegate),
	"FIELD_LIST",join(",",@field_lines),
	"REPORTS",join("",@repieces),
	"THISREP",$cpi_vars::FORM{thisrep},
	"CONSTRAINTS",$cpi_vars::FORM{constraints},
	"SHOWING",$cpi_vars::FORM{showing},
	"AXES",join(",",@AXES),
	@substlist ) );

    &footer("form_administration");
    }

#########################################################################
#	We want an HTML header most of the time.			#
#########################################################################
sub check_if_app_needs_header()
    {
    print STDERR "func=$cpi_vars::FORM{func}. ti=$cpi_vars::FORM{transmit_info}.\n";
    return 0 if( $cpi_vars::FORM{func} eq "download" );
    return
	( !&inlist($cpi_vars::FORM{func},"dump_records","full_record","report")
	|| ( $cpi_vars::FORM{transmit_info} !~ /browser/i )
	|| ( $cpi_vars::FORM{transmit_info} =~ /HTML/ ) );
    }

#########################################################################
#	User has requested a file that is part of this record.		#
#########################################################################
sub download
    {
    my $key = $cpi_vars::FORM{key};
    &fatal("Illegal download key [$key].")
	if( !defined($key) || $key !~ /^\w+$/ );

    my $fld = $cpi_vars::FORM{show_field};
    &fatal("Illegal download field.")
	if( !defined($fld) || $fld !~ /^\w+$/ );

    my $keydata = &DBFget( $key, $fld );
    my $fname = "$AUX_FILES/$form_type/$key/$fld"
    		. ($keydata =~ /.*\.(\w+)$/ ? ".$1" : "");
    if( open(INF,$fname) )
        {
	binmode INF;
	$keydata = join("",<INF>);
	close( INF );
	}

    my $filemode = "text/plain";
    if( $keydata =~ m+data:(.*?);base64,(.*)+ )
        {
	$filemode = $1;
	$keydata = $2;
	my $conv_file = &tempfile() . ".b64";
	&write_file( $conv_file, $2 );
	open( INF, "base64 -d< $conv_file |" )
	    || &fatal("Cannot run base64:  $!");
	binmode INF;
	$keydata = join("",<INF>);
	close( INF );
	}

    binmode STDOUT;
    print	"Content-type:  $filemode\n",
		"Content-disposition:  attachment; filename=$fname\n\n",
		$keydata;
    &cleanup( 0 );
    }

#########################################################################
#	Return complete list of destinations from transmitter.		#
#########################################################################
sub map_transmitter_to_addresses
    {
    my( $transmitter_name ) = @_;
    my %transctrs = ();
    my %transhash = ( "Browser" => [ "browser", "local computer" ] );
    foreach $_ ( split(/$SEP{REC}/, &DBFgetn("transmitters") ) )
	{
	my( $ctrname, @ctrs ) = split(/$SEP{FIELD}/,$_);
	$transhash{$ctrname} = \@ctrs;
	}
    my @transtodo = ( $transmitter_name );
    while( defined( $_ = shift(@transtodo) ) )
	{
	&fatal("$_ not found in transmitter list.")
	    if( ! defined( $transhash{$_} ) );
	foreach $_ ( @{$transhash{$_}} )
	    {
	    my( $ttype, $taddr ) = split(/$SEP{DATA}/);
	    if( $ttype eq "transmitter" )
		{ push( @transtodo, $taddr ); }
	    else
		{ $transctrs{$ttype.$SEP{DATA}.$taddr} = 1; }
	    }
	}
    print STDERR "[", join(",",sort keys %transctrs), "]\n";
    return sort keys %transctrs;
    }

#########################################################################
#	Handle regular user commands					#
#########################################################################
sub user_logic
    {
    my $fnc = ($cpi_vars::FORM{func} || "");
    if( ! $form_type )
        { &empty_page(); }
    elsif($fnc =~ /^form_administration/ ||
        $form_prefix{$form_type} eq "" )
        { &form_administration(); }
    elsif( exists &form_command && &form_command( $fnc ) )
        { }
    elsif($fnc eq "new" )
	{ &print_form( "Dialog", undef,"XL(Loading) ..." ); }
    elsif($fnc eq "cancel")
	{ &top_level(); }
    elsif( &inlist( $fnc, "full_record", "dump_records", "report" ) )
        {
	my ($dumper_type,$transmitter_name)
	    = split(/$SEP{FIELD}/,($cpi_vars::FORM{transmit_info}||""));
	#print "CMC fnc=$fnc dumper_type=[$dumper_type]<br>transmitter_name=[$transmitter_name]<br>\n";
	if( $fnc eq "report"
	    && $dumper_type eq "HTML"
	    && $transmitter_name eq "browser" )
	    { &top_level(); }
	else
	    {
	    &fatal("$cpi_vars::REALUSER does not have permission to use $dumper_type")
		if( ! &in_group($cpi_vars::REALUSER,
		    &name_to_group("can_$dumper_type") ) );

	    my $ctsubj = &token_to_text($form_type) . " submission";

#		&fatal("$cpi_vars::REALUSER does not have permission to use transmitter $transmitter_type")
#		    if( $transmitter_name ne "browser" &&
#			! &inlist(
#			join($SEP{FIELD},
#			    $transmitter_name,$transmitter_addr,$transmitter_subj),
#			split( /$SEP{REC}/,
#			&DBFgetn("transmitters"))));
	    &determine_variables();
	    do &mapfile("$DUMPERS/$dumper_type.pl");

	    &merge_report_constraints();

	    my $last_ttype = "";
	    my @msgs = ();
	    foreach my $ctypeaddr (
		&map_transmitter_to_addresses( $transmitter_name ) )
		{
		my( $ttype, $addr ) = split(/$SEP{DATA}/,$ctypeaddr);
		if( $ttype ne $last_ttype )
		    {
		    $last_ttype = $ttype;
		    do &mapfile("$TRANSMITTERS/$ttype.pl");
		    }

		if( $fnc eq "full_record" )
		    {
#			&print_form( "Dialog", $cpi_vars::FORM{key},
#			    &send_records($dumper_type,
#				$addr,$ctsubj,
#				"", $cpi_vars::FORM{key}) )
#			    if( $cpi_vars::FORM{key} );
		    push( @msgs,
			&send_records($dumper_type,
			    $addr,$ctsubj,
			    "", $cpi_vars::FORM{key}) )
			if( $cpi_vars::FORM{key} );
		    }
		elsif( $fnc eq "dump_records" )
		    {
		    &merge_report_constraints();
		    push( @msgs,
			&send_records($dumper_type,
			    $addr, &token_to_text($form_type) . " submission",
			    "",
				( $reports{$thisrep}{_search}
				? &{ $reports{$thisrep}{_search} }()
				: &search()
			    )));
		    }
		else	# Report
		    {
		    &merge_report_constraints();
		    my @print_fields;
		    if( $thisrep && $reports{$thisrep} && $reports{$thisrep}{Column} )
			{ @print_fields = @{$reports{$thisrep}{Column}}; }
		    elsif( $showing{$thisrep} )
			{ @print_fields = keys %{$showing{$thisrep}}; }
		    else
			{ push( @print_fields, $_ = $field_names[0] ); }

		    push( @msgs,
			&send_records($dumper_type,
			    $addr,$ctsubj,
			    join( $SEP{FIELD}, @print_fields ),
				( $reports{$thisrep}{_search}
				? &{ $reports{$thisrep}{_search} }()
				: &search()
			    )));
		    }
		}
	    if( exists( &clear_mail_queue ) )
	        { &clear_mail_queue(); }
	    &top_level( join("<br>",@msgs) ) if( @msgs );
	    }
	}
    elsif($fnc eq "update")
	{
	&update_form("modify"); &top_level("");
	&broadcast_updated_record();
	}
    elsif($fnc eq "submit")
	{ &do_one_submission(); &top_level(); }
    elsif($fnc eq "download")
        { &download(); }
    elsif( ! $cpi_vars::FORM{key} )
	{ &top_level(); }
    elsif($fnc eq "delete")
	{ &update_form("delete"); &top_level("delete"); }
    else
	{ &print_form( "Dialog", $cpi_vars::FORM{key}, "XL(Loading) ..." ); }
    }

#########################################################################
#	Main								#
#########################################################################

if( $ENV{SCRIPT_NAME} eq "" )
    {
    if(    $ARGV[0] eq "reindex" )	{ reindex( $ARGV[1] );	}
    elsif( $ARGV[0] eq "print" )	{ dump_indices();	}
    elsif( $ARGV[0] eq "sanity" )	{ sanity();		}
    elsif( $ARGV[0] =~ /form=(.*)$/ )
        {
	$form_type = $1;
	my $depfile = &mapfile("$FORMS_DIR/$form_type/dependent.pl");
	do $depfile if( -f $depfile );
	&interactive();
	}
    else
	{
	&fatal("XL(Usage):  $cpi_vars::PROG.cgi (dump|dumpaccounts|dumptranslations|undump|undumpaccounts|undumptranslations) [ dumpname ]",0)
	}
    }

#&show_vars("All vars:");
print $cpi_vars::FORM{returned_data};

my $using_agent =
    $ENV{HTTP_USER_AGENT}
    || $cpi_vars::FORM{genform}
    || $cpi_vars::FORM{client}
    || "unknown";
my $agent =
#    ( $cpi_vars::FORM{genform} ? "PhoneGap_" . $cpi_vars::FORM{genform}
#    : $cpi_vars::FORM{client} ? "PhoneGap_" . $cpi_vars::FORM{client}
#    : $ENV{HTTP_USER_AGENT}
#    );
    (($cpi_vars::FORM{genform} || $cpi_vars::FORM{client}) ? "PhoneGap_" : "") .
    ( $using_agent =~ /iPhone/ ? "iPhone"
        : ( $using_agent =~ /Wget/ ? "iPhone"
	: ( $using_agent =~ /iPad/ ? "iPad"
	: $using_agent ) ) );

print STDERR "Using_agent=[$using_agent], Agent=[$agent]\n";

while( defined($_=shift(@cpi_vars::CSS_PER_DEVICE_TYPE)) )
    {
    $css = shift(@cpi_vars::CSS_PER_DEVICE_TYPE);
    last if( $agent =~ /$_/ );
    }
print STDERR "Agent [$agent] matched [$_]\n";

&discover_forms(1);
$cpi_vars::FORM{thisrep} ||= "Generic";
$thisrep = $cpi_vars::FORM{thisrep};

&create_report_structure();

if( $cpi_vars::FORM{genform} )
    { &dump_js( $cpi_vars::FORM{genform} ); }
elsif( $cpi_vars::ANONYMOUS )
    { &anonymous_logic(); }
else
    { &user_logic(); }

&cleanup(0);
