var MUST_BE_RIGHT=5;
var q_array = new Array();
var cur_question = -1;
var num_right = 0;
var num_wrong = 0;
function do_a_concept( concept_num )
 {

 {var _switchval=(( concept_num ));
  if(_switchval=="0")
   {

   do_html('XL(<center> Civilian hard-surfaced runway greater than 8069 feet or multiple runways<br> <img src="Sectionals/Civilian_hard-surfaced_runway_greater_than_8069_feet_or_multiple_runways.jpg"><hr> Civilian hard-surfaced runways 1500 to 8069 feet<br> <img src="Sectionals/Civilian_hard-surfaced_runways_1500_to_8069_feet.jpg"><hr> Civilian other than hard-surfaced runways<br> <img src="Sectionals/Civilian_other_than_hard-surfaced_runways.jpg"><hr> Civilian seaplane base<br> <img src="Sectionals/Civilian_seaplane_base.jpg"> </center> )',0,"exposition");
   }
  else if(_switchval=="1")
   {

   do_html("XL( )",0,"exposition");
   }
  else if(_switchval=="2")
   {

   do_html('XL(<center> Lit obstacle 1000 AGL and higher<br> <img src="Sectionals/Lit_obstacle_1000_AGL_and_higher.jpg"><hr> Lit obstacle less than 1000 AGL<br> <img src="Sectionals/Lit_obstacle_less_than_1000_AGL.jpg"><hr> Unlit obstacle 1000 AGL and higher<br> <img src="Sectionals/Unlit_obstacle_1000_AGL_and_higher.jpg"><hr> Unlit obstacle less than 1000 AGL<br> <img src="Sectionals/Unlit_obstacle_less_than_1000_AGL.jpg"></center> )',0,"exposition");
   }
  else if(_switchval=="3")
   {

   do_html("XL( )",0,"exposition");
   }
  else if(_switchval=="4")
   {

   do_html('XL(<center> Alert area<br> <img src="Sectionals/Alert_area.jpg"><hr> Military Operations area<br> <img src="Sectionals/Military_Operations_area.jpg"><hr> Prohibited Restricted or Warning area<br> <img src="Sectionals/Prohibited_Restricted_or_Warning_area.jpg"></center> )',0,"exposition");
   }
  else if(_switchval=="5")
   {

   do_html("XL( )",0,"exposition");
   }
  else if(_switchval=="6")
   {

   do_html('XL[ With the following notation next to an object:<br> <img src="Sectionals/5540_MSL_650_AGL.jpg"> A blue number not in parentheses, indicates the altitude of the top of an object with respect to mean sea level (MSL). A blue number within parentheses indicates the altitude above the ground (AGL). In this case, the top of the object is 5540 feet MSL or 650 feet AGL. ]',0,"exposition");
   }
  else if(_switchval=="7")
   {

   do_html("XL( )",0,"exposition");
   }
  else if(_switchval=="8")
   {

   do_html('XL[ With the following notation next to an object:<br> <img src="Sectionals/5540_MSL_650_AGL.jpg"> A blue number not in parentheses, indicates the altitude of the top of an object with respect to mean sea level (MSL). A blue number within parentheses indicates the altitude above the ground (AGL). In this case, the top of the object is 5540 feet MSL or 650 feet AGL. ]',0,"exposition");
   }
  else if(_switchval=="9")
   {

   do_html("XL( )",0,"exposition");
   }
  else if(_switchval=="10")
   {

   do_html('XL[ A large blue number followed by a small blue digit shows the highest altitude in this section of the map in hundreds of feet above mean sea level (MSL). For instance:<br> <img src="Sectionals/Maximum_elevation.jpg"><br> means that the highest tourain in the section is 12,500 feet. ]',0,"exposition");
   }
  else if(_switchval=="11")
   {

   do_html("XL( )",0,"exposition");
   }
 }
 }

function right_wrong( answer, right_answer, concept_num )
 {

 if( ( answer ) )
  {

  if( ( answer == right_answer ) )
   {

   do_html("XL(<center>Right!</center><hr>)",0,"exposition");

cur_question = next_question();
num_right++;   }
  else
   {

   do_html("XL(<center>Wrong!</center><hr>)",0,"exposition");

do_a_concept( concept_num );
   do_html("XL(<hr>)",0,"exposition");

num_wrong++;   }
  }
 }

