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

  {  section("XL(About Me)");


  last_referred_value=lookup("Information_entered_date_and_time");do_var({
   name:"Information_entered_date_and_time",
   type:"datetime",
   prompttext:"XL(Information_entered date and time)",
   "default":( lookup('now') ),
   help:"XL(Should be in the format: NN/NN/NNNN NN:NN)"});

  last_referred_value=lookup("Last_name");do_var({
   name:"Last_name",
   type:"text",
   prompttext:"XL(Last name)",
   rows:1,
   cols:30,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("First_name");do_var({
   name:"First_name",
   type:"text",
   prompttext:"XL(First name)",
   rows:1,
   cols:30,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("DOB");do_var({
   name:"DOB",
   type:"datetime",
   prompttext:"XL(Date of birth)",
   presentation:"just_date",
   before:( lookup('Information_entered_date_and_time') )});

  last_referred_value=lookup("Address0");do_var({
   name:"Address0",
   type:"text",
   prompttext:"XL(Address first line)",
   rows:1,
   cols:50,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Address1");do_var({
   name:"Address1",
   type:"text",
   prompttext:"XL(Address second line)",
   rows:1,
   cols:50,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("City");do_var({
   name:"City",
   type:"text",
   prompttext:"XL(City)",
   rows:1,
   cols:40,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("County");do_var({
   name:"County",
   type:"text",
   prompttext:"XL(County)",
   rows:1,
   cols:30});

  last_referred_value=lookup("State");do_var({
   name:"State",
   type:"text",
   prompttext:"XL(State)",
   rows:1,
   cols:2,
   must:" checkexp(lookup('this'),/./) "});

  last_referred_value=lookup("Zipcode");do_var({
   name:"Zipcode",
   type:"text",
   prompttext:"XL(Zipcode)",
   rows:1,
   cols:40,
   must:" checkexp(lookup('this'),/^\\d\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Gender");do_var({
   name:"Gender",
   type:"oneof",
   prompttext:"XL(Gender)",
   presentation:"buttons",
   choices:[["Male","XL(Male)"],["Female","XL(Female)"],["Transgendered","XL(Transgendered)"],["Rather_not_say","XL(Rather not say)"]]});

  last_referred_value=lookup("Email");do_var({
   name:"Email",
   type:"text",
   prompttext:"XL(Email)",
   rows:1,
   cols:40,
   must:" checkexp(lookup('this'),/^..*@..*$/) "});

  last_referred_value=lookup("Phone");do_var({
   name:"Phone",
   type:"text",
   prompttext:"XL(Phone)",
   rows:1,
   cols:40,
   must:" checkexp(lookup('this'),/^\\d\\d\\d-\\d\\d\\d-\\d\\d\\d\\d$/) "});

  last_referred_value=lookup("Language");do_var({
   name:"Language",
   type:"anyof",
   prompttext:"XL(Language)",
   presentation:"buttons",
   choices:[["English","XL(English)"],["Spanish","XL(Spanish)"],["French","XL(French)"],["Arabic","XL(Arabic)"],["Somali","XL(Somali)"]],
   flags:"other"});
  end_section();}

  {  section("XL(About my Situation)");


  last_referred_value=lookup("Housing");do_var({
   name:"Housing",
   type:"oneof",
   prompttext:"XL(Housing)",
   presentation:"buttons",
   choices:[["Own_your_own_home","XL(Own your own home)"],["Private_rental","XL(Private rental)"],["Transitional","XL(Emergency shelter/Mission/Transitional)"],["Youth_Home_Shelter","XL(Youth Home Shelter)"],["Evacuee","XL(Evacuee)"],["Public_housing","XL(Public housing)"],["With_family_or_friends","XL(With family or friends)"],["Unhoused","XL(Unhoused)"],["Rather_not_say","XL(Rather not say)"]],
   flags:"other"});

  last_referred_value=lookup("Who_referred_you");do_var({
   name:"Who_referred_you",
   type:"anyof",
   prompttext:"XL(Who referred you)",
   presentation:"buttons",
   choices:[["Clients_or_friends_or_family","XL(Clients or friends or family)"],["Benefits_Social_Service","XL(Benefits/Social Assistance)"],["Child_care_support","XL(Child care support)"],["Community_support_organization","XL(Community support organization)"],["Emergency_shelter","XL(Emergency shelter)"],["Employment_support_or_education","XL(Employment support or education)"],["Faith_based_organization","XL(Faith based organization)"],["Financial_support_education","XL(Financial support education)"],["Health_care_organization","XL(Health care organization)"],["Housing_support","XL(Housing support)"],["Immigration_services","XL(Immigration services)"],["Media","XL(Media/News/Outreach)"],["Legal_support","XL(Legal support)"],["Social_worker","XL(Social worker)"],["Utilities_support","XL(Utilities support)"],["Other_food_bank","XL(Other food bank)"]],
   flags:"other"});

  last_referred_value=lookup("Ethnicity");do_var({
   name:"Ethnicity",
   type:"oneof",
   prompttext:"XL(Ethnicity)",
   presentation:"buttons",
   choices:[["White_Anglo","XL(White/Anglo)"],["Asian","XL(Asian)"],["Middle_Eastern_North_African","XL(Middle Eastern/North African)"],["Black_African_American","XL(Black/African American)"]],
   flags:"other"});

  last_referred_value=lookup("Which_things_apply");do_var({
   name:"Which_things_apply",
   type:"anyof",
   prompttext:"XL(Which things apply)",
   presentation:"buttons",
   choices:[["Breastfeeding","XL(Breastfeeding)"],["Postpartum","XL(Postpartum)"],["Pregnant","XL(Pregnant)"],["Veteran","XL(Veteran)"],["Disability","XL(Disability)"],["Evacuee","XL(Evacuee)"],["Refugee","XL(Refugee)"],["History_of_homelessness","XL(History of homelessness)"],["Prefer_not_to_say","XL(Prefer not to say)"]],
   flags:"other"});

  last_referred_value=lookup("Highest_education_completed");do_var({
   name:"Highest_education_completed",
   type:"oneof",
   prompttext:"XL(Highest education completed)",
   presentation:"buttons",
   choices:[["Grades_0_to_8","XL(Grades 0 to 8)"],["Grades_9_to_11","XL(Grades 9 to 11)"],["High_School_Diploma","XL(High School Diploma)"],["GED","XL(GED)"],["Post_secondary_education","XL[Post-Secondary Education (some)]"],["Trade_School","XL(Trade School/Accreditation)"],["Two_year_degree","XL(2 year degree)"],["Four_year_degree","XL(4 year degree)"],["Masters_degree","XL(Master's degree)"],["PhD","XL(PhD)"],["Prefer_not_to_say","XL(Prefer not to say)"]]});

  last_referred_value=lookup("Employment_type");do_var({
   name:"Employment_type",
   type:"anyof",
   prompttext:"XL(Employment type)",
   presentation:"buttons",
   choices:[["Post_Secondary_Student","XL(Post-Secondary Student)"],["Not_currently_employed","XL(Not currently employed)"],["Full_time","XL(Full-time)"],["Part_time","XL(Part-time)"],["Retired","XL(Retired)"]],
   flags:"other"});

  last_referred_value=lookup("Monthly_income_sources");do_var({
   name:"Monthly_income_sources",
   type:"anyof",
   prompttext:"XL(Monthly income sources)",
   presentation:"buttons",
   choices:[["Full_time_employment","XL(Full-time employment)"],["Part_time_employment","XL(Part-time employment)"],["Social_Security","XL(Social Security)"],["Disability","XL(Disability)"],["No_income","XL(No income)"]],
   flags:"other"});

  last_referred_value=lookup("Monthly_income");do_var({
   name:"Monthly_income",
   type:"text",
   prompttext:"XL(Monthly income)",
   rows:1,
   cols:40,
   must:" checkexp(lookup('this'),/^\\d\\d*/) "});

  last_referred_value=lookup("Social_services_received");do_var({
   name:"Social_services_received",
   type:"anyof",
   prompttext:"XL(Social services received)",
   presentation:"buttons",
   choices:[["Elderly_Low_Cost_Drug_Program","XL(Elderly Low Cost Drug Program)"],["Elderly_Tax_and_Rent_Refund","XL(Elderly Tax and Rent Refund)"],["General_Assistance","XL(General Assistance)"],["LIHEAP","XL(LIHEAP)"],["Medicaid_Mainecare","XL(Medicaid/Mainecare)"],["Medicare","XL(Medicare)"],["School_Meals","XL(School Meals)"],["SNAP","XL(SNAP - formerly food stamps)"],["SSDI","XL(SSDI)"],["SSI","XL(SSI)"],["TANF","XL(TANF)"],["WIC","XL[Supplemental Assistance for Women, Infants and Children (WIC)]"],["Vets_Aid","XL(Vets Aid)"]],
   flags:"other"});

  last_referred_value=lookup("Dietary_considerations");do_var({
   name:"Dietary_considerations",
   type:"anyof",
   prompttext:"XL(Dietary considerations)",
   presentation:"buttons",
   choices:[["Diabetic","XL(Diabetic)"],["Vegan","XL(Vegan)"],["Vegetarian","XL(Vegetarian)"],["Gluten_free","XL(Gluten free)"],["Egg","XL(Egg)"],["Fruit","XL(Fruit)"],["Milk","XL(Milk)"],["Sesame","XL(Sesame)"],["Soy","XL(Soy)"],["MSG","XL(MSG)"],["Peanut","XL(Peanut)"],["Pork","XL(Pork)"],["Seafood","XL(Seafood)"],["Sulphite","XL(Sulphite)"],["Tree_nuts","XL(Tree nuts)"],["Wheat","XL(Wheat)"]],
   flags:"other"});
  end_section();}

  {  section("XL(Other household members)");


  tripvar.push(false); varcontexts.push(-1); while(!tripvar[tripvar.length-1]){varcontexts[varcontexts.length-1]++;
   {prefixes="Other_household_member_";

   last_referred_value=lookup("Relationship_to_me");
   if( ! listitem("Relationship_to_me") ) {prefixes="";continue;}
last_var = do_var({
    name:"Relationship_to_me",
    type:"oneof",
    prompttext:"XL(Relationship to me)",
    presentation:"buttons",
    choices:[["Spouse","XL(Spouse)"],["Sibling","XL(Sibling)"],["Child","XL(Child)"],["Parent","XL(Parent)"],["Grandchild","XL(Grandchild)"],["Grandparent","XL(Grandparent)"],["Roommate","XL(Roommate)"],["Boyfriend_Girlfriend","XL(Boyfriend/Girlfriend)"],["Friend","XL(Friend)"],["Partner","XL(Partner)"],["Ward","XL(Ward)"],["Prefer_not_to_say","XL(Prefer not to say)"]],
    flags:"adddel,other"});
   if(last_var=="" || last_var=="Unanswered"){prefixes="";break;}

   last_referred_value=lookup("Household_member_Last_name");do_var({
    name:"Household_member_Last_name",
    type:"text",
    prompttext:"XL(Household member Last name)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Household_member_First_name");do_var({
    name:"Household_member_First_name",
    type:"text",
    prompttext:"XL(Household member First name)",
    rows:1,
    cols:30,
    must:" checkexp(lookup('this'),/./) "});

   last_referred_value=lookup("Household_member_DOB");do_var({
    name:"Household_member_DOB",
    type:"datetime",
    prompttext:"XL(Date of birth)",
    presentation:"just_date",
    before:( lookup('Information_entered_date_and_time') )});

   last_referred_value=lookup("Household_member_Ethnicity");do_var({
    name:"Household_member_Ethnicity",
    type:"oneof",
    prompttext:"XL(Household member Ethnicity)",
    presentation:"buttons",
    choices:[["White_Anglo","XL(White/Anglo)"],["Asian","XL(Asian)"],["Middle_Eastern_North_African","XL(Middle Eastern/North African)"],["Black_African_American","XL(Black/African American)"]],
    flags:"other"});

   last_referred_value=lookup("Household_member_things_apply");do_var({
    name:"Household_member_things_apply",
    type:"anyof",
    prompttext:"XL(Household member things apply)",
    presentation:"buttons",
    choices:[["Breastfeeding","XL(Breastfeeding)"],["Postpartum","XL(Postpartum)"],["Pregnant","XL(Pregnant)"],["Veteran","XL(Veteran)"],["Disability","XL(Disability)"],["Evacuee","XL(Evacuee)"],["Refugee","XL(Refugee)"],["History_of_homelessness","XL(History of homelessness)"],["Prefer_not_to_say","XL(Prefer not to say)"]],
    flags:"other"});
   prefixes="";}
  } varcontexts.pop(); tripvar.pop();
  end_section();}

  {  section("XL(Anything else we should know)");


  last_referred_value=lookup("Notes");do_var({
   name:"Notes",
   type:"text",
   prompttext:"XL(Notes)",
   rows:30,
   cols:60});
  end_section();}
 }
