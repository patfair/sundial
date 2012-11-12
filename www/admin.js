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
 * Displays the Sundial Control Panel user interface, making AJAX calls to the PHP backend to
 * retrieve and store data.
 */

// Namespace for global variables.
function Globals() {
  // The number of milliseconds between server fetches.
  this.refreshInterval;
  
  // The number to multiply nominal sizes by to get the size for the current browser window.
  this.sizeRatio;
  
  // The tab that is currently displayed.
  this.currentTab = 0;
  
  // The timer object for server fetches.
  this.refreshTimer
  
  // The timer object for the countdown clock.
  this.clockTimer;
}
var globals = new Globals();

/**
 * Initializes the Sundial Control Panel. Called from the HTML body's onLoad event.
 */
function initialize() {
  // Retrieve parameters from the HTML document including this file.
  globals.refreshInterval = document.parameters.refresh_interval.value * 1000;
  
  resize();
  showGlobal();
}

/**
 * Affixes a leading zero if necessary to return a two-digit number.
 */
function lz (input) {
  return (input > 9) ? String(input) : "0" + input;
}

/**
 * Performs an AJAX call to the given path, evaluates the returned JSON and invokes the callback.
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
      // Convert the returned JSON to a JavaScript object. No validation is done since the source
      // (the Sundial server) is trusted.
      var response = eval("(" + this.responseText + ")");
      callback(response);
    }
  }
  xmlHttp.open("GET", path, true);
  xmlHttp.send(null);
}

/**
 * Clears the previous server fetch timer and replaces it with the new one.
 */
function registerServerUpdate(updateFunction) {
  clearInterval(globals.refreshTimer);
  if (updateFunction != null) {
    serverUpdate = function() {
      updateFunction();  
    }

    clearInterval(globals.refreshTimer);
    globals.refreshTimer = setInterval(serverUpdate, globals.refreshInterval);

    // Call the update function right away since setInterval will only start calling it after one
    // interval has passed.
    serverUpdate();
  }
}

/**
 * Performs operations to be carried out upon switching to a new tab.
 */
function initTab() {
  globals.currentTab = 0;
  clearInterval(globals.clockTimer);

  document.getElementById("content").style.display = "none";
  
  document.getElementById("global-button").style.color = "#000000";
  document.getElementById("events-button").style.color = "#000000";
  document.getElementById("statistics-button").style.color = "#000000";
  document.getElementById("about-button").style.color = "#000000";
}

/**
 * Makes the tab data visible once the tab has loaded.
 */
function showTab() {
  document.getElementById("content").style.display = "block";
}

/**
 * Displays the countdown and information for the team's next match.
 */
