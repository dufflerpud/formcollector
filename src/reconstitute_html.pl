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

#use strict;
use lib "/usr/local/lib/perl";
use cpi_translate qw(xlate);
use cpi_db qw(dbget);
use cpi_file qw(tempfile);



my $html;
my $HTMLMODE	= "readonly";
my $cidnum	= 0;
my $CVT		= "/usr/local/bin/nene";

my %CLASS_TO_STYLE =
    (
    "gray"	=>
	{
	"input_ok"		=> "color:black;background-color:white",
	"input_unanswered"	=> "color:black;background-color:gray",
	"input_abnormal"	=> "color:black;background-color:white;".
				    "border-style:dashed;border-width:3",
	"input_required"	=> "color:black;background-color:white;".
				    "border-style:dashed;border-width:3"
        },
    "color"	=>
	{
	"input_ok"		=> "color:black;background-color:#87cefa",
	"input_unanswered"	=> "color:black;background-color:#f0e68c",
	"input_abnormal"	=> "color:black;background-color:#f08080",
	"input_required"	=> "color:black;background-color:$f08000"
	}
    );

my %DIVS = ( "class"=>" ", "style"=>";" );

my $argp;
our $current_key;

#########################################################################
#	Convert a token name to a pretty string such as:		#
#		"Patient_identification"				#
#	to								#
#		"Patient idenfitication"				#
#########################################################################
sub token_to_text
    {
    my( $ret ) = @_;
    &stack_trace("token_to_text called with undef") unless defined($ret);
    $ret =~ s+_+ +g;
    return $ret;
    }

#########################################################################
#	Find out which index of the DIGITS array contains argument.	#
#########################################################################
sub indexof
    {
    my( $n, @to_check ) = @_;
    for( my $ind=0; defined($to_check[$ind]); $ind++ )
        { return $ind if( $LEGAL_LABELS[$ind] eq $n ); }
    return -1;
    }

#########################################################################
#	Print a command and execute it.					#
#########################################################################
sub system_cmd
    {
    my( $cmd ) = @_;
    print STDERR "+ $cmd\n";
    system( $cmd );
    }

