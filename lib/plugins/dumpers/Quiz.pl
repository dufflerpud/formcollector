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
    #push( @pieces, "\nDBFcache( $key_to_dump, $vname ) ... returns [$ret]\n");
    return defined($ret) ? $ret : "";
    }

#########################################################################
#	Return Make_form records as TFS script.				#
#########################################################################
sub main::records_to_type
    {
    my( $argp, @keys_to_dump ) = @_;
    foreach $key_to_dump_ind ( @keys_to_dump )
        {
	$key_to_dump = $key_to_dump_ind;
	my $concept_ind;
	my $contiguous_empty_concepts = 0;
	for( $concept_ind=0; $contiguous_empty_concepts < 10; $concept_ind++ )
	    {
	    my $Concept = &getdv("Concept",$concept_ind);
	    if( ! defined($Concept) || $Concept eq "" )
		{ $contiguous_empty_concepts++; }
	    else
		{
		push( @pieces, "<concept>$Concept\n" );
		$contiguous_empty_questions = 0;
		my $contiguous_empty_questions = 0;
		my $question_ind = 0;
		for( $question_ind=0; $contiguous_empty_questions < 10; $question_ind++ )
		    {
		    my $Question=&getdv("Question",$concept_ind,$question_ind);
		    if( ! defined($Question) || $Question eq "" )
			{ $contiguous_empty_questions++; }
		    else
			{
			$contiguous_empty_questions = 0;
			push( @pieces, "    <question>$Question\n" );
			my $Explanation = &getdv("Explanation",$concept_ind,$question_ind);
			push( @pieces, "\t<explanation>$Explanation\n" )
			    if( defined($Explanation) );
			push( @pieces, "\t<answer right>",
			    &getdv("Right_answer",$concept_ind,$question_ind),
			    "</answer>\n" );
			my $contiguous_empty_wrongs = 0;
			my $wrong_ind = 0;
			for( $wrong_ind=0; $contiguous_empty_wrongs < 10; $wrong_ind++ )
			    {
			    my $Wrong=&getdv("Wrong_answer",$concept_ind,$question_ind,$wrong_ind);
			    if( ! defined($Wrong) || $Wrong eq "" )
			        { $contiguous_empty_wrongs++; }
			    else
			        {
				$contiguous_empty_wrongs = 0;
				push( @pieces, "\t<answer>$Wrong</answer>\n" );
				}
			    }
			push( @pieces, "    </question>\n" );
			}
		    }
		push( @pieces, "</concept>\n" );
		}
	    }
	}
    return join("",@pieces);
    }
1;