function showGlobal() {
  initTab();
  document.getElementById("global-button").style.color = "#999999";
  document.title = "Sundial Control Panel | Global Settings";
  document.getElementById("pagename").innerHTML = "Global Settings";

  var content =
      "<div id='global-container' align='center'>\
         <table id='global-table'>\
           <tr>\
             <td class='global-subheading'>Sundial enable</td>\
             <td>\
               <input type='radio' name='sundial-enable' id='sundial-enable-on' value='1' />On\
             </td>\
             <td>\
               <input type='radio' name='sundial-enable' id='sundial-enable-off' value='0' />Off\
             </td>\
           </tr>\
           <tr>\
             <td class='global-subheading'>Match level</td>\
             <td>\
               <input type='radio' name='match-level' id='match-level-pract' value='1' />Practice\
             </td>\
             <td>\
               <input type='radio' name='match-level' id='match-level-qual' value='0' />\
               Qualification\
             </td>\
           </tr>\
         </table>\
         <br />\
         <table id='global-settings-table' width='80%'>\
           <tr>\
             <td>First Call Delay (s)</td>\
             <td>Second Call Delay (s)</td>\
             <td>Last Call Delay (s)</td>\
             <td>On Deck Delay (s)</td>\
           </tr>\
           <tr>\
             <td><input id='first-call-delay' type='text' /></td>\
             <td><input id='second-call-delay' type='text' /></td>\
             <td><input id='last-call-delay' type='text' /></td>\
             <td><input id='on-deck-delay' type='text' /></td>\
           </tr>\
           <tr>\
             <td>Refresh Interval (s)</td>\
             <td>&nbsp;</td>\
             <td>&nbsp;</td>\
             <td>&nbsp;</td>\
           </tr>\
           <tr>\
             <td><input id='refresh-interval' type='text' /></td>\
           </tr>\
         </table>\
         <br />\
         <input id='global-save-button' type='button' value='Save' onClick='saveGlobal()' />\
       </div>\
       <div id='change-password-div' align='center'>Change Password\
         <table id='change-password-table' width='50%' style='font-family: Verdana;'>\
           <tr>\
             <td>New Password</td>\
             <td>Retype New Password</td>\
             <td></td>\
           </tr>\
           <tr>\
             <td><input id='newpass' type='password' /></td>\
             <td><input id='newpass2' type='password' /></td>\
             <td>\
               <input id='change-password-button' type='button' value='Change Password'\
                   onClick='changePassword()' />\
             </td>\
           </tr>\
         </table>\
       </div>";
  document.getElementById("content").innerHTML = content;

  registerServerUpdate(null);

  var globalCallback = function(response) {
    if (response.enabled == 1) {
      document.getElementById("sundial-enable-on").checked = true;
    } else {
      document.getElementById("sundial-enable-off").checked = true;
    }

    if (response.level == 0) {
      document.getElementById("match-level-pract").checked = true;
    } else {
      document.getElementById("match-level-qual").checked = true;
    }

    document.getElementById("first-call-delay").value = response.firstCallDelay;
    document.getElementById("second-call-delay").value = response.secondCallDelay;
    document.getElementById("last-call-delay").value = response.lastCallDelay;
    document.getElementById("on-deck-delay").value = response.onDeckDelay;
    document.getElementById("refresh-interval").value = response.refreshInterval;

    globals.currentTab = 1;
    resizeGlobal();
  }
  doXmlHttp("action.php?action=admin_global", globalCallback);
}

/**
 * Send the updated global settings to the server to be saved.
 */
function saveGlobal() {
  var enabled = 0;
  if (document.getElementById("sundial-enable-on").checked) {
    enabled = 1;
  }

  var matchLevel = 0;
  if (document.getElementById("match-level-qual").checked) {
    matchLevel = 1;
  }

  var setGlobalCallback = function(response) {
    alert("Settings saved.");
    showGlobal();
  }
  doXmlHttp("action.php?action=admin_set_global&enabled=" + enabled + "&level=" + matchLevel +
                "&first_call_delay=" + document.getElementById("first-call-delay").value +
                "&second_call_delay=" + document.getElementById("second-call-delay").value +
                "&last_call_delay=" + document.getElementById("last-call-delay").value +
                "&on_deck_delay=" + document.getElementById("on-deck-delay").value +
                "&refresh_interval=" + document.getElementById("refresh-interval").value,
            setGlobalCallback);
}

/**
 * Changes the password used to get into the control panel.
 */
function changePassword() {
  var changePasswordCallback = function(response) {
    alert(response.message);
    document.getElementById("newpass").value = "";
    document.getElementById("newpass2").value = "";
  }
  doXmlHttp("action.php?action=admin_change_password&new_password=" +
                document.getElementById("newpass").value + "&new_password2=" +
                document.getElementById("newpass2").value,
            changePasswordCallback);
}

/**
 * Displays the list of events on the server.
 */
