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

#########################################################################
#	Return a list of dumpers that this transmitter can handle.	#
#########################################################################
sub main::transmitters_dumpers
    {
    return &legal_dumpers();
    }

#########################################################################
#	Send all the mail if there is any mail to send.			#
#########################################################################
sub main::clear_mail_queue
    {
    if( %main::mail_queue )
        {
	foreach my $dest_subject ( keys %main::mail_queue )
	    {
	    my( $mail_dest, $mail_subject ) = split( /:/, $dest_subject );
	    my( $msg, @files ) = @{ $main::mail_queue{ $dest_subject } };
	    &cpi_send_file::sendmail( $MAILSRC, $mail_dest, $mail_subject, $msg, @files );
	    #grep( unlink($_), @files ) if( @files );
	    }
	%main::mail_queue = ();
	}
    }

#########################################################################
#	Create mail from form.						#
#########################################################################
sub main::send_records
    {
    my( $dumper_type, $dest, $subj, $fields, @keys_to_dump ) = @_;
    my $msg = &cpi_translate::xlate(&records_to_type({
	"transmitter_type"=>"e-mail",
	"dumper_type"=>$dumper_type,
	"fields"=>$fields,
	"dest"=>$dest,
	"subj"=>$subj,
	}, @keys_to_dump));
    $dest = $main::test_mail if( defined( $main::test_mail ) );
    my @associated_files = ();
    my %file_already_sent = ();
    if( $default_extension eq "html" )
	{
	foreach $_ ( split(/("cid:.*?")/,$msg) )
	    {
	    if( /"cid:(.*)"/ && ! $file_already_sent{$1} )
		{
		push( @associated_files, $1 )
		    if(-r $1);	# send mail even if we can't find the graphic.
		$file_already_sent{$1} = 1;
		}
	    }
	}
    elsif( &inlist($default_extension,"csv","pdf","sql","json","tfs","xml" ) )
        {
	$associated_files[0] = &cpi_file::tempfile(".$default_extension");
	&cpi_file::write_file( $associated_files[0], $msg );
	$msg = "The $default_extension file is enclosed as an attachment.";
	}
    &cpi_file::write_file( &cpi_file::tempfile(".tosend.html"), $msg );
    #&cpi_send_file::sendmail( $MAILSRC, $dest, $subj, $msg, @associated_files );
    my $dest_subject = $dest . ":" . $subj;
    if( ! $main::mail_queue{$dest_subject} )
        { push( @{$main::mail_queue{$dest_subject}}, $msg ); }
    else
        { ${$main::mail_queue{$dest_subject}}[0] .= "\n$msg"; }
    push( @{$main::mail_queue{$dest_subject}}, @associated_files ) if(@associated_files);
    return "XL(Mail sent to) $dest";
    }

1;
