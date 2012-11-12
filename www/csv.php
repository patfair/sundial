<?
/*
 * Copyright 2008 Patrick Fairbank. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
 * EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
 * BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Provides an interface an administrator to upload a CSV file containing a team list or schedule
 * and stores the data in the database.
 */

require('include.php');
?>
<html>
  <head>
    <title>Sundial Control Panel | Data Upload</title>
  </head>
  <body>
<?
// Display the event name since this page is event-specific.
$event = (int)$_GET['event'];
$results_event = mysql_query("SELECT name FROM events WHERE event_id = '$event'") or
    die(mysql_error());
$row_event = mysql_fetch_object($results_event);
echo "<p>Event: $row_event->name</p>";

// Process the uploaded file if this page has just been POSTed to.
if (isset($_POST['submit']) && $_FILES['csv']['size'] > 0) {
  // Read at most 100 KB of the uploaded file into memory.
  $file = fopen($_FILES['csv']['tmp_name'], 'r');
  $data = fread($file, 100000);
  
  $records_count = 0;
  $records_type = "";
  
  if ($_POST['submit'] == "Teams") {
    // Parse the CSV file as a team list.
    $records_type = "teams";
    $teams = split("\n", $data);

    // Clear the existing team records for this event.    
    mysql_query("DELETE FROM teams WHERE event_id = '$event'") or die(mysql_error());
    
    foreach ($teams as $team) {
      // Make sure the data is numeric.
      if (ereg("[0-9]+", $team) && !ereg(",", $team)) {
        mysql_query("INSERT INTO teams VALUES ('$event', '$team')") or die(mysql_error());
        $records_count++;
      }
    }
  } else if ($_POST['submit'] == "Practice Matches" ||
      $_POST['submit'] == "Qualification Matches") {
    // Parse the CSV file as a schedule.
    $level = 0;
    $records_type = "practice matches";
    if ($_POST['submit'] == "Qualification Matches") {
      $level = 1;
      $records_type = "qualification matches";
    }
    $matches = split("\n", $data);
    
    // Clear the existing match records for this event and level.
    mysql_query("DELETE FROM matches WHERE event_id = '$event' AND level = '$level'") or
        die(mysql_error());

    foreach ($matches as $match_blob) {
      $match = split(",", $match_blob);
      // Make sure the match listing has the correct number of columns.
      if (count($match) == 9) {
        $time = strtotime($match[1] . " " . $match[2]);
        mysql_query("INSERT INTO matches VALUES ('$event', '$match[0]', '$level', '$time',
            '$match[3]', '$match[4]', '$match[5]', '$match[6]', '$match[7]', '$match[8]', '0')") or
            die(mysql_error());
        $records_count++;
      }
    }
  }
  
  echo "<p>$records_count $records_type inserted.</p>";
}

?>
    <form enctype='multipart/form-data' action='' method='POST'>
      CSV file:
      <input type='file' name='csv' />
      <br /><br />
      Upload data as:
      <input type='submit' name='submit' value='Teams' />
      <input type='submit' name='submit' value='Practice Matches' />
      <input type='submit' name='submit' value='Qualification Matches' />
    </form>
  </body>
</html>