function showEvents() {
  initTab();
  document.getElementById("events-button").style.color = "#999999";
  document.title = "Sundial Control Panel | Events";
  document.getElementById("pagename").innerHTML = "Events";

  var content =
      "<table id='events-title'>\
         <tr>\
           <td class='event-name-title'>Event</td>\
           <td class='event-id-title'>Event ID</td>\
           <td class='event-enabled-title'>Enabled</td>\
           <td class='event-last-match-title'>Last Match</td>\
           <td class='event-lateness-title'>Lateness (s)</td>\
           <td class='event-upload-title'>Upload Data</td>\
           <td class='event-clear-title'>Clear</td>\
           <td class='event-operations-title'>&nbsp;</td>\
         </tr>\
       </table>\
       <div id='events-scroll'></div>\
       <br />\
       <div align='center' style='width: 100%;'>\
         <input id='create-event-button' type='button' value='Create Event' onClick='addEvent()' />\
       </div>";
  document.getElementById("content").innerHTML = content;

  registerServerUpdate(null);

  var eventsCallback = function(response) {
    var events = response.events;
    var eventsScroll = "<table id='events-table' cellspacing='0'>";
    for (var i = 0; i < events.length; i++) {
      var rowColour = (i % 2) ? "#FFFFFF" : "#DDEEFF";

      var enabledChecked;
      if (events[i].enabled == 1)
        enabledChecked = " checked";
      else
        enabledChecked = "";

      eventsScroll +=
          "<tr style='background-color: " + rowColour + ";'>\
             <td class='event-name'>\
               <input id='name-" + events[i].id + "' type='text' value='" + events[i].name + "' />\
             </td>\
             <td class='event-id'>" + events[i].id + "</td>\
             <td class='event-enabled'>\
               <input id='enabled-" + events[i].id + "' type='checkbox'" + enabledChecked + " />\
             </td>\
             <td class='event-last-match'>\
               <input id='last-match-" + events[i].id + "' size='4' type='text' value='" +
                   events[i].lastMatch + "' />\
             </td>\
             <td class='event-lateness'>\
               <input id='lateness-" + events[i].id + "' size='4' type='text' value='" +
                   events[i].lateness + "' />\
             </td>\
             <td class='event-upload'>\
               <a href='csv.php?event=" + events[i].id + "' target='_blank'>Upload Data</a>\
             </td>\
             <td class='event-clear'>\
               <input type='button' value='Teams' onClick='clearTeams(" + events[i].id + ")' />\
               <br />\
               <input type='button' value='Practice Matches'\
                   onClick='clearMatches(" + events[i].id + ", 0)' />\
               <br />\
               <input type='button' value='Qualification Matches'\
                   onClick='clearMatches(" + events[i].id + ", 1)' />\
             </td>\
             <td class='event-operations'>\
               <input type='button' value='Save' onClick='saveEvent(" + events[i].id + ")' />\
               <br />\
               <input type='button' value='Delete' onClick='deleteEvent(" + events[i].id + ")' />\
             </td>\
           </tr>";
    }
    eventsScroll += "</table>";

    document.getElementById("events-scroll").innerHTML = eventsScroll;
    globals.currentTab = 2;
    resizeEvents();
  }
  doXmlHttp("action.php?action=admin_events", eventsCallback);
}

/**
 * Saves changes to the given event to the server.
 */
function saveEvent(event) {
  var enabled = 0;
  if (document.getElementById("enabled-" + event).checked) {
    enabled = 1;
  }
  
  var saveEventCallback = function(response) {
    alert("Changes saved.");
    showEvents();
  }
  doXmlHttp("action.php?action=admin_set_event&event=" + event +
                "&name=" + document.getElementById("name-" + event).value +
                "&enabled=" + enabled +
                "&last_match=" + document.getElementById("last-match-" + event).value +
                "&lateness=" + document.getElementById("lateness-" + event).value,
            saveEventCallback);
}

/**
 * Clears the teams for the given event on the server.
 */
function clearTeams(event) {
  var clearTeamsCallback = function(response) {
    showEvents();
  }
  doXmlHttp("action.php?action=admin_clear_teams&event=" + event, clearTeamsCallback);
}

