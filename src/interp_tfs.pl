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
use lib "/usr/local/lib/perl";

use cpi_file qw( cleanup fatal read_file write_file );
use cpi_arguments qw( parse_arguments );
use cpi_vars;

#########################################################################
#	Global constants						#
#########################################################################

$cpi_vars::PROG = ( $_ = $0, s+.*/++, s/\.[^\.]*$//, $_ );

our %ONLY_ONE_DEFAULTS =
    (
    "d"		=>	"",
    #"i"	=>	"Dialog.tfs",
    "i"		=>	"/dev/stdin",
    #"o"	=>	"Dialog.js",
    "o"		=>	"/dev/stdout"
    );

my @FIELD_TYPES =
    ("text",
    "datetime",
    "daysbefore","timebefore",
    "daysafter","timeafter",
    "GPS",
    "address","citystatezip","hidden",
    "oneof","anyof","yesno","yesnodetail","boolean",
    "drawing","signature","file");

my @PRESENTATIONS = ( "select", "buttons", "checks", "just_date", "just_time" );
my @PREFERRED_ORDER =
    ("name","type","headertext","prompttext","presentation","rows","cols",
    "height","width","must","should","default","choices");

my $SPACING_INC = "\t";
$SPACING_INC=" ";

my @POSSIBLE_PARAMETERS = ( "labelclass", "dataclass", "sectionclass" );

my %SEP = ( "REC"=>"-SEP0-", "FIELD"=>"-SEP1-" );

my @QUOTES = ( '"', "'" );

my $SWITCHVAL = "_switchval";

my $REQUIRE_TERM = 1;
my $ALLOW_OLD_SYNTAX = 1;

my %BUILT_IN = map { $_, 1 } ( "now", "this" );

# Put interesting subroutines here

my @put_at_end_of_def = ();

#########################################################################
#	Global variables						#
#########################################################################
our %ARGS;
my @files;
my $linenum;		# For error messages
my @toks;		# Enter file is broken into tokens
my %using_functions;	# Functions we have seen in expressions
my %expression_vars;	# Variables we have seen in expressions
my %set_vars;		# Variables we have seen set
my %generated_vars;	# Variables we have asked for
my @problems;
my $prefixes;
my $space_over;
my $pass;
my %save_generated_vars;
my $exit_stat = 0;

#########################################################################
#	Print usage message and die.					#
#########################################################################
sub usage
    {
    &fatal( @_, "",
	"Usage:  $cpi_vars::PROG <possible arguments>","",
	"where <possible arguments> is:",
	"    -i <tfs_file>",
	"    -o <js_file>",
	"    -d <debug_file>"
	);
    }

#########################################################################
#	Setup		# Setup world and reset it between passes	#
#########################################################################
sub interp_tfs_setup
    {
    $pass = $_[0];		# Set the pass number
    $linenum = 1;		# For error messages
    %using_functions=();	# Functions we have seen in expressions
    %expression_vars=();	# Variables we have seen in expressions
    %set_vars=();		# Variables we have seen set
    %generated_vars=();		# Variables we have asked for
    @problems = ();
    $prefixes = "";
    $space_over = 0;
    print STDERR "Pass ${pass}:\n";
    }

#########################################################################
#	Print data to the file (but only on pass 1).			#
#########################################################################
sub output
    {
    print OUT @_ if( $pass == 1 );
    }

#########################################################################
#	Print an error message and die with a stack trace.		#
#########################################################################
sub stack_trace
    {
    my( $msg, $excode ) = @_;
    print STDERR "${msg}:\n";
    my $i = 0;
    my($pack,$file,$line,$subname,$hasargs,$wantarray);
    while( ($pack,$file,$line,$subname,$hasargs,$wantarray) = caller($i++) )
        {
	print STDERR "    ${file}:$line $subname\n";
	}
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
    $s =~ s+\\+\\\\+gs;
    $s =~ s/$use_q/\\$use_q/gs;
    #$s =~ s+[\r\n\s]*\n+\\n+gs;
    $s =~ s/[\r\n\s]+/ /gs;
    if( ! $xlflag )
	{ return ($use_q . $s . $use_q); }
    elsif( $s !~ /[\(\)]/ )
	{ return ($use_q."XL(".$s.")".$use_q); }
    elsif( $s !~ /[\[\]]/ )
	{ return ($use_q."XL[".$s."]".$use_q); }
    elsif( $s !~ /[{}]/ )
	{ return ($use_q."XL{".$s."}".$use_q); }
    else
        { &fatal("Do not know how to XL '$s'."); }
    }

#########################################################################
#	Assume we're parsing a string:  Swallow tokens until we see	#
#	the trailing quote (").  Allow quotes to be escaped with a	#
#	backslash (\).							#
#########################################################################
sub parse_string
    {
    my( $quotechar ) = @_;
    my $s;
    my @str = ();
    while( defined($s = shift(@toks)) )
	{
        last if( $s eq $quotechar );
	$s = shift(@toks) if( ($s eq '\\') && ($toks[0] eq $quotechar));
	push( @str, $s );
	$linenum += scalar( &inlist( "\n", split(//s,$s) ) );
	}
    return join( "", @str );
    }

#########################################################################
#	Get the next token (getting rid of comments and empty space).	#
#########################################################################
my $sep_tokens;
sub next_token
    {
    my( $msg_linenum ) = @_;
    my $s;
    $sep_tokens = "";
    while( defined($s = shift(@toks)) )
	{
        if( $s eq "#" || $s eq "//" )	# Comment, skip everything to new line
	    {
	    $sep_tokens .= $s;
	    while( defined($s = shift(@toks)) && $s !~ /\n/ )
		{ $sep_tokens .= $s; }
	    $linenum++;
	    $sep_tokens .= $s;
	    }
	elsif( $s =~ /\s/ )	# White space, skip but keep track of line #
	    {
	    $linenum += scalar( &inlist( "\n", split(//s,$s) ) );
	    $sep_tokens .= $s;
	    }
	elsif( $s ne "" )	# Something real, return it
	    {
	    last;
	    }
	else			# empty token, skip it
	    {
	    }
	}
#    print STDERR "next_token at src $msg_linenum txt $linenum returning ",
#        ( defined($s) ? "[$s]" : "EOF" ), ".\n";
    return $s;
    }

#########################################################################
#	Get the next token and verify it is the argument.  In the case	#
#	of a string, $def must be a quote (") and the value of the	#
#	string is returned.  If the next token is not as expected,	#
#	generate a fatal error (so if it returns at all, it is good).	#
#########################################################################
sub must_be
    {
    my( $pat, $def ) = @_;
    my $qt;
    fatal("Found EOF looking for $pat parsing $def on line $linenum.")
	if( ! defined($qt = &next_token(__LINE__) ) );
    return &parse_string($qt) if( &is_quote($pat) && &is_quote($qt) );
    fatal("Expecting $pat and found '$qt' parsing $def on line $linenum.")
	if( $qt !~ /^$pat$/ );
    return $qt;
    }

#########################################################################
#	Returns true if we're leading into an expression.		#
#########################################################################
sub could_be_expression
    {
    my( $tok ) = @_;
    return ( &is_quote($tok) || $tok=~/^\d+$/ || $tok eq "{" );
    }

my %QUOTE_MAP = ( "{"=>"}", "("=>")", "<"=>">", "["=>"]", "="=>";" );
#########################################################################
#	Parses a javascript expression.					#
#########################################################################
sub parse_js_expr
    {
    my( $oquote ) = @_;
    my $cquote = $QUOTE_MAP{$oquote};
    my $s;
    my @str = ( $oquote );
    while( defined($s = shift(@toks)) )
	{
	if( $s eq $oquote )
	    {
	    push( @str, &parse_js_expr( $oquote ) );
	    }
	elsif( $BUILT_IN{$s} )
	    { push( @str, "lookup('$s')" ); }
	elsif( $save_generated_vars{$s} )
	    { push( @str, "lookup('$s')" ); }
	else
	    {
	    push( @str, $s );
	    if( $s eq $cquote )
		{ last; }
	    elsif( &is_quote($s) )
		{
		my $ns;
		while( defined($ns = shift(@toks)) )
		    {
		    push( @str, $ns );
		    if( $ns eq $s )
			{ last; }
		    elsif( $ns eq '\\' )
			{ push( @str, shift(@toks) ); }
		    }
		}
	    elsif( $s eq "m" )
		{
		# Do we need to remove the m?
		pop( @str );
		#
		my $q = shift(@toks);
		push( @str, $q );
		my $ns;
		while( defined($ns = shift(@toks)) )
		    {
		    push( @str, $ns );
		    if( $ns eq $q )
			{ last; }
		    elsif( $ns eq '\\' )
			{ push( @str, shift(@toks) ); }
		    }
		}
	    }
	}
    return join( "", @str );
    }

#########################################################################
#	Recognize a {} enclosed expression, do some syntax checking but	#
#	just pass it on to the template file.				#
#########################################################################
sub parse_expression
    {
    my ( $quote, $skiptr ) = @_;
    $quote = &next_token(__LINE__) if( ! defined($quote) );
    if( &is_quote($quote) )
        {
	return &add_quotes( &parse_string($quote), $skiptr ? 0 : 1 );
	}
    elsif( $quote =~ /^\d+$/ )
        {
	my $num = $quote;
	if( defined($toks[0]) && $toks[0] eq "." )
	    {
	    $num .= shift(@toks);
	    $num .= shift(@toks) if( defined($toks[0]) && $toks[0] =~ /^\d+$/ );
	    }
	return $num;
	}
    elsif( $QUOTE_MAP{$quote} )
	{
	my $e = &parse_js_expr($quote);
	$linenum += scalar( &inlist( "\n", split(//s,$e) ) );
	#&output( "[[[$e]]]\n");
	return ( ($e =~ /^{(.*)}$/) ? $1 : $e );
	}
    else
        {
	fatal("Expecting constant or { parsing expression and got $quote at line $linenum.");
	}
    }

#########################################################################
#	Set variable if next matches a patter, else put token back.	#
#########################################################################
sub var_if_pattern
    {
    my( $pattern, $default_value ) = @_;
    my $next_value = &next_token( __LINE__ );
    if( defined($next_value) )
	{
	if( &is_quote($pattern) )
	    { return &parse_string($next_value) if( &is_quote($next_value) ); }
	else
	    { return $next_value if( $next_value =~ /^$pattern$/ ); }
	unshift( @toks, $next_value );
	}
    return $default_value;
    }

#########################################################################
#	Convert a token name to a pretty string such as:		#
#		"Patent_identification"					#
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
#	Convert an artitrary string to something we can use as a	#
#	variable name in expressions.					#
#########################################################################
sub text_to_token
    {
    my( $ret ) = @_;
    $ret =~ s/[^\w]+/_/g;
    return $ret;
    }

#########################################################################
#	Makes for better looking javascript if extra parens omitted	#
#	when there is no way that js interpretter will get confused.	#
#########################################################################
sub add_parens
    {
    my( $s ) = @_;
    return $s if(
        $s=~/^\d+$/ || $s=~/^\d+\.$/ || $s=~/^\d+\.\d+$/
	|| ( $s =~ /^(.)(.*)(.)$/
	    && &is_quote($1) && $1 eq $3 && $2 !~ /$1/ ) );
    return "(" . $s . ")";
    }

#########################################################################
#	Swallow the trailing semicolon					#
#########################################################################
sub terminate_command()
    {
    if( $REQUIRE_TERM )
        { &must_be(";","End of command"); }
    else
        { &var_if_pattern(";"); }
    }

#########################################################################
#	Parse a compound statement.					#
#########################################################################
sub parse_compound
    {
    my( $spacing, $islist, $listexpr ) = @_;
    $spacing .= $SPACING_INC;
    my $save_prefixes = $prefixes;
    my $save_space_over = $space_over;
    my $need_end_section = 0;
    my $tok;
    my $with_text;
    my $prefix;
    # &output( $spacing, "// Parsecompound islist=$islist.\n");
    &output( $spacing, "{");
    if( &var_if_pattern("section") )
	{
	my $section_title = &parse_expression();
	&output( $spacing, "section(", $section_title, ");\n");
	$need_end_section = 1;
	}
    if( &var_if_pattern("with") )
	{
	if( defined($prefix=&var_if_pattern("\\w+")) )
	    {
	    $prefixes .= $prefix . "_";
	    &output( "prefixes=\"$prefixes\";");
	    }
	if( defined($with_text = &var_if_pattern("'") ) )
	    {
	    $space_over++;
	    &output( "do_html(\"<b>\"+",
		&add_quotes($with_text,1),
		"+\"</b>\", 0 );space_over=$space_over;");
	    }
	}
    &output( "\n");
    #printf("%s// line=%d, linenum=%d islist=%d.\n",$spacing,__LINE__,$islist);

    &must_be("{","Compound statement");

    my @put_at_end_of_def = ();
    &parse_statements( $spacing, $islist, $listexpr, $prefix, $with_text, $save_prefixes, $save_space_over );

    &output( $spacing );
    if( $prefix )
        {
	$prefixes = $save_prefixes;
	&output( "prefixes=\"$save_prefixes\";" );
	}
    if( $with_text )
        {
	$space_over = $save_space_over;
	&output( "space_over=$space_over;" );
	}

    &output( "end_section();" ) if( $need_end_section );

    &output( "}\n" );
    }

#########################################################################
#	Deprecated commands						#
#########################################################################
sub deprecated_command
    {
    my( $tok, $spacing ) = @_;

    if( ! $ALLOW_OLD_SYNTAX )
        { return 0; }
    elsif( $tok eq "table" )
	{
	my $table_width = &must_be("\\d+","Table width");
	&output( $spacing,
	    "set_to({what:\"table_columns\",value:$table_width});\n" );
	&terminate_command();
	}
    elsif( $tok eq "setdefault" )
	{
	$tok = &must_be( join("|",@POSSIBLE_PARAMETERS),
	    "setdefault parameter name");
	my $expr = &parse_expression();
	&output($spacing,"set_to({what:\"default\",field:\"$tok\",$expr});\n");
	&terminate_command();
	}
    elsif( $tok eq "setstart" )
	{
	my $end_expr = &parse_expression();
	&output( $spacing, "set_to({what:\"start\",value:$end_expr});\n" );
	&terminate_command();
	}
    elsif( $tok eq "set" )
	{
	my $varname = &must_be("\\w+","set variable name");
	my $expr = &parse_expression();
	&output( $spacing,
	    "set_to({what:\"form\",field:\"$varname\",value:$expr});\n" );
	&terminate_command();
	}
    elsif( $tok eq "page" )
	{
	my $prev_expr = "Previous";
	my $next_expr = "Next";
	$tok = &next_token(__LINE__);
	unshift( @toks, $tok );
	if( &could_be_expression($tok) )
	    {
	    $prev_expr = &parse_expression();
	    $next_expr = $prev_expr;
	    $tok = &next_token(__LINE__);
	    unshift( @toks, $tok );
	    if( &could_be_expression($tok) )
	        {
		$next_expr = &parse_expression();
		}
	    }
	&output( $spacing, "new_page($prev_expr,$next_expr);\n" );
	&terminate_command();
	}
    else
        { return 0; }
    return 1;
    }

#########################################################################
#	Parse statements one followed by another			#
#########################################################################
sub parse_statements
    {
    my( $spacing, $islist, $listexpr, $prefix, $with_text, $save_prefixes, $save_space_over ) = @_;
    my $tok;
    while( defined($tok = &next_token(__LINE__)) && $tok ne "}" )
	{
	#&output( $sep_tokens );
	&output( ( $sep_tokens =~ /\n/s ? "\n" : " " ) )
	    if( $sep_tokens ne "" );
	if( &deprecated_command( $tok, $spacing ) )
	    { }
	elsif( &inlist($tok,"with","section","{") )
	    {
	    unshift( @toks, $tok );
	    &parse_compound( $spacing, $islist, $listexpr );
	    }
	elsif( $tok eq "if" )
	    {
	    if( $_ = &var_if_pattern("\\w+") )
	        {
		my $varname = $_;
		my $vartext = &var_if_pattern("'",&token_to_text($varname));
		my $allowunknown = (&var_if_pattern("unknown") ? " unknown":"");
		unshift( @toks, &tokenize(<<EOF,1));
		    yesno $varname "$vartext"$allowunknown ;
		    if { $varname == "Yes" }
EOF
		}
	    else
		{
		my $expr = &parse_expression();
		&output( $spacing, "if( $expr )\n" );
		&parse_compound($spacing,$islist,$listexpr);
		my $elseiftok;
		while( $elseiftok=&var_if_pattern("elseif|else") )
		    {
		    if( $elseiftok eq "else" && var_if_pattern("if") )
		        { $elseiftok = "elseif"; }
		    if( $elseiftok eq "elseif" )
		        {
			$expr = &parse_expression();
			&output( $spacing, "else if( $expr )\n" );
			&parse_compound($spacing,$islist,$listexpr);
			}
		    else
		        {
			&output( $spacing, "else\n" );
			&parse_compound($spacing,$islist,$listexpr);
			last;
			}
		    }
		}
	    }
	elsif( $tok eq "switch" )
	    {
	    my $expr = &parse_expression();
	    &must_be("{","Switch body");
	    &output( $spacing, "{var $SWITCHVAL=($expr);\n" );
	    my $switch_value;
	    my $sep = "";
	    while( defined( $switch_value = &var_if_pattern("'")) )
	        {
		&output( $spacing, $SPACING_INC, $sep,
		    "if($SWITCHVAL==", &add_quotes($switch_value), ")\n" );
		&parse_compound($spacing.$SPACING_INC,$islist,$listexpr);
		$sep = "else ";
		}
	    if( &var_if_pattern("default") )
	        {
		&output( $spacing, $SPACING_INC, $sep, "\n" );
		&parse_compound($spacing.$SPACING_INC,$islist,$listexpr);
		}
	    &must_be("}","End of switch body");
	    &output( $spacing, "}\n" );
	    }
	elsif( $tok eq "list" )
	    {
	    &output( $spacing, "tripvar.push(false); varcontexts.push(-1);",
		" while(!tripvar[tripvar.length-1]){varcontexts[varcontexts.length-1]++;\n" );
	    &parse_compound($spacing,1,
		( &var_if_pattern("until")
		? &parse_expression()
		: undef
		) );
	    &output( $spacing, "} varcontexts.pop(); tripvar.pop();\n" );
	    }
	elsif( $tok eq "html" )
	    {
	    my $html_expr = &parse_expression();
	    my $cols = 0;
	    my $html_class = '"exposition"';
	    while( 1 )
		{
		if( &var_if_pattern("cols") )
		    { $cols = &must_be("\\d+","columns"); }
		elsif( &var_if_pattern("class") )
		    { $html_class = &parse_expression(); }
		elsif( $_ = &var_if_pattern("\\d+") )
		    { $cols = $_; }
		else
		    { last; }
		}

	    &output( $spacing, "do_html(", $html_expr, ",$cols,",
		$html_class, ");\n" );
	    &terminate_command();
	    }
	elsif( &inlist($tok,@FIELD_TYPES) )
	    {
	    my %varargs = ( "type" =>$tok );
	    if( $islist==1 )
	        {
		$varargs{flags} .= ($varargs{flags}?",":"")."adddel";
		$varargs{adddelname} = &add_quotes($with_text,1)
		    if( $with_text );
#		if( ! &inlist($tok,"oneof","anyof" ) )
#		    {
#		    &output( $spacing, "fred\n" );
#		    $islist = 2;
#		    }
		}

	    if( &inlist( $tok, "yesno", "yesnodetail" ) )
		{
		$varargs{type} = "oneof";
		push(@{$varargs{choices}},
		    ['"Yes"','"XL(Yes)"'], ['"No"','"XL(No)"']);
		$varargs{presentation} = "checks";
		$varargs{name} = &must_be("\\w+",$tok);
		$tok = &next_token(__LINE__);

		if( defined($tok)
		    && $tok !~ /^\d+$/
		    && &could_be_expression($tok) )
		    {
		    $varargs{prompttext} = &parse_expression($tok);
		    $tok = &next_token(__LINE__);
		    if( defined($tok)
			&& $tok !~ /^\d+$/
			&& &could_be_expression($tok) )
			{ $varargs{headertext} = &parse_expression($tok); }
		    }
		$varargs{prompttext} =
		    &add_quotes(&token_to_text($varargs{name}),1)
		    if( !defined($varargs{prompttext}) );
		if( !defined($varargs{headertext}) )
		    {
		    unshift(@toks,$tok);
		    $varargs{headertext} =
			&add_quotes(&token_to_text($varargs{name}),1)
		    }
		push( @{$varargs{choices}}, ['"Unknown"','"XL(Unknown)"'] )
		    if( &var_if_pattern("unknown") );
		unshift(@toks, &tokenize(<<EOF,1)) if( $tok eq "yesnodetail" );
		    if { $varargs{name} == "Yes" }
			{
			text $varargs{name}_detail -
EOF
		# } so text editor brace matching continues to sort of work
		}

	    while( $tok = &next_token(__LINE__) )
		{
		#print STDERR "parse tok [$tok]\n";
		if( $tok =~ /^\d+$/ )
		    {
		    if( ! defined($varargs{cols}) )
			{ $varargs{cols} = $tok; }
		    elsif( ! defined($varargs{rows}) )
			{
			$varargs{rows} = $varargs{cols};
			$varargs{cols} = $tok;
			}
		    else
			{
			push(@problems,"Rows or columns specified multiple times on line $linenum.");
			}
		    }
		elsif( &could_be_expression($tok) )
		    {
		    if( ! defined( $varargs{prompttext} ) )
			{ $varargs{prompttext} = &parse_expression($tok); }
		    elsif( ! defined( $varargs{headertext} ) )
			{ $varargs{headertext} = &parse_expression($tok); }
		    else
			{
			push(@problems,"Label text and/or prompt specified"
			    . " multiple times for variable $varargs{name}"
			    . " on line $linenum."
			    );
			}
		    }
		elsif( $tok eq "[" )
		    {
		    &fatal("Possible values specified multiple times on line $linenum")
			if( $varargs{choices} );
		    while( defined($tok = &next_token(__LINE__)) && $tok ne "]" )
			{
			my( $val, $txt, $label );
			if( &could_be_expression($tok) )
			    {
			    $val = $txt = &parse_expression($tok);
			    }
			elsif( $tok =~ /^\w+$/ )
			    {
			    $val = &add_quotes($tok);
			    $txt = &add_quotes( &token_to_text($tok), 1 );
			    }
			else
			    {
			    &fatal("Expecting {, value or quoted value and got \"$tok\" on line $linenum.");
			    }
			&fatal(__LINE__.": Expecting text, a comma or end of choices at line $linenum." )
			    if( !defined($tok = &next_token(__LINE__) ) );
			if( &could_be_expression($tok) )
			    { $txt = &parse_expression($tok); }
			elsif( $tok =~ /^\w+$/ )
			    { $txt = &add_quotes($tok,1); }
			else
			    { unshift(@toks,$tok); }
			&fatal(__LINE__.": Expecting label, a comma or end of choices at line $linenum." )
			    if( !defined($tok = &next_token(__LINE__) ) );
			if( &could_be_expression($tok) )
			    { $label = &parse_expression($tok); }
			elsif( $tok =~ /^\w+$/ )
			    { $label = &add_quotes($tok); }
			else
			    { unshift(@toks,$tok); }
			&fatal(__LINE__.": Expecting a comma or end of choices at line $linenum." )
			    if( !defined($tok = &next_token(__LINE__) ) );
			if( $tok eq "," )
			    {}
			elsif( $tok eq "]" )
			    { unshift(@toks,$tok); }
			else
			    { &fatal(__LINE__.": Expecting a comma or end of choices at line $linenum." ); }
			$val = &add_parens($val);
			$txt = &add_parens($txt);
			push( @{$varargs{choices}},
			    ( defined($label)
			    ? [$val,$txt,&add_parens($label)]
			    : [$val,$txt] ) );
			}
		    }
		elsif( $tok eq "-" )
		    {
		    push( @put_at_end_of_def, "}" );
		    }
		elsif( &inlist( $tok, @PRESENTATIONS ) )
		    {
		    push(@problems,
			join(" or ",@PRESENTATIONS) .
			" specified multiple times on line $linenum.")
			if( $varargs{presentation} );
		    $varargs{presentation} = $tok;
		    }
		elsif( $tok eq "presentation" )
		    {
		    push(@problems,
			join(" or ",@PRESENTATIONS) .
			" specified multiple times on line $linenum.")
			if( $varargs{presentation} );
		    $varargs{$tok} = &must_be("'",$tok);
		    print STDERR "varargs{$tok}=[$varargs{$tok}]\n";
		    }
		elsif( &inlist($tok,
		    "markup","line_per","no_none","no_clear","random_order",
		    "other","disabled","required","persistent","no_advance"))
		    {
		    push(@problems,"$tok specified multiple times on line $linenum.")
			if( defined($varargs{$tok}) );
		    $varargs{"flags"} .= ($varargs{flags}?",":"")."$tok";
		    }
		elsif( &inlist( $tok,
		    "prompttext","headertext",
		    "must", "should", "default",
		    "before", "after", "submit",
		    "background", "suffix", "help", "legalcharacters",
		    "buttonpicture",
		    "labelcols", "datacols",
		    "labelclass", "dataclass",
		    "rows", "cols",
		    "width", "height",
		    "resolution"
		    ) )
		    {
		    push(@problems,"$tok expression specified multiple times on line $linenum.")
			if( defined($varargs{$tok}) );
		    my $nexttok;
		    if( ($nexttok=&var_if_pattern("int_between"))	||
			($nexttok=&var_if_pattern("float_between"))	)
			{
			my ( $minv, $maxv, $step, $allow_plus );
			if( &var_if_pattern("\\+") )
			    { $allow_plus = $minv = &must_be("\\d+|\\d+\\.\\d+",$tok); }
			elsif( &var_if_pattern("-") )
			    { $minv = - &must_be("\\d+|\\d+\\.\\d+",$tok); }
			else
			    { $minv = &must_be("\\d+|\\d+\\.\\d+",$tok); }
			if( &var_if_pattern("\\+") )
			    { $allow_plus = $maxv = &must_be("\\d+|\\d+\\.\\d+",$tok); }
			elsif( &var_if_pattern("-") )
			    { $maxv = - &must_be("\\d+|\\d+\\.\\d+",$tok); }
			else
			    { $maxv = &must_be("\\d+|\\d+\\.\\d+",$tok); }

			$step = &var_if_pattern("\\d|\\d\.\\d",0);
			if( $tok eq "must" )
			    {
			    my $lminv = length($minv);
			    my $lmaxv = length($maxv);
			    unshift( @toks, ($lminv>$lmaxv ? $lminv : $lmaxv) );
			    my $legalchars = "789456123";
			    $legalchars .= "-" if($minv < 0);
			    $legalchars .= "0";
			    $legalchars .= "+" if( defined($allow_plus) );
			    $legalchars .= "." if($nexttok eq "float_between");
			    $varargs{"legalcharacters"}
				= &add_quotes($legalchars);
			    $varargs{"step"} = $step if( $step );
			    }
			$varargs{$tok} = "$nexttok(lookup(\"this\"),$minv,$maxv)";
			}
		    else
			{
			$varargs{$tok} =
			    &parse_expression(undef,
				&inlist($tok,"background","legalcharacters"));
			}
		    }
		elsif( &inlist( $tok, "labelalign", "dataalign") )
		    {
		    $varargs{$tok} = &must_be("\\w+",$tok);
		    if( ! &inlist($varargs{$tok},"left","right","center") )
			{
			push(@problems,"$tok not followed by left, right or center on line $linenum.");
			unshift( @toks, $tok );
			}
		    }
		elsif( &inlist( $tok, "from" ) )
		    {
		    $_ = &var_if_pattern("\\w+","stored");
		    if( &inlist($_,"live","stored","cache") )
			{ $varargs{prefix} = $_; }
		    else
			{ unshift( @toks, $_ ); }
		    my @FILETYPES=("file","photo","video","audio");
		    $_ = &var_if_pattern("\\w+",$FILETYPES[0]);
		    if( &inlist($_,@FILETYPES) )
			{ $varargs{filetype} = $_; }
		    else
			{
			push(@problems,"$tok not followed by one of ",
			    join(", ",@FILETYPES) );
			unshift( @toks, $_ );
			}
		    }
		elsif( $tok =~ /^\w+/ && !defined($varargs{name}) )
		    {
#		    push(@problems,"Variable $tok specified multiple times on line $linenum.")
#			if( defined($generated_vars{$tok}) );

		    $varargs{name} = $tok;
		    }
		else
		    {
#		    print STDERR "Putting back [",join("],[",@put_at_end_of_def,$tok),"]\n";
		    unshift( @toks, @put_at_end_of_def, $tok );
		    @put_at_end_of_def = ();
		    last;
		    }
		}

#	    print STDERR "DUMP:\n";
#	    foreach $_ ( sort keys %varargs )
#	        {
#		printf STDERR ("    %-20s %s\n",$_.":",
#		    ( ( ref($varargs{$_}) eq "ARRAY" )
#		    ? join(",",@{$varargs{$_}})
#		    : $varargs{$_}
#		    ) );
#		}

	    if( ! $varargs{name} )
		{ push( @problems, "No variable specified on line $linenum." ) }
	    else
		{
		$varargs{prompttext}
		    = &add_quotes(&token_to_text($varargs{name}),1)
		    if( ! defined( $varargs{prompttext} ) );
		push( @{$generated_vars{$varargs{name}}}, $linenum );
		push( @{$save_generated_vars{$varargs{name}}}, $linenum );
		push( @{$save_generated_vars{$prefixes.$varargs{name}}}, $linenum );

		my $labname = $varargs{name};
		$labname .= "_$varargs{type}"
		    if( &inlist( $varargs{type}, "address", "citystatezip" ) );
		if( $varargs{type} eq "text" )
		    {
		    $varargs{rows} ||= 1;
		    $varargs{cols} ||= 40;
		    }
		elsif( $varargs{type} eq "address" )
		    {
		    $varargs{rows} ||= 3;
		    $varargs{cols} ||= 40;
		    }
		&output( $spacing, "last_referred_value=lookup(\"$varargs{name}\");" );
		if( $islist!=1 )
		    { &output( "do_var({" ); }
		else
		    {
		    &output( "\n", $spacing,
			"if( ! listitem(\"$varargs{name}\") ) {",
			( $prefix ? "prefixes=\"$save_prefixes\";" : "" ),
			( $with_text ? "space_over=\"$save_space_over\";" : "" ),
			"continue;}\n",
			 "last_var = do_var({" );
		    }
		my $do_sep = "\n";
		foreach my $k ( @PREFERRED_ORDER, sort keys %varargs )
		    {
		    if( defined($varargs{$k}) )
			{
			&output( $do_sep, $spacing, $SPACING_INC,
			    ( &inlist($k,"default")
			    ? &add_quotes($k) : $k ), ":" );
			if( &inlist($k,"choices") )
			    {
			    my @qstrings = ();
			    foreach my $ap ( @{$varargs{$k}} )
				{
				push( @qstrings, "[" . join(",",@{$ap}) . "]" );
				}
			    &output( "[", join(",",@qstrings), "]" );
			    }
			elsif(&inlist($k,
			     "must","submit","name","type",
			     "flags", "labelalign","dataalign","presentation",
			     "prefix","filetype"))
			    { &output( &add_quotes( $varargs{$k} ) ); }
			else
			    { &output( &add_parens( $varargs{$k} ) ); }
			$do_sep = ",\n";
			undef $varargs{$k};
			}
		    }
		&output( "});\n" );
		if( $islist==1 )
		    {
		    &output( $spacing,
			"if(last_var==\"\" || last_var==\"Unanswered\"" .
			( $listexpr ? " || ($listexpr)" : "" ) . "){" .
			( $prefix ? "prefixes=\"$save_prefixes\";" : "" ),
			( $with_text ? "space_over=\"$save_space_over\";" : "" ),
			"break;}\n" );
		    $islist = 2;
		    }
		}
	    &terminate_command();
	    }
	elsif( $tok eq "grid" )
	    {
	    my @var_names;
	    my %var_texts;
	    my $gridmode = "oneof";
	    my $no_none = 0;
	    my $flags = "multiple_per_line";
	    my $grid_presentation = "checks";
	    while( defined($_ = &var_if_pattern("\\w+")) )
		{
		if( &inlist( $_, "oneof", "anyof" ) )
		    { $gridmode = $_; }
		elsif( $_ eq "no_none" )
		    { $flags .= ",no_none"; }
		elsif( &inlist( $_, "checks", "buttons" ) )
		    { $grid_presentation = $_; }
		else
		    {
		    push( @var_names, $_ );
		    $var_texts{$_} =
			&add_quotes(&var_if_pattern("'",&token_to_text($_)),1);
		    }
		}
	    my @choices = ();
	    &must_be("\\[","Grid choices");
	    while( defined($tok = &next_token(__LINE__)) && $tok ne "]" )
		{
		my( $val, $txt, $label );
		if( &could_be_expression($tok) )
		    {
		    $val = $txt = &parse_expression($tok);
		    }
		elsif( $tok =~ /^\w+$/ )
		    {
		    $val = &add_quotes($tok);
		    $txt = &add_quotes( &token_to_text($tok), 1 );
		    }
		else
		    {
		    &fatal("Expecting {, value or quoted value and got \"$tok\" on line $linenum.");
		    }
		&fatal(__LINE__.": Expecting text, a comma or end of choices at line $linenum." )
		    if( !defined($tok = &next_token(__LINE__) ) );
		if( &could_be_expression($tok) )
		    { $txt = &parse_expression($tok); }
		elsif( $tok =~ /^\w+$/ )
		    { $txt = &add_quotes($tok,1); }
		else
		    { unshift(@toks,$tok); }
		&fatal(__LINE__.": Expecting label, a comma or end of choices at line $linenum." )
		    if( !defined($tok = &next_token(__LINE__) ) );
		if( &could_be_expression($tok) )
		    { $label = &parse_expression($tok); }
		elsif( $tok =~ /^\w+$/ )
		    { $label = &add_quotes($tok); }
		else
		    { unshift(@toks,$tok); }
		&fatal(__LINE__.": Expecting a comma or end of choices at line $linenum." )
		    if( !defined($tok = &next_token(__LINE__) ) );
		if( $tok eq "," )
		    {}
		elsif( $tok eq "]" )
		    { unshift(@toks,$tok); }
		else
		    { &fatal(__LINE__.": Expecting a comma or end of choices at line $linenum." ); }
		push( @choices, [&add_parens($val),&add_parens($txt)] );
		}

	    my @qstrings = ();
	    foreach my $cp ( @choices )
		{
		push( @qstrings,
		    "[" . join(",",map {&add_parens($_)} @{$cp}). "]" );
		}
	    foreach my $vname ( @var_names )
		{
		&output( $spacing, "last_referred_value=lookup(\"$vname\");\n" );
		&output( $spacing, "do_var({", "\n",
		    $spacing, $SPACING_INC, "name:",
			&add_quotes($vname), ",\n",
		    $spacing, $SPACING_INC, "type:",
			&add_quotes($gridmode), ",\n",
		    $spacing, $SPACING_INC, "prompttext:",
			$var_texts{$vname}, ",\n",
		    $spacing, $SPACING_INC, "flags:",
			&add_quotes($flags), ",\n",
		    $spacing, $SPACING_INC, "presentation:",
			&add_quotes( $grid_presentation ), ",\n",
		    $spacing, $SPACING_INC, "choices:", "[",
			join(",",@qstrings), "]\n",
		    $spacing, "});\n" );
		}
#	    &output( $spacing, "endgrid();\n" );
	    &terminate_command();
	    }
	else
	    {
	    #&fatal("Expecting beginning of statement, found \"$tok\" on line $linenum.");
	    if( &is_quote($tok) )
	        { &output( $tok, &parse_string($tok), $tok ); }
	    elsif( $BUILT_IN{$tok} )
	        { &output( "lookup('$tok')" ); }
	    elsif( ! $save_generated_vars{$tok} )
		{ &output( $tok ); }
	    else
	        {
		my $followed_by = &next_token(__LINE__);
		if( $followed_by ne "=" )
		    {
		    unshift(@toks,$followed_by);
		    &output( "lookup('$tok')" );
		    }
		else
		    {
		    my $ex = &parse_js_expr( "=" );
		    $ex =~ m/=(.*);/s;
		    &output( "${spacing}setvar( '$tok', $1 );\n" );
		    }
		}
	    }
	}
    }

#########################################################################
#	Convert a string into tokens.					#
#									#
#	The following tokens are possible:				#
#		Any string of characters, digits and _			#
#		Any amount of white space				#
#		Single characters					#
#	This could be more complex if we tried to recognize expressions	#
#	but we don't need to (since we just hand it onto javascript).	#
#	If we needed to handle expressions, we'd also recognize such	#
#	strings as ==, !=, <= etc.  But we don't.  So we don't.		#
#########################################################################
sub tokenize
    {
    my( $str, $strip_eols ) = @_;
    $str =~ s+\n+ +gs if( $strip_eols );
    return grep( $_ ne "", split( /([\w\.]+|\s+|==|!=|\/\/|.)/s, $str ) );
    }

#########################################################################
#	Process one file.						#
#########################################################################
sub process_file
    {
    $_ = &read_file( $ARGS{i} );
    open( OUT, ">$ARGS{o}" ) || &fatal("Cannot write ${ARGS{o}}:  $!");
    my $need_redraw = ( ! /function\s+redraw/ );
    my @file_toks = &tokenize($_,0);	# Read in configuration.

    # Pass 0 - figure out the form variable names
    &interp_tfs_setup(0); @toks=@file_toks; &parse_statements("",0,undef,"","","","");

    #%save_generated_vars = map { $_, 1 } keys %generated_vars;

    # Pass 1 - do form variable name substitutions
    &interp_tfs_setup(1);
    &output( "function redraw()\n" ) if( $need_redraw );
    @toks=@file_toks; &parse_statements("",0,undef,"","","","");

    if( $ARGS{d} )
	{
	open( DUMP, ">$ARGS{d}" ) || &fatal("Cannot dump to ${ARGS{d}}:  $!");
	my %toprint =			# Dump specified variables (w/ headers)
	    (				# Too clever for words!
	    				# Difficult to maintain
	    "Using functions"		=>\%using_functions,
	    "Generated variables"	=>\%generated_vars,
	    "Expression variables"	=>\%expression_vars,
	    "Computed variables"	=>\%save_generated_vars
	    );
	my $colwidth =
	    (sort {$b<=>$a} map {length($_)} map {keys %{$_}} values %toprint)[0];
	foreach my $header ( sort keys %toprint )
	    {
	    print DUMP $header, ":\n";
	    foreach $_ (
		sort {  ${${$toprint{$header}}{$a}}[0]
		    <=> ${${$toprint{$header}}{$b}}[0] } keys %{$toprint{$header}} )
		{
		printf DUMP ("\t%-${colwidth}s %s\n",
		    $_,
		    join(",",@{$toprint{$header}{$_}}) );
		}

	    }
	close( DUMP );
	}

    # There should be nothing else in the file
    push(@problems,"Found '$_' after ending compound statement.")
	if( defined($_ = &next_token(__LINE__)) );

    foreach $_ ( sort keys %expression_vars )
	{
	next if( $generated_vars{$_} );
	my @lines = @{$expression_vars{$_}};
	push(@problems,
	    "\"$_\" undefined but used on line" .
	    ( scalar(@lines)==1 ? "" : "s" ) .
	    ":  " . join(",",@lines) );
	}

    &fatal( join("\n\t","Problems with input:",@problems) ) if( @problems );

    close( OUT );
    }

#########################################################################
#	Main								#
#########################################################################

%ARGS = &parse_arguments( { switches=>\%ONLY_ONE_DEFAULTS } );

#print join("\n\t","Args:",map{"$_:\t$ARGS{$_}"} sort keys %ARGS), "\n";

&process_file();

&cleanup( $exit_stat );
