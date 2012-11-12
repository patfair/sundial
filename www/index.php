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
 * Displays the Sundial login page.
 */

require('include.php');
?>
<html>
  <head>
    <title>Sundial | Login Page</title>
    <script type='text/javascript'>
      /**
        * Performs an AJAX call to the given path, evaluates the returned JSON and invokes the
        * callback.
        */
      function doXmlHttp(path, callback) {
        var xmlHttp = null;
        if (window.XMLHttpRequest) {
          xmlHttp = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
          xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        if (xmlHttp == null)
          alert("Sorry, your browser does not support Sundial.");
      
        xmlHttp.onreadystatechange = function () {
          if ((this.readyState == 4) || (this.readyState == "complete")) {
            // Convert the returned JSON to a JavaScript object. No validation is done since the
            // source (the Sundial server) is trusted.
            var response = eval("(" + this.responseText + ")");
            callback(response);
          }
        }
        xmlHttp.open("GET", path, true);
        xmlHttp.send(null);
      }

      /**
        * Retrievies the list of active events from the server.
        */
      function loadEvents() {
        var eventsCallback = function (response) {
          var events = response.events;
          var eventList = document.getElementById("event-list");
          eventList.options.length = events.length + 1;
          for (var i = 0; i < events.length; i++) {
            eventList.options[i+1].value = events[i].id;
            eventList.options[i+1].innerHTML = events[i].name;
          }
        }
        doXmlHttp("action.php?action=events", eventsCallback);
      }

      /**
        * Retrievies the list of teams participating in the selected event.
        */
      function loadTeams() {
        var eventList = document.getElementById("event-list");
        var teamList = document.getElementById("team-list");
        teamList.innerHTML = "";
        teamList.disabled = true;
        if (eventList.value != 0) {
          teamList.options.length = 1;
          teamList.options[0].value = 0;
          teamList.options[0].innerHTML = "Loading...";
          
          var teamsCallback = function (response) {
            teamList.options[0].value = 0;
            teamList.options[0].innerHTML = "Select a team...";
            var teams = response.teams;
            teamList.options.length = teams.length + 1;
            for (var i = 0; i < teams.length; i++) {
              teamList.options[i+1].value = teams[i];
              teamList.options[i+1].innerHTML = teams[i];
            }
            teamList.disabled = false;
          }
          doXmlHttp("action.php?action=teams&event=" + eventList.value, teamsCallback);
        }
      }
      
      /**
        * Redirects to the main Sundial page once the event and team have been selected.
        */
      function loadSundial() {
        if ((document.getElementById("event-list").value != 0) &&
            (document.getElementById("team-list").value != 0)) {
          location.href = "sundial.php?event=" + document.getElementById("event-list").value +
              "&team=" + document.getElementById("team-list").value;
        }
      }
    </script>
  </head>
  <body onLoad='loadEvents()' style='background-color: #336699;'>
    <div align='center' style='width: 100%;'>&nbsp;
      <div style='position: relative; top: 100px; width: 250px; padding: 5px; background-color:
          white; border: solid 3px #666666;'>
        <div id='sundial' style='color: #CCCCCC; font-size: 50px; font-family: Arial;'>
          sundial <span style='font-size: 35%'>v4.2</span>
        </div>
        <br />
        <noscript>
          <div style='font-size: 15px; font-family: Verdana; text-align: center; color: #FF0000;'>
            Sundial requires Javascript support.<br /><br />Please enable Javascript.<br /><br />
          </div>
        </noscript>
        <? if ($settings->enabled == 1) { ?>
          <form>
            <select id='event-list' onChange="loadTeams()" style='width: 200px;'>
              <option value='0'>Select an event...</option>
            </select>
            <br /><br />
            <select id='team-list' style='width: 200px;' disabled></select>
            <br /><br />
            <input type='button' value='Go' style='width: 50px;' onClick="loadSundial()">
          </form>
        <? } else { ?>
          <p>Sundial is temporarily disabled for maintenance. Please check back soon.</p><br />
        <? } ?>
      </div>
    </div>
    <div style='position: absolute; bottom: 2px; right: 2px; color: #FFFFFF; font-family: Arial;
        font-size: 15px;'onMouseOver="this.style.cursor='pointer'"
        onMouseOut="this.style.cursor='default'" onClick="location.href='admin.php'">
      control panel
    </div>
  </body>
</html>
