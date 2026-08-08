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

our $default_extension = "tfs";

my $key_to_dump = "Fred";
my @pieces = ();
sub getdv
    {
    my $vname = join( "_", @_ );
    my $ret = &DBFcache( $key_to_dump, $vname );
    #push( @pieces, "DBFcache( $key_to_dump, $vname ) ... returns [$ret]\n");
    return defined($ret) ? $ret : "";
    }

#########################################################################
#	Return Make_form records as TFS script.				#
#########################################################################
sub main::records_to_type
    {
    my( $argp, @keys_to_dump ) = @_;
    my @fields =
	($argp->{fields} ? split(/$SEP{FIELD}/,$argp->{fields}) : @field_names);
    push( @pieces, "{\n" );
    foreach $key_to_dump_ind ( @keys_to_dump )
        {
	$key_to_dump = $key_to_dump_ind;
	my $ind;
	my $contiguous_empty_variables = 0;
	for( $ind=0; $contiguous_empty_variables < 10; $ind++ )
	    {
	    my $vtype = &getdv("Question_type",$ind);
	    if( ! defined($vtype) || $vtype eq "" )
		{ $contiguous_empty_variables++; }
	    else
		{
		$contiguous_empty_options = 0;
		my $vtext = $vtype;
		$vtext = "text" if( $vtext eq "integer" || $vtext eq "float" );
		push( @pieces,
		    $vtext,
		    " ", &getdv("Variable_name",$ind),
		    " \"", &getdv("Variable_prompt",$ind), "\"" );
		if( $vtype eq "text" )
		    {
		    push( @pieces, " ", &getdv("Rows",$ind),
				    " ", &getdv("Columns",$ind), "\n" );
		    }
		elsif( $vtype eq "integer" )
		    {
		    push( @pieces, " must int_between ",
			&getdv("Minimum_value",$ind), " ",
			&getdv("Maximum_value",$ind), "\n" );
		    }
		elsif( $vtype eq "real" )
		    {
		    push( @pieces, " must real_between ",
			&getdv("Minimum_value",$ind), " ",
			&getdv("Maximum_value",$ind), "\n" );
		    }
		elsif( $vtype eq "datetime" )
		    {
		    $_ = &getdv("Presentation",$ind);
		    push( @pieces, " just_date" ) if( $_ eq "Just_date" );
		    push( @pieces, " just_time" ) if( $_ eq "Just_time" );
		    my $relative = lc(&getdv("Relative_to_another_variable"));
		    push( @pieces, " ", $relative, " {",
			&getdv("Relative_variable",$ind), "}" )
			if( grep($relative eq $_,"before","after") );
		    push( @pieces, "\n" );
		    }
		elsif( grep($vtype eq $_,"anyof","oneof","drawing") )
		    {
		    my @option_list = ();
		    push( @option_list, " ", &getdv("Presentation",$ind) );
		    push( @option_list, " other" )
			if( defined($_ = &getdv("Allow_other",$ind)) && $_ eq "Yes" );
		    push( @option_list, " markup" )
			if( defined($_ = &getdv("Allow_markup",$ind)) && $_ eq "Yes" );
		    push( @option_list, " from \"$_\"" )
			if( defined($_ = &getdv("Drawing_URL",$ind)) && $_ eq "Yes" );
		    push( @pieces, @option_list, "\n" );
		    @option_list = ();
		    my $contiguous_empty_options = 0;
		    my $optind = 0;
		    for( $optind=0; $contiguous_empty_options < 10; $optind++ )
			{
			my $txt = &getdv("Option_text",$ind,$optind);
			if( ! defined($txt) || $txt eq "" )
			    { $contiguous_empty_options++; }
			else
			    {
			    $contiguous_empty_options = 0;
			    my $opt = "\"$txt\"";
			    $txt =~ s+_+ +g;
			    $opt .= " \"$txt\"";
			    if( $vtype eq "drawing" )
				{
				$txt = &getdv("Option_label",$ind,$optind);
				$opt .= " \"$txt\"";
				}
			    push( @option_list, $opt );
			    }
			}
		    push( @pieces,
			"\t[\n\t", join(",\n\t",@option_list), "\n\t]\n" )
			if( @option_list );
		    }
		}
	    }
	}
    push( @pieces, "}\n" );
    return join("",@pieces);
    }
1;
