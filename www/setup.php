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
 * Creates the Sundial MySQL database and its tables. Called manually upon installation.
 */

require('config.php');

// Open a connection to the MySQL database.
mysql_connect($db_hostname, $db_username, $db_password) or die(mysql_error());

// Don't die on failure since it's very possible the database doesn't yet exist.
mysql_query("DROP DATABASE `$db_database`");

mysql_query("CREATE DATABASE `$db_database` DEFAULT CHARACTER SET latin1 COLLATE
                latin1_swedish_ci;") or die(mysql_error());

mysql_select_db($db_database);

// Create the table for storing all event data.
mysql_query("
    CREATE TABLE `events` (
      `event_id` int(6) NOT NULL auto_increment,
      `name` varchar(100) NOT NULL,
      `enabled` tinyint(1) NOT NULL,
      `last_match` smallint(11) NOT NULL,
      `lateness` int(11) NOT NULL,
      PRIMARY KEY  (`event_id`),
      KEY `event_name` (`name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1") or die(mysql_error());

// Create the table for storing all match data.
mysql_query("    
    CREATE TABLE `matches` (
      `event_id` int(6) NOT NULL,
      `match_number` smallint(6) NOT NULL,
      `level` tinyint(4) NOT NULL,
      `time` varchar(10) NOT NULL,
      `red1` smallint(6) NOT NULL,
      `red2` smallint(6) NOT NULL,
      `red3` smallint(6) NOT NULL,
      `blue1` smallint(6) NOT NULL,
      `blue2` smallint(6) NOT NULL,
      `blue3` smallint(6) NOT NULL,
      `status` tinyint(4) NOT NULL,
      PRIMARY KEY  (`event_id`,`level`,`match_number`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1") or die(mysql_error());

// Create the table for storing all settings.
mysql_query("
    CREATE TABLE `settings` (
      `setting_key` varchar(50) NOT NULL,
      `setting_value` varchar(50) NOT NULL,
      PRIMARY KEY  (`setting_key`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1") or die(mysql_error());

// Populate the settings table with the default values.
mysql_query("INSERT INTO `settings` VALUES ('admin_password', '827ccb0eea8a706c4c34a16891f84e7b')")
     or die(mysql_error());
mysql_query("INSERT INTO `settings` VALUES ('admin_username', 'sundialadmin')")
     or die(mysql_error());
mysql_query("INSERT INTO `settings` VALUES ('enabled', '0')") or die(mysql_error());
mysql_query("INSERT INTO `settings` VALUES ('first_call_delay', '1200')") or die(mysql_error());
mysql_query("INSERT INTO `settings` VALUES ('last_call_delay', '600')") or die(mysql_error());
mysql_query("INSERT INTO `settings` VALUES ('level', '0')") or die(mysql_error());
mysql_query("INSERT INTO `settings` VALUES ('on_deck_delay', '300')") or die(mysql_error());
mysql_query("INSERT INTO `settings` VALUES ('refresh_interval', '15')") or die(mysql_error());
mysql_query("INSERT INTO `settings` VALUES ('second_call_delay', '900')") or die(mysql_error());

// Create the table for storing all statistical data.
mysql_query("    
    CREATE TABLE `statistics` (
      `event_id` int(6) NOT NULL,
      `team_number` smallint(6) NOT NULL,
      `accesses` mediumint(11) NOT NULL,
      `last_access` varchar(10) NOT NULL,
      PRIMARY KEY  (`event_id`,`team_number`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1") or die(mysql_error());

// Create the table for storing all team data.
mysql_query("
    CREATE TABLE `teams` (
      `event_id` int(6) NOT NULL,
      `team_number` smallint(6) NOT NULL,
      PRIMARY KEY  (`event_id`,`team_number`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1") or die(mysql_error());
?>
Sundial setup successful. Click <a href="./">here</a> to go to Sundial.