/**
 * Clears the matches for the given event and level on the server.
 */
function clearMatches(event, level) {
  var clearMatchesCallback = function(response) {
    showEvents();
  }
  doXmlHttp("action.php?action=admin_clear_matches&event=" + event + "&level=" + level,
            clearMatchesCallback);
}

/**
 * Deletes the given event on the server.
 */
function deleteEvent(event) {
  var deleteEventCallback = function(response) {
    showEvents();
  }
  doXmlHttp("action.php?action=admin_delete_event&event=" + event, deleteEventCallback);
}

/**
 * Creates a new event on the server with default values.
 */
function addEvent() {
  var addEventCallback = function(response) {
    showEvents();
  }
  doXmlHttp("action.php?action=admin_add_event", addEventCallback);
}

/**
 * Displays statistics relating to the number of teams using Sundial.
 */
function showStatistics() {
  initTab();
  document.getElementById("statistics-button").style.color = "#999999";
  document.title = "Sundial Control Panel | Statistics";
  document.getElementById("pagename").innerHTML = "Statistics";

  var content =
      "<table width='100%'>\
         <tr>\
           <td id='online-title'>Online Teams\
             <table id='online-teams-title'>\
               <tr>\
                 <td class='statistics-event-title'>Event</td>\
                 <td class='statistics-team-title'>Team #</td>\
                 <td class='statistics-time-online-title'>Time Online</td>\
               </tr>\
             </table>\
             <div id='online-teams-scroll'></div>\
             </div>\
             <table id='total-table-left' width='100%'>\
               <tr>\
                 <td width='50%'>Total Online Teams:</td>\
                 <td id='total-online-teams' width='50%'></td>\
               </tr>\
               <tr>\
                 <td width='50%'>Total Teams:</td>\
                 <td id='total-teams' width='50%'></td>\
               </tr>\
             </table>\
           </td>\
           <td id='offline-title'>Offline Teams\
             <table id='offline-teams-title'>\
               <tr>\
                 <td class='statistics-event-title'>Event</td>\
                 <td class='statistics-team-title'>Team #</td>\
                 <td class='statistics-time-online-title'>Time Online</td>\
               </tr>\
             </table>\
             <div id='offline-teams-scroll'></div>\
             </div>\
             <table id='total-table-right' width='100%'>\
               <tr>\
                 <td width='50%'>Total Offline Teams:</td>\
                 <td id='total-offline-teams' width='50%'></td>\
               </tr>\
               <tr>\
                 <td width='50%'>Total Accesses:</td>\
                 <td id='total-accesses' width='50%'></td>\
               </tr>\
             </table>\
           </td>\
         </tr>\
       </table>\
       <div align='center' style='width: 100%;'>\
         <input id='clear-statistics-button' type='button' value='Clear Statistics'\
             onClick='clearStatistics()' />\
       </div>";
  document.getElementById("content").innerHTML = content;


  registerServerUpdate(getStatistics);

  function getStatistics() {
    var statisticsCallback = function(response) {
      var onlineTeams = response.onlineTeams;
      var onlineTeamsScroll = "<table id='online-teams-table' cellspacing='0'>";
      for (var i = 0; i < onlineTeams.length; i++) {
        onlineTeamsScroll +=
            "<tr>\
               <td class='statistics-event'>" + onlineTeams[i].event + "</td>\
               <td class='statistics-team'>" + onlineTeams[i].team + "</td>\
               <td class='statistics-time-online'>" + onlineTeams[i].timeOnline + "</td>\
             </tr>";
      }
      onlineTeamsScroll += "</table>";
      document.getElementById("online-teams-scroll").innerHTML = onlineTeamsScroll;

      var offlineTeams = response.offlineTeams;
      var offlineTeamsScroll = "<table id='offline-teams-table' cellspacing='0'>";
      for (var i = 0; i < offlineTeams.length; i++) {
        offlineTeamsScroll +=
            "<tr>\
               <td class='statistics-event'>" + offlineTeams[i].event + "</td>\
               <td class='statistics-team'>" + offlineTeams[i].team + "</td>\
               <td class='statistics-time-online'>" + offlineTeams[i].timeOnline + "</td>\
             </tr>";
      }
      offlineTeamsScroll += "</table>";
      document.getElementById("offline-teams-scroll").innerHTML = offlineTeamsScroll;

      document.getElementById("total-online-teams").innerHTML = response.totalOnlineTeams;
      document.getElementById("total-offline-teams").innerHTML = response.totalOfflineTeams;
      document.getElementById("total-teams").innerHTML = response.totalTeams;
      document.getElementById("total-accesses").innerHTML = response.totalAccesses;

      globals.currentTab = 3;
      resizeStatistics();
    }
    doXmlHttp("action.php?action=admin_statistics", statisticsCallback);
  }
}

