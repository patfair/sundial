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
 * Displays the HTML base for the Sundial user interface.
 */

require('include.php');
?>
<html>
  <head>
    <title>Sundial</title>
    <link rel='stylesheet' type='text/css' href='static/sundial.css' />
    <script type='text/javascript' src='sundial.js'>
    </script>
  </head>
  <body style='background-color: #336699;' onLoad='initialize()'>
    <form name='parameters'>
      <input type='hidden' name='event' value='<? echo($_GET['event']); ?>' />
      <input type='hidden' name='team' value='<? echo($_GET['team']); ?>' />
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
        <div id='connection-status' style='position: absolute; font-family: Arial; font-weight:
            bold; color: #666666;'>
          Network status:&nbsp;&nbsp;&nbsp;<span id='connectionstatus'></span>
        </div>
        <div id='links' align='center' style='position: absolute; width: 100%; text-align: center;
            font-family: Arial;'>
          <div style='width: 7%; float: left;'>&nbsp;</div>
          <div id='countdown-button' class='link' onClick='showCountdown()'>countdown</div>
          <div id='schedule-button' class='link' onClick='showSchedule()'>schedule</div>
          <div id='about-button' class='link' onClick='showAbout()'>about</div>
        </div>
        <div id='sundial' style='position: absolute; color: #CCCCCC; font-family: Arial;'>
          sundial <span style='font-size: 35%'>v4.2</span>
        </div>
      </div>
      <img id='bgbot' src='static/bgbot.jpg'>
    </div>
  </body>
</html>
