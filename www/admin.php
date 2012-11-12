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
 * Displays the HTML base for the Sundial Control Panel user interface.
 */

require('include.php');

// Perform HTTP authentication of the user.
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
?>
<html>
  <head>
    <title>Sundial Control Panel</title>
    <link rel='stylesheet' type='text/css' href='static/admin.css' />
    <script type='text/javascript' src='admin.js'></script>
  </head>
  <body style='background-color: #336699;' onLoad='initialize()'>
    <form name='parameters'>
      <input type='hidden' name='refresh_interval'
          value='<? echo($settings->refresh_interval); ?>' />
    </form>
    <div align='center'>
      <img id='bgtop' src='static/bgtop.jpg'><br />
      <div id='bgmid' style='position: relative; width: 800px; height: 540px; background-color:
          white; text-align: left;'>
        <img id='first-logo' src='static/firstlogo.jpg' style='position: relative;'>
        <div id='page-title' style='position: absolute; left: 0px; width: 100%; text-align: center;
            font-family: Arial Black;'>
          <span id='eventname'></span>
          <br />
          <span id='pagename'></span>
        </div>
        <div id='content' style='position: relative; background-color: #FFFFFF; display: none;'>
          &nbsp;
        </div>
        <div id='links' align='center' style='position: absolute; width: 100%; text-align: center;
            font-family: Arial;'>
          <div style='width: 7%; float: left;'>&nbsp;</div>
          <div id='global-button' class='link' onClick='showGlobal()'>global</div>
          <div id='events-button' class='link' onClick='showEvents()'>events</div>
          <div id='statistics-button' class='link' onClick='showStatistics()'>statistics</div>
          <div id='about-button' class='link' onClick='showAbout()'>about</div>
        </div>
        <div id='sundial' style='position: absolute; color: #CCCCCC; font-family: Arial;'>
          sundial <span style='font-size: 35%'>v4.2</span>
        </div>
        <div id='control-panel' style='position: absolute; color: #FF9999; font-family: Arial;
            font-weight: bold;'>
          CONTROL PANEL
        </div>
      </div>
      <img id='bgbot' src='static/bgbot.jpg'>
    </div>
  </body>
</html>