#########################################################################
#	Go get a copy of the image and convert it to desired type.	#
#	Return name of created file.					#
#########################################################################
sub get_image
    {
    my( $image_src, $endext ) = @_;
    $image_src =~ s+formcollector/shared+shared+;
    $image_src = "shared/signature.jpg" if( !defined($image_src) || $image_src eq "");
    print STDERR "get_image($image_src)\n";

    # Fix up the URL
    my $full_url;
    if( $image_src =~ /^http:/ )
        { $full_url = $image_src; }
    elsif( $image_src =~ /^\// )
	{ $full_url = "http://$ENV{SERVER_NAME}:$ENV{SERVER_PORT}$image_src"; }
    else
        {
        $full_url = $cpi_vars::URL;
	#$full_url =~ s+/[^/]*$+/$image_src+;
	#$full_url =~ s+/[^/]*\.cgi$+/$image_src+;
	if( $image_src =~ /\// )
	    { $full_url =~ s+\.cgi$+/$image_src+; }
	else
	    { $full_url =~ s+\.cgi$+/$form_type/$image_src+; }
#	if( $image_src =~ m+shared/+ )
#	    { $full_url =~ s+/[^/]*\.cgi$+/$image_src+; }
#	else
#	    { $full_url =~ s+/[^/]*\.cgi$+/$form_type/$image_src+; }
	}
    my $resulting_file = &tempfile() . "." . $endext;
    my $cmd = "$WGET -q -O - '$full_url' 2>/dev/null";

    my $endtype =   ( ($endext eq "jpg") ? "jpeg" : $endext );
    #If can't determine source extension from URL, assume it IS desired type.
    my $srctype =   ( ( $full_url =~ /\.([^\.]+)$/ )
		    ? ( ($1 eq "jpg") ? "jpeg" : $1 )
    		    : $endtype
		    );

#    #Overly simplistic, but it will work with jpeg & pnm files.
#    $cmd .= " | ${srctype}to${endtype}" if( $srctype ne $endtype );
#
#    $cmd .= " > '$resulting_file'";
    if( $srctype eq $endtype )
        { $cmd .= "> $resulting_file"; }
    elsif( -f $CVT )
        { $cmd .= "| $CVT -.$srctype $resulting_file"; }
    else
	{
	$cmd .= "| " .
	    ( $srctype eq "jpg" ? "jpeg" : $srctype ) .
	    "to" .
	    ( $endtype eq "jpg" ? "jpeg" : $endtype ) .
	    " > $resulting_file";
	}
    print STDERR "Trying [$cmd]\n";
    system( $cmd );
    return $resulting_file;
    }

#########################################################################
#########################################################################
sub full_records
    {
    my( $argp, @keys_to_dump ) = @_;
    $cidnum = 0;
    my @new_html = ();
    open( DBG, "> /tmp/debug" );
    foreach my $current_key ( @keys_to_dump )
	{
	my $khtml = &DBFget($current_key,"html");
print DBG "Starting with [$khtml]\n";
	if( !defined($khtml) || $khtml eq "" )
	    {
	    push( @new_html, "<tr bgcolor=red><th colspan=2>",
	    	"XL(Key) $current_key",
		" XL(HTML is corrupt)</th></tr>");
	    }
	else
	    {
	    print DBG "new_html 1 contains [", join("::", @new_html ), "]\n";
	    foreach my $img_piece ( split(/(<img.*?>)/, $khtml ) )
		{
		print DBG "new_html 3 contains [", join("::", @new_html ), "]\n";
		if($img_piece =~ /<img class=rowdata name='(.*)' src='(.*)' labels='(.*)'>/)
		    {
		    my ( $varname, $image_src, $lblclues ) = ( $1, $2, $3 );
		    my $val = &DBFget( $current_key, $varname );
		    my $file_name = &tempfile(".jpg");
		    my %let_to_labelitem = ();
		    my %labelitem_to_let = ();
		    if( $lblclues )
			{
			foreach my $label ( split(/,/,$lblclues) )
			    {
			    $label =~ m/^(.)(.*)/;
			    my $labelitem = $2;
			    my $labellet = $1;
			    if( defined($labellet) && $labellet ne "" )
				{
				$let_to_labelitem{$labellet}	= $labelitem;
				$labelitem_to_let{$labelitem}	= $labellet;
				}
			    }
			}
		    my $last_x;
		    my $last_y;
		    my $retrieved_file = &get_image( $image_src, "pnm" );
		    my $modified_pnm_file = &tempfile() . ".pnm";
		    open( OUT, "| tee $modified_pnm_file.cmds | $PPMDRAW -scriptfile=- $retrieved_file > $modified_pnm_file" )
			|| die("Cannot run $PPMDRAW:  $!");
		    print OUT "setcolor #0000ff;\n";
		    foreach my $point ( grep(/\w/, split(/([^\w]\w+)/,$val)) )
			{
			if( $point =~ /(.)(\w)(\w)(\w)(\w)(.*)/ )
			    {
			    my $fnc = $1;
			    my $x = &indexof($2,@LEGAL_LABELS)
				    * scalar(@LEGAL_LABELS)
				+ &indexof($3,@LEGAL_LABELS);
			    my $y = &indexof($4,@LEGAL_LABELS)
				    * scalar(@LEGAL_LABELS)
				+ &indexof($5,@LEGAL_LABELS);
			    my $item = $6;
			    if( $fnc eq "-" )
				{ print OUT "line_here ",($x-$last_x)," ",($y-$last_y),";\n"; }
			    elsif( $fnc eq " " )
				{ print OUT "setpos $x $y;\n"; }
			    elsif( $fnc eq "/" )
				{
				my $chr;
				if( !defined($chr = $labelitem_to_let{$item}) )
				    {
				    foreach $chr ( split(//,$item), @LEGAL_LABELS )
					{
					if( ! defined($let_to_labelitem{$chr}) )
					    {
					    $let_to_labelitem{$chr} = $item;
					    $labelitem_to_let{$item} = $chr;
					    last;
					    }
					}
				    }
				#This should work but ppmdraw-fc10-static
				# doesn't handle the quotes correctly.
				#print OUT "setpos $x $y;\ntext_here 10 0 '$chr';\n";
				print OUT "setpos $x $y;\ntext_here 10 0 \"$chr\";\n";
				}
			    $last_x = $x;
			    $last_y = $y;
			    }
			}

		    close( OUT );
		    &system_cmd( "$PNMTOJPEG < $modified_pnm_file > $file_name" );
		    push( @new_html, "<img src=\"" .
			(  ( $argp->{transmitter_type}
			  && $argp->{transmitter_type} eq "e-mail"
			  && $argp->{dumper_type}
			  && $argp->{dumper_type} eq "HTML" )
			? "cid:" : "file://" ) .
			"$file_name\">" );
		    }
		elsif(	$img_piece =~ /(<img.*?\ssrc=)'(.*?)'(.*?>)/s
		    ||	$img_piece =~ /(<img.*?\ssrc=)"(.*?)"(.*?>)/s
		    ||	$img_piece =~ /(<img.*?\ssrc=)(.*?)(\s.*?>)/s
		    ||	$img_piece =~ /(<img.*?\ssrc=)(.*?)(>)/s	)
		    {
		    my( $prefix, $url, $suffix ) = ( $1, $2, $3 );
		    my $retfile;
		    if( $url =~ /data:image\/jpeg;base64,(.*)/ )
			{
			my $contents = $1;
			$retfile = &tempfile() . ".jpg";
			open( B64, "| base64 -d > $retfile" )
			    || die("Cannot base64:  $!");
			print B64 $contents;
			close( B64 );
			}
		    elsif( $suffix =~ /id=display_(.*)>/ )
		        {
			my( $fldname ) = $1;
			$retfile = "$AUX_FILES/$form_type/$current_key/$fldname.jpg";
			print STDERR "retfile=[$retfile]\n";
			}
		    else
			{ $retfile = &get_image( $url, "jpg" ); }
		    push( @new_html, $prefix, '"',
			( ($argp->{transmitter_type} eq "e-mail")
			    ? "cid:" : "file://" ),
			$retfile, '"', $suffix );
		    }
		else
		    {
		    print DBG "new_html 4 contains [", join("::", @new_html ), "]\n";
		    foreach my $but_piece (
			split(/(<span[^>]*?><input[^>]*go_get_file\(.*?><\/span>)/,$img_piece) )
			{
			print DBG "new_html 5 contains [", join("::", @new_html ), "]\n";
			if( $but_piece =~ /.*go_get_file\("(.*?)"\)/s )
			    {
			    print DBG "GGF logic [$but_piece]\n";
			    my $field_name = $1;
			    my $retfile =
			        "$AUX_FILES/$form_type/$current_key/$field_name";
			    my $fieldval = &DBFget( $current_key, $field_name );
			    print STDERR "Go_get_file($field_name) returns [$fieldval]\n";
			    $retfile .= ".$1"
				if( $fieldval =~ /.*\.([^.\/]*)$/ );
			    push( @new_html,
				( $argp->{transmitter_type} eq "e-mail" )
				? "<br>(See \"cid:$retfile\")"
				: "<br>(Data in $retfile)"
				);
			    }
			else
			    {
			    print DBG "Skipping [$but_piece]\n";
			    push( @new_html,$but_piece);
			    }
			print DBG "new_html 7 contains [", join("::", @new_html ), "]\n";
			}
		    }
		print DBG "new_html 6 contains [", join("::", @new_html ), "]\n";
		}
	    }
	print DBG "new_html 2 contains [", join("::", @new_html ), "]\n";
	}
    push( @new_html, "</table>" );
    if( $argp->{colorind} )
	{
	my $colorind = $argp->{colorind};
	my $html = join("",@new_html);
	@new_html = ();
	foreach my $htmlpiece ( split(/(<.*?>)/s,$html) )
	    {
	    if( $htmlpiece !~ /^<(.*)>$/s )
	        { push( @new_html, $htmlpiece ); }
	    else
	        {
		push( @new_html, "<" );
		my %parts = ();
		foreach my $tagpiece ( split(
    /\s*(class=\w+|class=".*?"|class='.*?'|style=\w+|style=".*?"|style='.*?')/,
    		    $1 ) )
		    {
		    if( $tagpiece =~ /(class|style)=(\w+)/ )
		        { push( @{$parts{$1}}, $2 ); }
		    elsif( $tagpiece =~ /(class|style)=.(.*)./ )
		        { push( @{$parts{$1}}, $2 ); }
		    else
		        { push( @new_html, $tagpiece ); }
		    }
		my @newclass = ();
		foreach my $classpart ( @{$parts{class}} )
		    {
		    if( $CLASS_TO_STYLE{$colorind}{$classpart} )
		        {push(@{$parts{style}},$CLASS_TO_STYLE{$colorind}{$classpart});}
		    else
		        {push(@newclass,$classpart);}
		    }
	        @{$parts{class}} = @newclass;
		foreach my $part ( keys %parts )
		    {
		    push( @new_html, " ", $part, "='",
		        join( $DIV{$part}, @{$parts{$part}} ),
			"'" ) if( @{$parts{$part}} );
		    }
		push( @new_html, ">" );
		}
	    }
	}
    close( DBG );
    return join("",@new_html);
    }

#########################################################################
#	Filter the template file doing variable substitutions and	#
#	evaluating expressions (vs. generating javascript to do it).	#
#########################################################################
sub main::generate_html
    {
    my( $set_argp, @keys_to_dump ) = @_;
    $argp = $set_argp;
    my $prettyname =
	&dbget($cpi_vars::ACCOUNTDB,"users",$cpi_vars::USER,"fullname");
    $prettyname = $cpi_vars::USER if( ! $prettyname );
    my $css_url = &DBFget("css_url");

    my($sec,$min,$hour,$mday,$month,$year) = localtime(time);
    my $now = sprintf("%02d/%02d/%4d %02d:%02d",
	$month+1, $mday, $year+1900, $hour, $min );

    my $dest = $argp->{dest};
    my $subj = $argp->{subj};
    my $css_files = "";

    $css_files .= &get_abs_url($css_url) if( $css_url );
    $css_files .= &get_abs_url("Print.css");
    $css_files .= &get_abs_url("$cpi_vars::PROG/shared/states.css");

    $html = <<EOF;
<!doctype html><html lang=en><head>
<style type="text/css">
<!--
$css_files
$STATE_DEFS$css
-->
</style>
</head>
<body $cpi_vars::BODY_TAGS>
<table bgcolor="#c0e0f0" frame=border>
<tr><th align=left>XL(Created by):</th><td>$prettyname</td></tr>
<tr><th align=left>XL(Sent to):</th><td>$dest</td></tr>
<tr><th align=left>XL(Subject):</th><td>$subj</td></tr>
<tr><th align=left>XL(Sent):</th><td>$now</td></tr>
EOF
    if( ! $argp->{fields} )
        { $html .= &full_records($argp,@keys_to_dump); }
    elsif( $reports{$thisrep}{"_report_type"} eq "Graph" )
	{ $html .= &graph_report(0,$argp,@keys_to_dump); }
    elsif( $reports{$thisrep}{_report} )
	{ $html .= &{$reports{$thisrep}{_report}}(0,$argp,@keys_to_dump); }
    else
        { $html .= &html_report(0,$argp,@keys_to_dump); }
    return &xlate( $html );
    }
1;
