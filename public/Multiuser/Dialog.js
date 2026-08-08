function redraw()
 {

 last_referred_value=lookup("Full_Name");do_var({
  name:"Full_Name",
  type:"text",
  prompttext:"XL(Full Name)",
  rows:1,
  cols:50,
  must:" checkexp(lookup('this'),/^\\w.* \\w.*$/) "});

 last_referred_value=lookup("Email");do_var({
  name:"Email",
  type:"text",
  prompttext:"XL(Email)",
  rows:1,
  cols:50,
  must:" checkexp(lookup('this'),/^\\w.*@\\w[^,\\s]*\\.\\w[^,\\s]*\\w*$/) "});

 last_referred_value=lookup("Username");do_var({
  name:"Username",
  type:"text",
  prompttext:"XL(Username)",
  rows:1,
  cols:10,
  must:" checkexp(lookup('this'),/^[a-z][a-z0-9]*$/) "});

 last_referred_value=lookup("How_do_you_know_about_this_site");do_var({
  name:"How_do_you_know_about_this_site",
  type:"text",
  prompttext:"XL(How do you know about this site)",
  rows:1,
  cols:50});

 last_referred_value=lookup("SSH_public_key");do_var({
  name:"SSH_public_key",
  type:"text",
  prompttext:"XL(If you have an SSH public key, cut and paste it here)",
  rows:10,
  cols:80});
 }
