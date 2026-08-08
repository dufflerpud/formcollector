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
use cpi_send_file qw( sendmail );

# SMS address convention from http://www.makeuseof.com/tag/email-to-sms/
#Carrier			Email to SMS Gateway
#Alltel				[10-digit phone number]@message.alltel.com
#				Example: 1234567890@message.alltel.com
#AT&T (formerly Cingular)	[10-digit phone number]@txt.att.net
#				[10-digit phone number]@mms.att.net (MMS)
#				[10-digit phone number]@cingularme.com
#				Example: 1234567890@txt.att.net
#Boost Mobile			[10-digit phone number]@myboostmobile.com
#				Example: 1234567890@myboostmobile.com
#Nextel (now Sprint Nextel)	[10-digit telephone number]@messaging.nextel.com
#				Example: 1234567890@messaging.nextel.com
#Sprint PCS (now Sprint Nextel)	[10-digit phone number]@messaging.sprintpcs.com
#				[10-digit phone number]@pm.sprint.com (MMS)
#				Example: 1234567890@messaging.sprintpcs.com
#T-Mobile			[10-digit phone number]@tmomail.net
#				Example: 1234567890@tmomail.net
#US Cellular			[10-digit phone number]email.uscc.net (SMS)
#				[10-digit phone number]@mms.uscc.net (MMS)
#				Example: 1234567890@email.uscc.net
#Verizon			[10-digit phone number]@vtext.com
#				[10-digit phone number]@vzwpix.com (MMS)
#				Example: 1234567890@vtext.com
#Virgin Mobile USA		[10-digit phone number]@vmobl.com
#				Example: 1234567890@vmobl.com
#
# And for sending with pictures from http://www.bennadel.com/blog/794-Sending-SMS-Picture-Messages-With-ColdFusion-And-CFMail.htm:
#AT&T Wireless			[10-digit phone number]@mmode.com
#Cingular			[10-digit phone number]@mms.mycingular.com
#Sprint				[10-digit phone number]@pm.sprint.com
#T-Mobile			[10-digit phone number]@tmomail.net
#Verizon			[10-digit phone number]@vzwpix.com

#########################################################################
#	Return a list of dumpers that this transmitter can handle.	#
#########################################################################
sub main::transmitters_dumpers
    {
    return grep( &inlist($_,"text","HTML","Report"), &legal_dumpers() );
    }

#########################################################################
#	Send it off to an SMS e-mail address.				#
#########################################################################
sub main::send_records
    {
    my( $dumper_type, $dest, $subj, $fields, @keys_to_dump ) = @_;
#    if( ! defined($dest) )
#        { $dest = ""; }
#    elsif( $dest ne "" )
#        { $dest = " -P$dest"; }
    my $msg = &records_to_type({
        "transmitter_type"=>"SMS",
	"dumper_type"=>$dumper_type,
	"fields"=>$fields,
	"dest"=>$dest,
	"subj"=>$subj,
	"colorind"=>"color"
	},@keys_to_dump);
    if( $default_extension eq "txt" )
        {
	&cpi_send_file::sendmail( $MAILSRC, $dest, $subj, $msg );
	}
    elsif( $default_extension eq "html" )
        {
	my $formatted_data = &cpi_file::tempfile(".$default_extension");
	$msg =~ s+<table width=100%+<table width=1000+s;
	my $psbase = &cpi_file::tempfile("");
	my $graphic = &cpi_file::tempfile(".jpg");
	&cpi_file::write_file( $formatted_data, $msg );
        system_cmd(
	    "$cpi_vars::HTML2PS -d --colour $formatted_data > $psbase.ps;" .
	    "pstopnm $psbase;" .
	    "pnmcat -tb $psbase???.* | pnmtojpeg > $graphic" );
	&cpi_send_file::sendmail( $MAILSRC, $dest, $subj, $subj, $graphic );
	}
    return "<ul>" .
	( $dest ? "<li>XL(Printing to) $dest" : "<li>XL(Printing)" ) .
	"</ul>";
    }
1;