function setup_questions()
 {

for ( var question_ctr=18; question_ctr-->0; )
  {

for( var i=0; i<MUST_BE_RIGHT; i++ )
   {
 q_array.push( question_ctr );   }
  }
 }

function next_question()
 {

var q_ind = Math.floor( Math.random() * q_array.length );
var ind = q_array[ q_ind ];
q_array[ q_ind ] = q_array.pop();
return ind; }

function redraw()
 {

 if( ( cur_question < 0 ) )
  {

cur_question = next_question();  }
 {var _switchval=( cur_question );
  if(_switchval=="0")
   {

right_wrong( lookup('center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_hard_surfaced_runway_greater_than_8069_feet_or_multiple_runways_jpg_center'), "Civilian_hard_surfaced_runway_greater_than_8069_feet_or_multiple_runways", 0 );
   setvar( 'center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_hard_surfaced_runway_greater_than_8069_feet_or_multiple_runways_jpg_center', "" );
   }
  else if(_switchval=="1")
   {

right_wrong( lookup('center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_hard_surfaced_runways_1500_to_8069_feet_jpg_center'), "Civilian_hard_surfaced_runways_1500_to_8069_feet", 0 );
   setvar( 'center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_hard_surfaced_runways_1500_to_8069_feet_jpg_center', "" );
   }
  else if(_switchval=="2")
   {

right_wrong( lookup('center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_other_than_hard_surfaced_runways_jpg_center'), "Civilian_other_than_hard_surfaced_runways", 0 );
   setvar( 'center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_other_than_hard_surfaced_runways_jpg_center', "" );
   }
  else if(_switchval=="3")
   {

right_wrong( lookup('center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_seaplane_base_jpg_center'), "Civilian_seaplane_base", 0 );
   setvar( 'center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_seaplane_base_jpg_center', "" );
   }
  else if(_switchval=="4")
   {

right_wrong( lookup('center_What_is_this_br_img_src_Sectionals_Lit_obstacle_1000_AGL_and_higher_jpg_center'), "Lit_obstacle_1000_AGL_and_higher", 2 );
   setvar( 'center_What_is_this_br_img_src_Sectionals_Lit_obstacle_1000_AGL_and_higher_jpg_center', "" );
   }
  else if(_switchval=="5")
   {

right_wrong( lookup('center_What_is_this_br_img_src_Sectionals_Lit_obstacle_less_than_1000_AGL_jpg_center'), "Lit_obstacle_less_than_1000_AGL", 2 );
   setvar( 'center_What_is_this_br_img_src_Sectionals_Lit_obstacle_less_than_1000_AGL_jpg_center', "" );
   }
  else if(_switchval=="6")
   {

right_wrong( lookup('center_What_is_this_br_img_src_Sectionals_Unlit_obstacle_1000_AGL_and_higher_jpg_center'), "Unlit_obstacle_1000_AGL_and_higher", 2 );
   setvar( 'center_What_is_this_br_img_src_Sectionals_Unlit_obstacle_1000_AGL_and_higher_jpg_center', "" );
   }
  else if(_switchval=="7")
   {

right_wrong( lookup('center_What_is_this_br_img_src_Sectionals_Unlit_obstacle_less_than_1000_AGL_jpg_center'), "Unlit_obstacle_less_than_1000_AGL", 2 );
   setvar( 'center_What_is_this_br_img_src_Sectionals_Unlit_obstacle_less_than_1000_AGL_jpg_center', "" );
   }
  else if(_switchval=="8")
   {

right_wrong( lookup('center_What_is_this_br_img_src_Sectionals_Alert_area_jpg'), "Alert_area", 4 );
   setvar( 'center_What_is_this_br_img_src_Sectionals_Alert_area_jpg', "" );
   }
  else if(_switchval=="9")
   {

right_wrong( lookup('center_What_is_this_br_img_src_Sectionals_Military_Operations_area_jpg'), "Military_Operations_area", 4 );
   setvar( 'center_What_is_this_br_img_src_Sectionals_Military_Operations_area_jpg', "" );
   }
  else if(_switchval=="10")
   {

right_wrong( lookup('center_What_is_this_br_img_src_Sectionals_Prohibited_Restricted_or_Warning_area_jpg'), "Prohibited_Restricted_or_Warning_area", 4 );
   setvar( 'center_What_is_this_br_img_src_Sectionals_Prohibited_Restricted_or_Warning_area_jpg', "" );
   }
  else if(_switchval=="11")
   {

right_wrong( lookup('If_the_following_appeared_next_to_an_object_br_img_src_Sectionals_5540_MSL_650_AGL_jpg_br_What_is_the_altitude_above_ground_level_AGL_of_the_top_of_the_object'), "_650", 6 );
   setvar( 'If_the_following_appeared_next_to_an_object_br_img_src_Sectionals_5540_MSL_650_AGL_jpg_br_What_is_the_altitude_above_ground_level_AGL_of_the_top_of_the_object', "" );
   }
  else if(_switchval=="12")
   {

right_wrong( lookup('If_the_following_appeared_next_to_an_object_br_img_src_Sectionals_5540_MSL_650_AGL_jpg_br_What_is_the_altitude_above_mean_sea_level_MSL_of_the_top_of_the_object'), "_5540", 6 );
   setvar( 'If_the_following_appeared_next_to_an_object_br_img_src_Sectionals_5540_MSL_650_AGL_jpg_br_What_is_the_altitude_above_mean_sea_level_MSL_of_the_top_of_the_object', "" );
   }
  else if(_switchval=="13")
   {

right_wrong( lookup('img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_bottom_of_Garfield_stack_above_ground_level_AGL'), "_0", 8 );
   setvar( 'img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_bottom_of_Garfield_stack_above_ground_level_AGL', "" );
   }
  else if(_switchval=="14")
   {

right_wrong( lookup('img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_bottom_of_Garfield_stack_above_mean_sea_level_MSL'), "_4890", 8 );
   setvar( 'img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_bottom_of_Garfield_stack_above_mean_sea_level_MSL', "" );
   }
  else if(_switchval=="15")
   {

right_wrong( lookup('img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_top_of_Garfield_stack_above_ground_level_AGL'), "_650", 8 );
   setvar( 'img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_top_of_Garfield_stack_above_ground_level_AGL', "" );
   }
  else if(_switchval=="16")
   {

right_wrong( lookup('img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_top_of_Garfield_stack_above_mean_sea_level_MSL'), "_5540", 8 );
   setvar( 'img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_top_of_Garfield_stack_above_mean_sea_level_MSL', "" );
   }
  else if(_switchval=="17")
   {

right_wrong( lookup('img_src_Sectionals_Maximum_elevation_jpg_br_means_that_the_highest_tourain_in_this_section_is'), "_12_5_feet", 10 );
   setvar( 'img_src_Sectionals_Maximum_elevation_jpg_br_means_that_the_highest_tourain_in_this_section_is', "" );
   }
 }

 {var _switchval=( cur_question );
  if(_switchval=="0")
   {

   last_referred_value=lookup("center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_hard_surfaced_runway_greater_than_8069_feet_or_multiple_runways_jpg_center");do_var({
    name:"center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_hard_surfaced_runway_greater_than_8069_feet_or_multiple_runways_jpg_center",
    type:"oneof",
    prompttext:'XL(<center> What type of airport is this?<br> <img src="Sectionals/Civilian_hard-surfaced_runway_greater_than_8069_feet_or_multiple_runways.jpg"> </center>)',
    presentation:"checks",
    choices:[["Civilian_hard_surfaced_runway_greater_than_8069_feet_or_multiple_runways","XL(Civilian hard-surfaced runway greater than 8069 feet or multiple runways)"],["Civilian_hard_surfaced_runways_1500_to_8069_feet","XL(Civilian hard-surfaced runways 1500 to 8069 feet)"],["Civilian_other_than_hard_surfaced_runways","XL(Civilian other than hard-surfaced runways)"],["Civilian_seaplane_base","XL(Civilian seaplane base)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="1")
   {

   last_referred_value=lookup("center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_hard_surfaced_runways_1500_to_8069_feet_jpg_center");do_var({
    name:"center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_hard_surfaced_runways_1500_to_8069_feet_jpg_center",
    type:"oneof",
    prompttext:'XL(<center> What type of airport is this?<br> <img src="Sectionals/Civilian_hard-surfaced_runways_1500_to_8069_feet.jpg"> </center>)',
    presentation:"checks",
    choices:[["Civilian_hard_surfaced_runways_1500_to_8069_feet","XL(Civilian hard-surfaced runways 1500 to 8069 feet)"],["Civilian_hard_surfaced_runway_greater_than_8069_feet_or_multiple_runways","XL(Civilian hard-surfaced runway greater than 8069 feet or multiple runways)"],["Civilian_other_than_hard_surfaced_runways","XL(Civilian other than hard-surfaced runways)"],["Civilian_seaplane_base","XL(Civilian seaplane base)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="2")
   {

   last_referred_value=lookup("center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_other_than_hard_surfaced_runways_jpg_center");do_var({
    name:"center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_other_than_hard_surfaced_runways_jpg_center",
    type:"oneof",
    prompttext:'XL(<center> What type of airport is this?<br> <img src="Sectionals/Civilian_other_than_hard-surfaced_runways.jpg"> </center>)',
    presentation:"checks",
    choices:[["Civilian_other_than_hard_surfaced_runways","XL(Civilian other than hard-surfaced runways)"],["Civilian_hard_surfaced_runway_greater_than_8069_feet_or_multiple_runways","XL(Civilian hard-surfaced runway greater than 8069 feet or multiple runways)"],["Civilian_hard_surfaced_runways_1500_to_8069_feet","XL(Civilian hard-surfaced runways 1500 to 8069 feet)"],["Civilian_seaplane_base","XL(Civilian seaplane base)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="3")
   {

   last_referred_value=lookup("center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_seaplane_base_jpg_center");do_var({
    name:"center_What_type_of_airport_is_this_br_img_src_Sectionals_Civilian_seaplane_base_jpg_center",
    type:"oneof",
    prompttext:'XL(<center> What type of airport is this?<br> <img src="Sectionals/Civilian_seaplane_base.jpg"> </center>)',
    presentation:"checks",
    choices:[["Civilian_seaplane_base","XL(Civilian seaplane base)"],["Civilian_hard_surfaced_runway_greater_than_8069_feet_or_multiple_runways","XL(Civilian hard-surfaced runway greater than 8069 feet or multiple runways)"],["Civilian_hard_surfaced_runways_1500_to_8069_feet","XL(Civilian hard-surfaced runways 1500 to 8069 feet)"],["Civilian_other_than_hard_surfaced_runways","XL(Civilian other than hard-surfaced runways)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="4")
   {

   last_referred_value=lookup("center_What_is_this_br_img_src_Sectionals_Lit_obstacle_1000_AGL_and_higher_jpg_center");do_var({
    name:"center_What_is_this_br_img_src_Sectionals_Lit_obstacle_1000_AGL_and_higher_jpg_center",
    type:"oneof",
    prompttext:'XL(<center> What is this?<br> <img src="Sectionals/Lit_obstacle_1000_AGL_and_higher.jpg"> </center>)',
    presentation:"checks",
    choices:[["Lit_obstacle_1000_AGL_and_higher","XL( Lit obstacle 1000 AGL and higher)"],["Lit_obstacle_less_than_1000_AGL","XL(Lit obstacle less than 1000 AGL)"],["Unlit_obstacle_1000_AGL_and_higher","XL(Unlit obstacle 1000 AGL and higher)"],["Unlit_obstacle_less_than_1000_AGL","XL(Unlit obstacle less than 1000 AGL)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="5")
   {

   last_referred_value=lookup("center_What_is_this_br_img_src_Sectionals_Lit_obstacle_less_than_1000_AGL_jpg_center");do_var({
    name:"center_What_is_this_br_img_src_Sectionals_Lit_obstacle_less_than_1000_AGL_jpg_center",
    type:"oneof",
    prompttext:'XL(<center> What is this?<br> <img src="Sectionals/Lit_obstacle_less_than_1000_AGL.jpg"> </center>)',
    presentation:"checks",
    choices:[["Lit_obstacle_less_than_1000_AGL","XL( Lit obstacle less than 1000 AGL)"],["Lit_obstacle_1000_AGL_and_higher","XL(Lit obstacle 1000 AGL and higher)"],["Unlit_obstacle_1000_AGL_and_higher","XL(Unlit obstacle 1000 AGL and higher)"],["Unlit_obstacle_less_than_1000_AGL","XL(Unlit obstacle less than 1000 AGL)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="6")
   {

   last_referred_value=lookup("center_What_is_this_br_img_src_Sectionals_Unlit_obstacle_1000_AGL_and_higher_jpg_center");do_var({
    name:"center_What_is_this_br_img_src_Sectionals_Unlit_obstacle_1000_AGL_and_higher_jpg_center",
    type:"oneof",
    prompttext:'XL(<center> What is this?<br> <img src="Sectionals/Unlit_obstacle_1000_AGL_and_higher.jpg"> </center>)',
    presentation:"checks",
    choices:[["Unlit_obstacle_1000_AGL_and_higher","XL( Unlit obstacle 1000 AGL and higher)"],["Lit_obstacle_1000_AGL_and_higher","XL(Lit obstacle 1000 AGL and higher)"],["Lit_obstacle_less_than_1000_AGL","XL(Lit obstacle less than 1000 AGL)"],["Unlit_obstacle_less_than_1000_AGL","XL(Unlit obstacle less than 1000 AGL)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="7")
   {

   last_referred_value=lookup("center_What_is_this_br_img_src_Sectionals_Unlit_obstacle_less_than_1000_AGL_jpg_center");do_var({
    name:"center_What_is_this_br_img_src_Sectionals_Unlit_obstacle_less_than_1000_AGL_jpg_center",
    type:"oneof",
    prompttext:'XL(<center> What is this?<br> <img src="Sectionals/Unlit_obstacle_less_than_1000_AGL.jpg"> </center>)',
    presentation:"checks",
    choices:[["Unlit_obstacle_less_than_1000_AGL","XL( Unlit obstacle less than 1000 AGL)"],["Lit_obstacle_1000_AGL_and_higher","XL(Lit obstacle 1000 AGL and higher)"],["Lit_obstacle_less_than_1000_AGL","XL(Lit obstacle less than 1000 AGL)"],["Unlit_obstacle_1000_AGL_and_higher","XL(Unlit obstacle 1000 AGL and higher)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="8")
   {

   last_referred_value=lookup("center_What_is_this_br_img_src_Sectionals_Alert_area_jpg");do_var({
    name:"center_What_is_this_br_img_src_Sectionals_Alert_area_jpg",
    type:"oneof",
    prompttext:'XL(<center> What is this?<br> <img src="Sectionals/Alert_area.jpg">)',
    presentation:"checks",
    choices:[["Alert_area","XL(Alert area)"],["Military_Operations_area","XL(Military Operations area)"],["Prohibited_Restricted_or_Warning_area","XL(Prohibited Restricted or Warning area)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="9")
   {

   last_referred_value=lookup("center_What_is_this_br_img_src_Sectionals_Military_Operations_area_jpg");do_var({
    name:"center_What_is_this_br_img_src_Sectionals_Military_Operations_area_jpg",
    type:"oneof",
    prompttext:'XL(<center> What is this?<br> <img src="Sectionals/Military_Operations_area.jpg">)',
    presentation:"checks",
    choices:[["Military_Operations_area","XL(Military Operations area)"],["Alert_area","XL(Alert area)"],["Prohibited_Restricted_or_Warning_area","XL(Prohibited Restricted or Warning area)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="10")
   {

   last_referred_value=lookup("center_What_is_this_br_img_src_Sectionals_Prohibited_Restricted_or_Warning_area_jpg");do_var({
    name:"center_What_is_this_br_img_src_Sectionals_Prohibited_Restricted_or_Warning_area_jpg",
    type:"oneof",
    prompttext:'XL(<center> What is this?<br> <img src="Sectionals/Prohibited_Restricted_or_Warning_area.jpg">)',
    presentation:"checks",
    choices:[["Prohibited_Restricted_or_Warning_area","XL(Prohibited Restricted or Warning area)"],["Alert_area","XL(Alert area)"],["Military_Operations_area","XL(Military Operations area)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="11")
   {

   last_referred_value=lookup("If_the_following_appeared_next_to_an_object_br_img_src_Sectionals_5540_MSL_650_AGL_jpg_br_What_is_the_altitude_above_ground_level_AGL_of_the_top_of_the_object");do_var({
    name:"If_the_following_appeared_next_to_an_object_br_img_src_Sectionals_5540_MSL_650_AGL_jpg_br_What_is_the_altitude_above_ground_level_AGL_of_the_top_of_the_object",
    type:"oneof",
    prompttext:'XL[If the following appeared next to an object:<br> <img src="Sectionals/5540_MSL_650_AGL.jpg"><br> What is the altitude above ground level (AGL) of the top of the object?]',
    presentation:"checks",
    choices:[["_650","XL(650)"],["_5540","XL(5540)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="12")
   {

   last_referred_value=lookup("If_the_following_appeared_next_to_an_object_br_img_src_Sectionals_5540_MSL_650_AGL_jpg_br_What_is_the_altitude_above_mean_sea_level_MSL_of_the_top_of_the_object");do_var({
    name:"If_the_following_appeared_next_to_an_object_br_img_src_Sectionals_5540_MSL_650_AGL_jpg_br_What_is_the_altitude_above_mean_sea_level_MSL_of_the_top_of_the_object",
    type:"oneof",
    prompttext:'XL[If the following appeared next to an object:<br> <img src="Sectionals/5540_MSL_650_AGL.jpg"><br> What is the altitude above mean sea level (MSL) of the top of the object?]',
    presentation:"checks",
    choices:[["_5540","XL(5540)"],["_650","XL(650)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="13")
   {

   last_referred_value=lookup("img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_bottom_of_Garfield_stack_above_ground_level_AGL");do_var({
    name:"img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_bottom_of_Garfield_stack_above_ground_level_AGL",
    type:"oneof",
    prompttext:'XL[<img src="Sectionals/Garfield_stack.jpg"><br> How many feet is the bottom of Garfield stack above ground level (AGL)?]',
    presentation:"checks",
    choices:[["_0","XL(0)"],["_4890","XL(4890)"],["_5540","XL(5540)"],["_650","XL(650)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="14")
   {

   last_referred_value=lookup("img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_bottom_of_Garfield_stack_above_mean_sea_level_MSL");do_var({
    name:"img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_bottom_of_Garfield_stack_above_mean_sea_level_MSL",
    type:"oneof",
    prompttext:'XL[<img src="Sectionals/Garfield_stack.jpg"><br> How many feet is the bottom of Garfield stack above mean sea level (MSL)?]',
    presentation:"checks",
    choices:[["_4890","XL(4890)"],["_0","XL(0)"],["_5540","XL(5540)"],["_650","XL(650)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="15")
   {

   last_referred_value=lookup("img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_top_of_Garfield_stack_above_ground_level_AGL");do_var({
    name:"img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_top_of_Garfield_stack_above_ground_level_AGL",
    type:"oneof",
    prompttext:'XL[<img src="Sectionals/Garfield_stack.jpg"><br> How many feet is the top of Garfield stack above ground level (AGL)?]',
    presentation:"checks",
    choices:[["_650","XL(650)"],["_0","XL(0)"],["_4890","XL(4890)"],["_5540","XL(5540)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="16")
   {

   last_referred_value=lookup("img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_top_of_Garfield_stack_above_mean_sea_level_MSL");do_var({
    name:"img_src_Sectionals_Garfield_stack_jpg_br_How_many_feet_is_the_top_of_Garfield_stack_above_mean_sea_level_MSL",
    type:"oneof",
    prompttext:'XL[<img src="Sectionals/Garfield_stack.jpg"><br> How many feet is the top of Garfield stack above mean sea level (MSL)?]',
    presentation:"checks",
    choices:[["_5540","XL(5540)"],["_0","XL(0)"],["_4890","XL(4890)"],["_650","XL(650)"]],
    flags:"random_order,line_per"});
   }
  else if(_switchval=="17")
   {

   last_referred_value=lookup("img_src_Sectionals_Maximum_elevation_jpg_br_means_that_the_highest_tourain_in_this_section_is");do_var({
    name:"img_src_Sectionals_Maximum_elevation_jpg_br_means_that_the_highest_tourain_in_this_section_is",
    type:"oneof",
    prompttext:'XL(<img src="Sectionals/Maximum_elevation.jpg"><br> means that the highest tourain in this section is:)',
    presentation:"checks",
    choices:[["_12_5_feet","XL(12.5 feet)"],["_125_feet","XL(125 feet)"],["_1250_feet","XL(1250 feet)"],["_12500_feet","XL(12500 feet)"]],
    flags:"random_order,line_per"});
   }
 }

var s = "<center><table border=1><tr><td>Right:"+num_right+"</td><td>Wrong:"+num_wrong+"</td><td>Total:18</td></tr></table></center>";
 do_html( s ,0,"exposition");
 }

setup_questions();