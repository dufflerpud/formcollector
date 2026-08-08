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

 last_referred_value=lookup("Worker");do_var({
  name:"Worker",
  type:"oneof",
  prompttext:"XL(Worker)",
  "default":( "chris" ),
  choices:[["angie","XL(Angie Moore)"],["bridget","XL(Bridget Baye)"],["chris","XL(Christopher Caldwell)"],["cnorth","XL(Christopher North)"],["holly","XL(Holly Schmidt)"],["pschmidt","XL(Peter Schmidt)"]]});

 last_referred_value=lookup("Project");do_var({
  name:"Project",
  type:"oneof",
  prompttext:"XL(Project)",
  choices:[["Software_development","XL(Software development)"],["Sales_engineering","XL(Sales engineering)"],["Sales","XL(Sales)"],["Linear_Air_Software","XL(Linear Air Software)"],["Test_project","XL(Test project)"],["Baystate_Milling","XL(Baystate Milling)"],["Dustin","XL(Dustin)"]]});

 last_referred_value=lookup("Type_of_work");do_var({
  name:"Type_of_work",
  type:"oneof",
  prompttext:"XL(Type of work)",
  choices:[["NO","XL(Normal on-site)"],["NR","XL(Normal remote)"],["EO","XL(Emergency on-site)"],["ER","XL(Emergency remote)"],["UB","XL(Unbillable)"]]});

 last_referred_value=lookup("Stopped_working");do_var({
  name:"Stopped_working",
  type:"datetime",
  prompttext:"XL(Stopped working)",
  "default":( lookup('now') )});

 last_referred_value=lookup("Started_working");do_var({
  name:"Started_working",
  type:"datetime",
  prompttext:"XL(Started working)",
  before:( lookup('Stopped_working') )});

 last_referred_value=lookup("Comments");do_var({
  name:"Comments",
  type:"text",
  prompttext:"XL(Worked performed, notes and detail)",
  rows:10,
  cols:60});

 last_referred_value=lookup("Status");do_var({
  name:"Status",
  type:"oneof",
  prompttext:"XL(Status)",
  "default":( "New" ),
  choices:[["New","XL(New)"],["Billed","XL(Billed)"],["Paid","XL(Paid)"],["Rejected","XL(Rejected)"]]});

 if(  lookup('Status') == "Billed" || lookup('Status') == "Paid"  )
  {
   last_referred_value=lookup("Billed_on");do_var({
   name:"Billed_on",
   type:"datetime",
   prompttext:"XL(Billed on)"});
  }
 if(  lookup('Status') == "Paid"  )
  {
   last_referred_value=lookup("Paid_on");do_var({
   name:"Paid_on",
   type:"datetime",
   prompttext:"XL(Paid on)"});
  }
 }
