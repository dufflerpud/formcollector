//@HDR@	$Id$
//@HDR@		Copyright 2024 by
//@HDR@		Christopher Caldwell/Brightsands
//@HDR@		P.O. Box 401, Bailey Island, ME 04003
//@HDR@		All Rights Reserved
//@HDR@
//@HDR@	This software comprises unpublished confidential information
//@HDR@	of Brightsands and may not be used, copied or made available
//@HDR@	to anyone, except in accordance with the license under which
//@HDR@	it is furnished.
function redraw()
 {

  {  section("XL(Incident)");


  last_referred_value=lookup("Information_entered_date_and_time");do_var({
   name:"Information_entered_date_and_time",
   type:"datetime",
   prompttext:"XL(Date/time Reported)",
   "default":( lookup('now') ),
   help:"XL(Should be in the format: NN/NN/NNNN NN:NN)"});

  last_referred_value=lookup("Report_date_and_time");do_var({
   name:"Report_date_and_time",
   type:"datetime",
   prompttext:"XL(Date/time of report)",
   "default":( lookup('now') ),
   help:"XL(Should be in the format: NN/NN/NNNN NN:NN)"});

  last_referred_value=lookup("Status");do_var({
   name:"Status",
   type:"oneof",
   prompttext:"XL(Status)",
   choices:[["No_Crime_Involved","XL(No Crime Involved)"],["Crime_Involved","XL(Crime Involved)"]]});

  last_referred_value=lookup("Involves");do_var({
   name:"Involves",
   type:"anyof",
   prompttext:"XL(Involves)",
   choices:[["Sex_Crimes","XL(Sex Crimes)"],["Juveniles","XL(Juveniles)"]]});

  last_referred_value=lookup("Reporting_Officer");do_var({
   name:"Reporting_Officer",
   type:"text",
   prompttext:"XL(Reporting Officer)",
   rows:1,
   cols:50,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Reporting_Signature");do_var({
   name:"Reporting_Signature",
   type:"signature",
   prompttext:"XL(Reporting Signature)"});

  last_referred_value=lookup("Approving_Officer");do_var({
   name:"Approving_Officer",
   type:"text",
   prompttext:"XL(Approving Officer)",
   rows:1,
   cols:50,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Approving_Signature");do_var({
   name:"Approving_Signature",
   type:"signature",
   prompttext:"XL(Approving Signature)"});
  end_section();}

  {  section("XL(Involved)");


  last_referred_value=lookup("Involved_Last");do_var({
   name:"Involved_Last",
   type:"text",
   prompttext:"XL(Last name)",
   rows:1,
   cols:30,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_First");do_var({
   name:"Involved_First",
   type:"text",
   prompttext:"XL(First name)",
   rows:1,
   cols:30,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_Middle");do_var({
   name:"Involved_Middle",
   type:"text",
   prompttext:"XL(Middle name)",
   rows:1,
   cols:30,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_Sex");do_var({
   name:"Involved_Sex",
   type:"oneof",
   prompttext:"XL(Sex)",
   choices:[["M","XL(M)"],["F","XL(F)"]]});

  last_referred_value=lookup("Involved_Race");do_var({
   name:"Involved_Race",
   type:"oneof",
   prompttext:"XL(Race)",
   choices:[["White","XL(White)"],["Hispanic","XL(Hispanic)"],["Black","XL(Black)"]]});

  last_referred_value=lookup("Involved_Address0");do_var({
   name:"Involved_Address0",
   type:"text",
   prompttext:"XL(Address)",
   rows:1,
   cols:50,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_Address1");do_var({
   name:"Involved_Address1",
   type:"text",
   prompttext:"XL(Address)",
   rows:1,
   cols:50,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_City");do_var({
   name:"Involved_City",
   type:"text",
   prompttext:"XL(City)",
   rows:1,
   cols:40,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_County");do_var({
   name:"Involved_County",
   type:"text",
   prompttext:"XL(County)",
   rows:1,
   cols:30});

  last_referred_value=lookup("Involved_State");do_var({
   name:"Involved_State",
   type:"text",
   prompttext:"XL(State)",
   rows:1,
   cols:2,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_Zipcode");do_var({
   name:"Involved_Zipcode",
   type:"text",
   prompttext:"XL(Zipcode)",
   rows:1,
   cols:5,
   must:" checkexp(lookup('this'),/^\\d\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Involved_Employer");do_var({
   name:"Involved_Employer",
   type:"text",
   prompttext:"XL(Employer)",
   rows:1,
   cols:30,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_DOB");do_var({
   name:"Involved_DOB",
   type:"datetime",
   prompttext:"XL(Date of birth)",
   presentation:"just_date",
   before:( lookup('Information_entered_date_and_time') )});

  last_referred_value=lookup("Involved_SSN");do_var({
   name:"Involved_SSN",
   type:"text",
   prompttext:"XL(SSN)",
   rows:1,
   cols:40,
   must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d-\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Involved_Phone0");do_var({
   name:"Involved_Phone0",
   type:"text",
   prompttext:"XL(Phone)",
   rows:1,
   cols:12,
   must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Involved_Phone1");do_var({
   name:"Involved_Phone1",
   type:"text",
   prompttext:"XL(Phone)",
   rows:1,
   cols:12,
   must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Involved_Phone2");do_var({
   name:"Involved_Phone2",
   type:"text",
   prompttext:"XL(Phone)",
   rows:1,
   cols:12,
   must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Involved_Work_Phone0");do_var({
   name:"Involved_Work_Phone0",
   type:"text",
   prompttext:"XL(Work Phone)",
   rows:1,
   cols:12,
   must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Involved_Call_Back0");do_var({
   name:"Involved_Call_Back0",
   type:"text",
   prompttext:"XL(Callback Phone)",
   rows:1,
   cols:12,
   must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Involved_Call_Back1");do_var({
   name:"Involved_Call_Back1",
   type:"text",
   prompttext:"XL(Callback Phone)",
   rows:1,
   cols:12,
   must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Involved_State_License");do_var({
   name:"Involved_State_License",
   type:"text",
   prompttext:"XL(State of License)",
   rows:1,
   cols:2,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_License");do_var({
   name:"Involved_License",
   type:"text",
   prompttext:"XL(License number)",
   rows:1,
   cols:8,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Involved_Military");do_var({
   name:"Involved_Military",
   type:"oneof",
   prompttext:"XL(Military)",
   choices:[["Active","XL(Active)"],["Inactive","XL(Inactive)"],["Civilian","XL(Civilian)"]]});

  last_referred_value=lookup("Involved_Complexion");do_var({
   name:"Involved_Complexion",
   type:"oneof",
   prompttext:"XL(Complexion)",
   choices:[["Light","XL(Light)"],["Dark","XL(Dark)"],["Mixed","XL(Mixed)"]]});

  last_referred_value=lookup("Involved_Language");do_var({
   name:"Involved_Language",
   type:"anyof",
   prompttext:"XL(Language)",
   choices:[["English","XL(English)"],["Spanish","XL(Spanish)"],["French","XL(French)"],["Arabic","XL(Arabic)"],["Somali","XL(Somali)"]],
   flags:"other"});

  last_referred_value=lookup("Victim_Place_of_Birth");do_var({
   name:"Victim_Place_of_Birth",
   type:"text",
   prompttext:"XL(Place of birth)",
   rows:1,
   cols:60,
   must:" checkexp(lookup('this'),/./) "});
  end_section();}

  {  section("XL(Event)");


  last_referred_value=lookup("Zone");do_var({
   name:"Zone",
   type:"oneof",
   prompttext:"XL(Zone)",
   choices:[["East_Side","XL(East Side)"],["North_Side","XL(North Side)"],["West_Side","XL(West Side)"],["East_Side","XL(East Side)"]]});

  last_referred_value=lookup("Location");do_var({
   name:"Location",
   type:"text",
   prompttext:"XL(Location)",
   rows:5,
   cols:40});
  end_section();}

  {  section("XL(Victim)");


  tripvar.push(false); varcontexts.push(-1); while(!tripvar[tripvar.length-1]){varcontexts[varcontexts.length-1]++;
   {do_html("<b>"+"XL(Victim)"+"</b>", 0 );space_over=1;

   last_referred_value=lookup("Victim_Last");
   if( ! listitem("Victim_Last") ) {space_over="0";continue;}
last_var = do_var({
    name:"Victim_Last",
    type:"text",
    prompttext:"XL(Last name)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) ",
    adddelname:"XL(Victim)",
    flags:"adddel"});
   if(last_var=="" || last_var=="Unanswered"){space_over="0";break;}

   last_referred_value=lookup("Victim_First");do_var({
    name:"Victim_First",
    type:"text",
    prompttext:"XL(First name)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Victim_Middle");do_var({
    name:"Victim_Middle",
    type:"text",
    prompttext:"XL(Middle name)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Victim_Sex");do_var({
    name:"Victim_Sex",
    type:"oneof",
    prompttext:"XL(Sex)",
    choices:[["M","XL(M)"],["F","XL(F)"]]});

   last_referred_value=lookup("Victim_Race");do_var({
    name:"Victim_Race",
    type:"oneof",
    prompttext:"XL(Race)",
    choices:[["White","XL(White)"],["Hispanic","XL(Hispanic)"],["Black","XL(Black)"]]});

   last_referred_value=lookup("Victim_Address0");do_var({
    name:"Victim_Address0",
    type:"text",
    prompttext:"XL(Address)",
    rows:1,
    cols:50,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Victim_Address1");do_var({
    name:"Victim_Address1",
    type:"text",
    prompttext:"XL(Address)",
    rows:1,
    cols:50,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Victim_City");do_var({
    name:"Victim_City",
    type:"text",
    prompttext:"XL(City)",
    rows:1,
    cols:40,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Victim_County");do_var({
    name:"Victim_County",
    type:"text",
    prompttext:"XL(County)",
    rows:1,
    cols:30});

   last_referred_value=lookup("Victim_State");do_var({
    name:"Victim_State",
    type:"text",
    prompttext:"XL(State)",
    rows:1,
    cols:2,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Victim_Zipcode");do_var({
    name:"Victim_Zipcode",
    type:"text",
    prompttext:"XL(Zipcode)",
    rows:1,
    cols:5,
    must:" checkexp(lookup('this'),/^\\d\\d\\d\\d\\d$/) "});

   last_referred_value=lookup("Involved_Employer");do_var({
    name:"Involved_Employer",
    type:"text",
    prompttext:"XL(Employer)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Victim_DOB");do_var({
    name:"Victim_DOB",
    type:"datetime",
    prompttext:"XL(Date of birth)",
    presentation:"just_date",
    before:( lookup('Information_entered_date_and_time') )});

   last_referred_value=lookup("Victim_Phone0");do_var({
    name:"Victim_Phone0",
    type:"text",
    prompttext:"XL(Phone)",
    rows:1,
    cols:12,
    must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

   last_referred_value=lookup("Victim_Work_Phone0");do_var({
    name:"Victim_Work_Phone0",
    type:"text",
    prompttext:"XL(Work Phone)",
    rows:1,
    cols:12,
    must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

   last_referred_value=lookup("Victim_Call_Back0");do_var({
    name:"Victim_Call_Back0",
    type:"text",
    prompttext:"XL(Callback Phone)",
    rows:1,
    cols:12,
    must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

   last_referred_value=lookup("Victim_Military");do_var({
    name:"Victim_Military",
    type:"oneof",
    prompttext:"XL(Military)",
    choices:[["Active","XL(Active)"],["Inactive","XL(Inactive)"],["Civilian","XL(Civilian)"]]});

   last_referred_value=lookup("Victim_Language");do_var({
    name:"Victim_Language",
    type:"anyof",
    prompttext:"XL(Language)",
    choices:[["English","XL(English)"],["Spanish","XL(Spanish)"],["French","XL(French)"],["Arabic","XL(Arabic)"],["Somali","XL(Somali)"]],
    flags:"other"});
   space_over=0;}
  } varcontexts.pop(); tripvar.pop();
  end_section();}

  {  section("XL(People)");


  tripvar.push(false); varcontexts.push(-1); while(!tripvar[tripvar.length-1]){varcontexts[varcontexts.length-1]++;
   {do_html("<b>"+"XL(People)"+"</b>", 0 );space_over=1;

   last_referred_value=lookup("People_Last");
   if( ! listitem("People_Last") ) {space_over="0";continue;}
last_var = do_var({
    name:"People_Last",
    type:"text",
    prompttext:"XL(Last name)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) ",
    adddelname:"XL(People)",
    flags:"adddel"});
   if(last_var=="" || last_var=="Unanswered"){space_over="0";break;}

   last_referred_value=lookup("People_First");do_var({
    name:"People_First",
    type:"text",
    prompttext:"XL(First name)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("People_Middle");do_var({
    name:"People_Middle",
    type:"text",
    prompttext:"XL(Middle name)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("People_Sex");do_var({
    name:"People_Sex",
    type:"oneof",
    prompttext:"XL(Sex)",
    choices:[["M","XL(M)"],["F","XL(F)"]]});

   last_referred_value=lookup("People_Race");do_var({
    name:"People_Race",
    type:"oneof",
    prompttext:"XL(Race)",
    choices:[["White","XL(White)"],["Hispanic","XL(Hispanic)"],["Black","XL(Black)"]]});

   last_referred_value=lookup("People_Address0");do_var({
    name:"People_Address0",
    type:"text",
    prompttext:"XL(Address)",
    rows:1,
    cols:50,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("People_Address1");do_var({
    name:"People_Address1",
    type:"text",
    prompttext:"XL(Address)",
    rows:1,
    cols:50,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("People_City");do_var({
    name:"People_City",
    type:"text",
    prompttext:"XL(City)",
    rows:1,
    cols:40,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("People_County");do_var({
    name:"People_County",
    type:"text",
    prompttext:"XL(County)",
    rows:1,
    cols:30});

   last_referred_value=lookup("People_State");do_var({
    name:"People_State",
    type:"text",
    prompttext:"XL(State)",
    rows:1,
    cols:2,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("People_Zipcode");do_var({
    name:"People_Zipcode",
    type:"text",
    prompttext:"XL(Zipcode)",
    rows:1,
    cols:5,
    must:" checkexp(lookup('this'),/^\\d\\d\\d\\d\\d$/) "});

   last_referred_value=lookup("Involved_Employer");do_var({
    name:"Involved_Employer",
    type:"text",
    prompttext:"XL(Employer)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("People_DOB");do_var({
    name:"People_DOB",
    type:"datetime",
    prompttext:"XL(Date of birth)",
    presentation:"just_date",
    before:( lookup('Information_entered_date_and_time') )});

   last_referred_value=lookup("People_Phone0");do_var({
    name:"People_Phone0",
    type:"text",
    prompttext:"XL(Phone)",
    rows:1,
    cols:12,
    must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

   last_referred_value=lookup("People_Work_Phone0");do_var({
    name:"People_Work_Phone0",
    type:"text",
    prompttext:"XL(Work Phone)",
    rows:1,
    cols:12,
    must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

   last_referred_value=lookup("People_Call_Back0");do_var({
    name:"People_Call_Back0",
    type:"text",
    prompttext:"XL(Callback Phone)",
    rows:1,
    cols:12,
    must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

   last_referred_value=lookup("People_Military");do_var({
    name:"People_Military",
    type:"oneof",
    prompttext:"XL(Military)",
    choices:[["Active","XL(Active)"],["Inactive","XL(Inactive)"],["Civilian","XL(Civilian)"]]});

   last_referred_value=lookup("People_Language");do_var({
    name:"People_Language",
    type:"anyof",
    prompttext:"XL(Language)",
    choices:[["English","XL(English)"],["Spanish","XL(Spanish)"],["French","XL(French)"],["Arabic","XL(Arabic)"],["Somali","XL(Somali)"]],
    flags:"other"});
   space_over=0;}
  } varcontexts.pop(); tripvar.pop();
  end_section();}

  {  section("XL(Properties)");


  tripvar.push(false); varcontexts.push(-1); while(!tripvar[tripvar.length-1]){varcontexts[varcontexts.length-1]++;
   {do_html("<b>"+"XL(Properties)"+"</b>", 0 );space_over=1;

   last_referred_value=lookup("Property_Name");
   if( ! listitem("Property_Name") ) {space_over="0";continue;}
last_var = do_var({
    name:"Property_Name",
    type:"text",
    prompttext:"XL(Property Name)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) ",
    adddelname:"XL(Properties)",
    flags:"adddel"});
   if(last_var=="" || last_var=="Unanswered"){space_over="0";break;}

   last_referred_value=lookup("Property_Number");do_var({
    name:"Property_Number",
    type:"text",
    prompttext:"XL(Property Number)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Property_Status");do_var({
    name:"Property_Status",
    type:"oneof",
    prompttext:"XL(Property Status)",
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Property_Quantity");do_var({
    name:"Property_Quantity",
    type:"text",
    prompttext:"XL(Property Quantity)",
    rows:1,
    cols:3,
    must:" checkexp(lookup('this'),/^\\d\\d*$/) "});

   last_referred_value=lookup("Property_Status");do_var({
    name:"Property_Status",
    type:"oneof",
    prompttext:"XL(Property Status)",
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Property_date_and_time");do_var({
    name:"Property_date_and_time",
    type:"datetime",
    prompttext:"XL(Date/time Reported)",
    "default":( lookup('now') ),
    help:"XL(Should be in the format: NN/NN/NNNN NN:NN)"});
   space_over=0;}
  } varcontexts.pop(); tripvar.pop();
  end_section();}

  {  section("XL(Log entries)");


  tripvar.push(false); varcontexts.push(-1); while(!tripvar[tripvar.length-1]){varcontexts[varcontexts.length-1]++;
   {do_html("<b>"+"XL(Entry)"+"</b>", 0 );space_over=1;

   last_referred_value=lookup("Entry_Entered_by");
   if( ! listitem("Entry_Entered_by") ) {space_over="0";continue;}
last_var = do_var({
    name:"Entry_Entered_by",
    type:"text",
    headertext:( checkexp(lookup('this'),/./) ),
    prompttext:"XL(Entered by)",
    rows:1,
    cols:30,
    adddelname:"XL(Entry)",
    flags:"adddel"});
   if(last_var=="" || last_var=="Unanswered"){space_over="0";break;}

   last_referred_value=lookup("Entry_date_and_time");do_var({
    name:"Entry_date_and_time",
    type:"datetime",
    prompttext:"XL(Date/time Entered)",
    "default":( lookup('now') ),
    help:"XL(Should be in the format: NN/NN/NNNN NN:NN)"});

   last_referred_value=lookup("Entry_text");do_var({
    name:"Entry_text",
    type:"text",
    prompttext:"XL(Entry text)",
    rows:30,
    cols:60});
   space_over=0;}
  } varcontexts.pop(); tripvar.pop();
  end_section();}
 }
