Sundial
=======

## Overview

Sundial is a system for displaying match information at a FIRST Robotics Competition event to teams. It runs
Apache, PHP and MySQL in the backend, and JavaScript and HTML in the frontend. Only a web browser is needed to
use Sundial.

This version of Sundial has two modes: one which shows information about the upcoming match and the playing
field, and one which shows the full schedule with the using team's matches highlighted. This version does not
show match result or standings information since there is no reliable way to obtain this data.

Note: I wrote the bulk of this as a clueless high school student in 2006 and some is even older than that, so
please don't hold quality of the code against me. :)

## Setup

1. Install Apache, PHP and MySQL and verify that they work (for a package which makes this easy, search the
internet for "XAMPP").

2. Copy the contents of the www directory into the directory Apache serves from.

3. Edit config.php to specify the MySQL username, password and desired database name for Sundial. The user
account needs to exist, so create it first if it does not.

4. Navigate to http://localhost/setup.php in a web browser to run the setup script.

Sundial can now be found at http://localhost. The link to the control panel is at the bottom-right corner of
the login page; the username is "sundialadmin" and the password is "12345".

Data entry of the team list and of the practice and qualification schedules is achieved by uploading CSV
(comma-separated values) files to the server. CSV files can be generated either by hand or with Microsoft
Excel or other spreadsheet programs. Two files, sample-teams.csv and sample-schedule.csv, are provided to
illustrate the required format.