/**
 * Clears the statistics on the server.
 */
function clearStatistics() {
  var clearStatisticsCallback = function(response) {
    showStatistics();
  }
  doXmlHttp("action.php?action=admin_clear_statistics", clearStatisticsCallback);
}

/**
 * Displays information about the Sundial Control Panel.
 */
function showAbout() {
  initTab();
  document.getElementById("about-button").style.color = "#999999";
  document.title = "Sundial Control Panel | About";
  document.getElementById("pagename").innerHTML = "About Sundial Control Panel";
  
  var content =
      "<div style='width: 100%; height: 98%;'>\
         <div id='about-logo'>sundial <span style='font-size: 35%'>v4.2</span></div>\
         <div id='about-cpl'>CONTROL PANEL</div>\
         <div id='about-info'>\
           Copyright &copy; 2004 - 2008 Patrick Fairbank.<br />\
           All rights reserved.<br /><br />\
           Questions and comments welcome at <br />\
           sundial [at] patfair [dot] net.\
         </div>\
       </div>";
  document.getElementById("content").innerHTML = content;
  
  registerServerUpdate(null);

  globals.currentTab = 4;
  resizeAbout();
}

/**
 * Changes the size of all elements to match the size of the browser window.
 */
function resize() {
  document.body.style.margin = 0.01 * document.body.clientHeight;
  sizeRatio = 0.97 * document.body.clientHeight / 600;
  document.getElementById("bgtop").style.width = 800 * sizeRatio;
  document.getElementById("bgmid").style.width = 800 * sizeRatio;
  document.getElementById("bgmid").style.height = 540 * sizeRatio;
  document.getElementById("bgbot").style.width = 800 * sizeRatio;
  document.getElementById("first-logo").style.width = 80 * sizeRatio;
  document.getElementById("first-logo").style.top = -20 * sizeRatio;
  document.getElementById("first-logo").style.left = 10 * sizeRatio;
  document.getElementById("page-title").style.top = -20 * sizeRatio;
  document.getElementById("page-title").style.fontSize = 20 * sizeRatio;
  document.getElementById("content").style.width = 750 * sizeRatio;
  document.getElementById("content").style.height = 470 * sizeRatio;
  document.getElementById("content").style.top = -10 * sizeRatio;
  document.getElementById("content").style.left = 25 * sizeRatio;
  document.getElementById("links").style.bottom = -25 * sizeRatio;
  document.getElementById("links").style.fontSize = 15 * sizeRatio;
  document.getElementById("sundial").style.bottom = -25 * sizeRatio;
  document.getElementById("sundial").style.right = 25 * sizeRatio;
  document.getElementById("sundial").style.fontSize = 35 * sizeRatio;
  document.getElementById("control-panel").style.bottom = -27 * sizeRatio;
  document.getElementById("control-panel").style.right = 30 * sizeRatio;
  document.getElementById("control-panel").style.fontSize = 8 * sizeRatio;

  switch (globals.currentTab) {
    case 1: {
      resizeGlobal();
      break;
    }
    case 2: {
      resizeEvents();
      break;
    }
    case 3: {
      resizeStatistics();
      break;
    }
    case 4: {
      resizeAbout();
      break;
    }
    default:
  }
}
window.onresize = resize;

