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
 * Contains functions for managing storage of data in the database and exchanging it with the
 * JavaScript clients.
 */

require('include.php');

// Output is in JSON (JavaScript Object Notation) format.
header("Content-Type: application/json");

if (!isset($_GET['action'])) {
  die("Error: No action specified.");
}

// Update the statistics associated with the requesting team.
if (isset($_GET['team'])) {
  $event = (int)$_GET['event'];
  $team = (int)$_GET['team'];

  $current_time = time();

  // Check if the team already has an entry in the statistics table for the given event.
  $result_statistics = mysql_query(
      "SELECT * FROM statistics WHERE event_id = '$event' AND team_number = '$team'")
      or die(mysql_error());

  if (mysql_num_rows($result_statistics) == 0) {
    // Make sure the team is a valid team for the given event before making a new statistics entry.
    $result_teams = mysql_query("SELECT * FROM teams WHERE team_number = '$team'")
        or die(mysql_error());
    if (mysql_num_rows($result_teams) != 0) {
      mysql_query("INSERT INTO statistics VALUES ('$event', '$team', 1, '$current_time')")
          or die(mysql_error());
    }
  } else {
    mysql_query(
        "UPDATE statistics SET accesses = accesses + 1, last_access = '$current_time'
            WHERE event_id = '$event' AND team_number = '$team'") or die(mysql_error());
  }
}

// Call the appropriate handler for the given action.
switch ($_GET['action']) {
  case "events": {
    get_events();
    break;
  }
  case "teams": {
    get_teams();
    break;
  }
  case "matchlist": {
    get_matchlist();
    break;
  }
  case "status": {
    get_status();
    break;
  }
  case "schedule": {
    get_schedule();
    break;
  }
  case "admin_global": {
    admin_global();
    break;
  }
  case "admin_set_global": {
    admin_set_global();
    break;
  }
  case "admin_change_password": {
    admin_change_password();
    break;
  }
  case "admin_events": {
    admin_events();
    break;
  }
  case "admin_set_event": {
    admin_set_event();
    break;
  }
  case "admin_add_event": {
    admin_add_event();
    break;
  }
  case "admin_delete_event": {
    admin_delete_event();
    break;
  }
  case "admin_clear_teams": {
    admin_clear_teams();
    break;
  }
  case "admin_clear_matches": {
    admin_clear_matches();
    break;
  }
  case "admin_statistics": {
    admin_statistics();
    break;
  }
  case "admin_clear_statistics": {
    admin_clear_statistics();
    break;
  }
  default: {
    die("Error: Invalid action.");
  }
}

/**
 * Retrieves and outputs the list of active events on the server.
 */
function get_events() {
  $result_events = mysql_query(
      "SELECT event_id, name FROM events WHERE enabled = 1 ORDER BY name") or die(mysql_error());

  echo "{ events: [";
  $first = 1;
  while ($row_events = mysql_fetch_object($result_events)) {
    if (!$first) {
      echo ",";
    }
    $first = 0;
    echo "{ id: $row_events->event_id, name: \"$row_events->name\" }";
  }
  echo "]}";
}

/**
 * Retrieves and outputs the list of teams for the given event.
 */
function get_teams() {
  $event = (int)$_GET['event'];

  $result_teams = mysql_query(
      "SELECT team_number FROM teams WHERE event_id = '$event' ORDER BY team_number")
      or die(mysql_error());

  echo "{ teams: [";
  $first = 1;
  while ($row_teams = mysql_fetch_object($result_teams)) {
    if (!$first) {
      echo ",";
    }
    $first = 0;
    echo "$row_teams->team_number";
  }
  echo "]}";
}

/**
 * Retrieves and outputs the requesting team's matchlist.
 */
function get_matchlist() {
  global $settings;

  $event = (int)$_GET['event'];
  $team = (int)$_GET['team'];

  $result_matches = mysql_query(
      "SELECT match_number, time, red1, red2, red3, blue1, blue2, blue3, status FROM matches
          WHERE matches.event_id = '$event' AND level = '$settings->level' AND
          (red1 = '$team' OR red2 = '$team' OR red3 = '$team' OR
          blue1 = '$team' OR blue2 = '$team' OR blue3 = '$team')
          ORDER BY match_number") or die(mysql_error());

  echo "{ matches: [";
  $first = 1;
  while ($row_matches = mysql_fetch_object($result_matches)) {
    if (!$first) {
      echo ",";
    }
    $first = 0;
    echo "{ number: $row_matches->match_number, time: \"$row_matches->time\",
        red1: $row_matches->red1, red2: $row_matches->red2, red3: $row_matches->red3,
        blue1: $row_matches->blue1, blue2: $row_matches->blue2, blue3: $row_matches->blue3,
        status: $row_matches->status }";
  }
  echo "]}";
}

/**
 * Retrieves and outputs the status of the given match, updating it if it crosses a time threshold.
 */
function get_status() {
  global $settings;

  $event = (int)$_GET['event'];
  $match = (int)$_GET['match'];

  $result_events = mysql_query("SELECT last_match, lateness FROM events WHERE event_id = '$event'")
      or die(mysql_error());
  $row_events = mysql_fetch_object($result_events);
  $last_match = $row_events->last_match;
  $lateness = $row_events->lateness;

  $result_matches = mysql_query(
      "SELECT time, status FROM matches
          WHERE event_id = '$event' AND level = $settings->level AND match_number = '$match'")
      or die(mysql_error());
  if (mysql_num_rows($result_matches) == 0) {
    die("Error: Invalid match number.");
  }
  $row_matches = mysql_fetch_object($result_matches);
  $time = $row_matches->time;
  $status = $row_matches->status;

  // Update the status of the match to that of the window the time until the match falls into.
  $time_until_match = $time + $lateness - time();
  $old_status = $status;
  if (($status < 1) && ($time_until_match <= $settings->first_call_delay) &&
      ($time_until_match > $settings->second_call_delay)) {
    $status = 1;
  } else if (($status < 2) && ($time_until_match <= $settings->second_call_delay) &&
      ($time_until_match > $settings->last_call_delay)) {
    $status = 2;
  } else if (($status < 3) && ($time_until_match <= $settings->last_call_delay) &&
      ($time_until_match > $settings->on_deck_delay)) {
    $status = 3;
  } else if (($status < 4) && ($time_until_match <= $settings->on_deck_delay)) {
    $status = 4;
  } else if ($time_until_match <= 0) {
    $status = 5;
  }
  
  if ($status != $old_status) {
    if ($status == 5) {
      // Ensure all preceding matches are set to started if the current one is.
      mysql_query("UPDATE matches SET status = '$status'
                      WHERE event_id = '$event' AND match_number <= '$match' AND
                      level = '$settings->level'") or die(mysql_error());
      
      // Update the last match field of the event.
      mysql_query("UPDATE events SET last_match = '$match' WHERE event_id = '$event'")
          or die(mysql_error());
    } else {
      mysql_query(
          "UPDATE matches SET status = '$status' WHERE
              event_id = '$event' AND match_number = '$match' AND level = '$settings->level'")
          or die(mysql_error());
     }
   }

  echo "{ status: $status, lastMatch: $last_match, lateness: $lateness }";
}

/**
 * Retrieves and outputs the schedule for the whole event for the active level.
 */
function get_schedule()
{
  global $settings;

  $event = (int)$_GET['event'];

  $result_matches = mysql_query(
      "SELECT match_number, time, red1, red2, red3, blue1, blue2, blue3, status FROM matches
          WHERE matches.event_id = '$event' AND level = '$settings->level'
          ORDER BY match_number")
      or die(mysql_error());

  echo "{ matches: [";
  $first = 1;
  while ($row_matches = mysql_fetch_object($result_matches)) {
    if (!$first) {
      echo ",";
    }
    $first = 0;
    echo "{ number: $row_matches->match_number, time: \"$row_matches->time\",
        red1: $row_matches->red1, red2: $row_matches->red2, red3: $row_matches->red3,
        blue1: $row_matches->blue1, blue2: $row_matches->blue2, blue3: $row_matches->blue3,
        status: $row_matches->status }";
  }
  echo "]}";
}

/**
 * Performs an HTTP authentication of the Sundial Control Panel user.
 */
function authenticate() {
  global $settings;

  if (!isset($_SERVER['PHP_AUTH_USER'])) {
    header('WWW-Authenticate: Basic realm="Sundial Control Panel"');
    header('HTTP/1.0 401 Unauthorized');
    die("Error: Invalid login information.");
  } else {
    $admin_username = $_SERVER['PHP_AUTH_USER'];
    $admin_password = $_SERVER['PHP_AUTH_PW'];
    if (!(($admin_username == $settings->admin_username) &&
        (MD5($admin_password) == $settings->admin_password))) {
      header('WWW-Authenticate: Basic realm="Sundial Control Panel"');
      header('HTTP/1.0 401 Unauthorized');
      die("Error: Invalid login information.");
    }
  }
}

/**
 * Retrieves and outputs the global settings.
 */
function admin_global()
{
  global $settings;

  authenticate();

  echo "{ enabled: $settings->enabled, level: $settings->level, firstCallDelay:
      $settings->first_call_delay, secondCallDelay: $settings->second_call_delay, lastCallDelay:
      $settings->last_call_delay, onDeckDelay: $settings->on_deck_delay, refreshInterval:
      $settings->refresh_interval }";
}

/**
 * Updates the global settings in the database with the given values.
 */
function admin_set_global()
{
  global $settings;

  authenticate();

  $enabled = (int)$_GET['enabled'];
  $level = (int)$_GET['level'];
  $first_call_delay = (int)$_GET['first_call_delay'];
  $second_call_delay = (int)$_GET['second_call_delay'];
  $last_call_delay = (int)$_GET['last_call_delay'];
  $on_deck_delay = (int)$_GET['on_deck_delay'];
  $refresh_interval = (int)$_GET['refresh_interval'];

  // If changing from/to practice to/from qualification, reset the lateness and last match played.
  if ($level != $settings->level) {
    mysql_query("UPDATE events SET lateness = 0, last_match = 0 WHERE enabled = 1")
        or die(mysql_error());
  }

  mysql_query("UPDATE settings SET setting_value = '$enabled'
                  WHERE setting_key = 'enabled'") or die(mysql_error());
  mysql_query("UPDATE settings SET setting_value = '$level'
                  WHERE setting_key = 'level'") or die(mysql_error());
  mysql_query("UPDATE settings SET setting_value = '$first_call_delay'
                  WHERE setting_key = 'first_call_delay'") or die(mysql_error());
  mysql_query("UPDATE settings SET setting_value = '$second_call_delay'
                  WHERE setting_key = 'second_call_delay'") or die(mysql_error());
  mysql_query("UPDATE settings SET setting_value = '$last_call_delay'
                  WHERE setting_key = 'last_call_delay'") or die(mysql_error());
  mysql_query("UPDATE settings SET setting_value = '$on_deck_delay'
                  WHERE setting_key = 'on_deck_delay'") or die(mysql_error());
  mysql_query("UPDATE settings SET setting_value = '$refresh_interval'
                  WHERE setting_key = 'refresh_interval'") or die(mysql_error());
  
  echo "{}";
}

/**
 * Changes the password used to access the Sundial Control Panel.
 */
function admin_change_password()
{
  authenticate();
  
  if (isset($_GET['new_password']) && $_GET['new_password'] == $_GET['new_password2']) {
    $new_password = MD5($_GET['new_password']);

    mysql_query("UPDATE settings SET setting_value = '$new_password'
                    WHERE setting_key = 'admin_password'") or die(mysql_error());
    echo "{ message: \"Password changed.\" }";
  } else {
    echo "{ message: \"The passwords do not match.\" }";
  }
}

/**
 * Retrieves and outputs the list of events on the server.
 */
function admin_events()
{
  authenticate();

  $result_events = mysql_query("SELECT * FROM events") or die(mysql_error());

  echo "{ events: [";
  $first = 1;
  while ($row_events = mysql_fetch_object($result_events)) {
    if (!$first) {
      echo ",";
    }
    $first = 0;
    echo "{ id: $row_events->event_id, name: \"$row_events->name\", enabled:
        $row_events->enabled, lastMatch: $row_events->last_match, lateness:
        $row_events->lateness }";
  }
  echo "]}";
}

/**
 * Updates the settings in the database for the given event.
 */
function admin_set_event() {
  authenticate();

  $event = (int)$_GET['event'];

  $name = mysql_real_escape_string($_GET['name']);
  $enabled = mysql_real_escape_string($_GET['enabled']);
  $last_match = mysql_real_escape_string($_GET['last_match']);
  $lateness = mysql_real_escape_string($_GET['lateness']);

  mysql_query("UPDATE events SET name = '$name', enabled = '$enabled', last_match = '$last_match',
                  lateness = '$lateness' WHERE event_id = '$event'") or die(mysql_error());

  echo "{}";
}

/**
 * Creates a new event with default values.
 */
function admin_add_event() {
  authenticate();

  $result_events = mysql_query("INSERT INTO events VALUES (0, 'FRC Event', 0, 0, 0)")
      or die(mysql_error());

  echo "{}";
}

/**
 * Deletes the given event and its associated teams, matches and statistics.
 */
function admin_delete_event() {
  authenticate();

  $event = (int)$_GET['event'];

  mysql_query("DELETE FROM events WHERE event_id = '$event'") or die(mysql_error());
  mysql_query("DELETE FROM teams WHERE event_id = '$event'") or die(mysql_error());
  mysql_query("DELETE FROM matches WHERE event_id = '$event'") or die(mysql_error());
  mysql_query("DELETE FROM statistics WHERE event_id = '$event'") or die(mysql_error());
  
  echo "{}";
}

/**
 * Clears the teams for the given event.
 */
function admin_clear_teams() {
  authenticate();

  $event = (int)$_GET['event'];

  $result_events = mysql_query("DELETE FROM teams WHERE event_id = '$event'") or die(mysql_error());

  echo "{}";
}

/**
 * Clears the matches for the given event and level.
 */
function admin_clear_matches() {
  authenticate();

  $event = (int)$_GET['event'];
  $level = (int)$_GET['level'];

  $result_events = mysql_query("DELETE FROM matches WHERE event_id = '$event' AND level = '$level'")
      or die(mysql_error());

  echo "{}";
}

/**
 * Retrieves and outputs statistics relating to the number teams using Sundial.
 */
function admin_statistics() {
  global $settings;

  authenticate();

  $current_time = time();
  $total_teams = $total_accesses = 0;

  // Retrieve statistics for the teams that are online (i.e. made a request in the past 30 seconds).
  $result_statistics = mysql_query(
      "SELECT * FROM statistics INNER JOIN events ON statistics.event_id = events.event_id
          WHERE events.enabled = 1 AND last_access >= ('$current_time' - 30)
          ORDER BY name, team_number") or die(mysql_error());
  $total_online_teams = mysql_num_rows($result_statistics);

  echo "{ onlineTeams: [";
  $first = 1;
  while ($row_statistics = mysql_fetch_object($result_statistics)) {
    $seconds_online = $row_statistics->accesses * $settings->refresh_interval;
    $time_online = sprintf("%02d", floor($seconds_online / 3600)) . ":" .
        sprintf("%02d", floor($seconds_online % 3600 / 60)) . ":" .
        sprintf("%02d", $seconds_online % 60);
    $total_accesses += $row_statistics->accesses;
    if (!$first) {
      echo ",";
    }
    $first = 0;
    echo "{ team: $row_statistics->team_number, event: \"$row_statistics->name\", timeOnline:
        \"$time_online\" }";
  }

  // Retrieve statistics for the teams that are offline.
  $result_statistics2 = mysql_query(
      "SELECT * FROM statistics INNER JOIN events ON statistics.event_id = events.event_id
          WHERE events.enabled = 1 AND last_access < ('$current_time' - 30)
          ORDER BY name, team_number") or die(mysql_error());
  $total_offline_teams = mysql_num_rows($result_statistics2);

  echo "], offlineTeams: [";
  $first = 1;
  while ($row_statistics2 = mysql_fetch_object($result_statistics2)) {
    $seconds_online2 = $row_statistics2->accesses * $settings->refresh_interval;
    $time_online2 = sprintf("%02d", floor($seconds_online2 / 3600)) . ":" .
        sprintf("%02d", floor($seconds_online2 % 3600 / 60)) . ":" .
        sprintf("%02d", $seconds_online2 % 60);
    $total_accesses += $row_statistics2->accesses;
    if (!$first) {
      echo ",";
    }
    $first = 0;
    echo "{ team: $row_statistics2->team_number, event: \"$row_statistics2->name\",
        timeOnline: \"$time_online2\" }";
  }

  $total_teams = $total_online_teams + $total_offline_teams;
  echo "], totalOnlineTeams: $total_online_teams, totalOfflineTeams: $total_offline_teams,
      totalTeams: $total_teams, totalAccesses: $total_accesses }";
}

/**
 * Clears the statistics for all enabled events.
 */
function admin_clear_statistics()
{
  authenticate();

  mysql_query("DELETE statistics FROM statistics, events
                  WHERE statistics.event_id = events.event_id AND events.enabled = 1")
              or die(mysql_error());
  
  echo "{}";
}
?>