/**
 * Resizes the Global tab elements to match the browser window size.
 */
function resizeGlobal() {
  document.getElementById("global-container").style.top = 100 * sizeRatio;
  document.getElementById("global-table").style.fontSize = 12 * sizeRatio;
  document.getElementById("global-settings-table").style.fontSize = 10 * sizeRatio;
  document.getElementById("first-call-delay").style.fontSize = 10 * sizeRatio;
  document.getElementById("second-call-delay").style.fontSize = 10 * sizeRatio;
  document.getElementById("last-call-delay").style.fontSize = 10 * sizeRatio;
  document.getElementById("on-deck-delay").style.fontSize = 10 * sizeRatio;
  document.getElementById("refresh-interval").style.fontSize = 10 * sizeRatio;
  document.getElementById("global-save-button").style.fontSize = 10 * sizeRatio;
  document.getElementById("change-password-div").style.top = 350 * sizeRatio;
  document.getElementById("change-password-div").style.fontSize = 13 * sizeRatio;
  document.getElementById("change-password-table").style.fontSize = 10 * sizeRatio;
  document.getElementById("newpass").style.fontSize = 10 * sizeRatio;
  document.getElementById("newpass2").style.fontSize = 10 * sizeRatio;
  document.getElementById("change-password-button").style.fontSize = 10 * sizeRatio;
  showTab();
}

/**
 * Resizes the Events tab elements to match the browser window size.
 */
function resizeEvents() {
  document.getElementById("events-title").style.fontSize = 9 * sizeRatio;
  document.getElementById("events-scroll").style.height = 420 * sizeRatio;
  document.getElementById("events-table").style.fontSize = 10 * sizeRatio;
  document.getElementById("create-event-button").style.fontSize = 10 * sizeRatio;
  showTab();
}

/**
 * Resizes the Statistics tab elements to match the browser window size.
 */
function resizeStatistics() {
  document.getElementById("online-title").style.fontSize = 13 * sizeRatio;
  document.getElementById("online-teams-title").style.fontSize = 9 * sizeRatio;
  document.getElementById("online-teams-scroll").style.height = 385 * sizeRatio;
  document.getElementById("online-teams-table").style.fontSize = 10 * sizeRatio;
  document.getElementById("offline-title").style.fontSize = 13 * sizeRatio;
  document.getElementById("offline-teams-title").style.fontSize = 9 * sizeRatio;
  document.getElementById("offline-teams-scroll").style.height = 385 * sizeRatio;
  document.getElementById("offline-teams-table").style.fontSize = 10 * sizeRatio;
  document.getElementById("total-table-left").style.fontSize = 11 * sizeRatio;
  document.getElementById("total-table-right").style.fontSize = 11 * sizeRatio;
  document.getElementById("clear-statistics-button").style.fontSize = 10 * sizeRatio;
  showTab();
}

/**
 * Resizes the About tab elements to match the browser window size.
 */
function resizeAbout() {
  document.getElementById("about-logo").style.fontSize = 70 * sizeRatio;
  document.getElementById("about-logo").style.top = 80 * sizeRatio;
  document.getElementById("about-logo").style.left = 70 * sizeRatio;
  document.getElementById("about-cpl").style.fontSize = 15 * sizeRatio;
  document.getElementById("about-cpl").style.top = 150 * sizeRatio;
  document.getElementById("about-cpl").style.left = 215 * sizeRatio;
  document.getElementById("about-info").style.fontSize = 10 * sizeRatio;
  document.getElementById("about-info").style.top = 80 * sizeRatio;
  document.getElementById("about-info").style.left = 340 * sizeRatio;
  showTab();
}
