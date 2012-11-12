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
 * Displays the Sundial user interface, making AJAX calls to the PHP backend to retrieve data.
 */

// Namespace for global variables.
function Globals() {
  // The base64-encoded key to the event.
  this.event;
  
  // The user's team number
  this.team;
  
  // The number of milliseconds between server fetches.
  this.refreshInterval;
  
  // The number to multiply nominal sizes by to get the size for the current browser window.
  this.sizeRatio;
  
  // The tab that is currently displayed.
  this.currentTab = 0;
  
  // The array of team-specific matches.
  this.matchlist;
  
  // The index of the current match in the match list array.
  this.matchIndex = 0;
  
  // The number of seconds by which the playing field is behind.
  this.lateness = 0;
  
  // The count of sequential failed server fetches.
  this.disconnectCount = 0;
  
  // The timer object for server fetches.
  this.refreshTimer
  
  // The timer object for the countdown clock.
  this.clockTimer;
  
  // The array of status codes for the Schedule tab.
  this.scheduleStatusArray =
    new Array("Scheduled", "First Call", "Second Call", "Last Call", "On Deck", "Started");
  
  // The array of status codes for the Countdown tab.
  this.countdownStatusArray =
    new Array("&nbsp;", "FIRST CALL", "SECOND CALL", "LAST CALL", "ON DECK", "&nbsp;");
  
  // The array of winner codes for the Results tab.
  this.winnerArray = new Array("Red", "Tie", "Blue");
}
var globals = new Globals();

/**
 * Initializes Sundial. Called from the HTML body's onLoad event.
 */
function initialize() {
  // Retrieve parameters from the HTML document including this file.
  globals.event = document.parameters.event.value;
  globals.team = document.parameters.team.value;
  globals.refreshInterval = document.parameters.refresh_interval.value * 1000;

  resize();
  getCustomizedSchedule();
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
      globals.disconnectCount = 0;
      document.getElementById("connectionstatus").innerHTML = "CONNECTED";
      document.getElementById("connectionstatus").style.color = "#00CC33";

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
      globals.disconnectCount++;
      if (globals.disconnectCount >= 3) {
        document.getElementById("connectionstatus").innerHTML = "NOT CONNECTED";
        document.getElementById("connectionstatus").style.color = "#FF0000";
      }
  
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
  
  document.getElementById("countdown-button").style.color = "#000000";
  document.getElementById("schedule-button").style.color = "#000000";
  document.getElementById("about-button").style.color = "#000000";
}

/**
 * Makes the tab data visible once the tab has loaded.
 */
function showTab() {
  document.getElementById("content").style.display = "block";
}

/**
 * Fetches the team-specific match list from the server.
 */
function getCustomizedSchedule() {
  var customizedCallback = function (response) {
    globals.matchlist = response.matches;
    if (globals.matchlist.length == 0) {
      location.href = "/";
    } else {
      // Skip the matches that have already been played.
      for (globals.matchIndex = 0; 
           globals.matchIndex < globals.matchlist.length &&
               globals.matchlist[globals.matchIndex].status >= 5;
           globals.matchIndex++);
      showCountdown();
    }
  }
  doXmlHttp("action.php?action=matchlist&event=" + globals.event + "&team=" + globals.team,
            customizedCallback);
}


/**
 * Displays the countdown and information for the team's next match.
 */
function showCountdown() {
  // Jump right to the About tab if all matches are complete.
  if (globals.matchIndex == globals.matchlist.length) {
    showAbout();
    return;
  }

  initTab();
  document.getElementById("countdown-button").style.color = "#999999";
  document.title = "Sundial | Countdown";
  document.getElementById("pagename").innerHTML = "Countdown - Team " + globals.team;

  var content =
      "<div class='countdown-div'>\
         <div id='match-number'></div>\
         <div id='match-fraction'></div>\
         <div id='red-div'>RED ALLIANCE\
           <div id='red-teams'></div>\
         </div>\
         <div id='blue-div'>BLUE ALLIANCE\
           <div id='blue-teams'></div>\
         </div>\
         <div id='match-time-div'>TIME\
           <div id='match-time'></div>\
         </div>\
         <div id='match-status-div' align='center'>MATCH STATUS\
           <div id='match-countdown'></div>\
           <div id='match-status'></div>\
         </div>\
         <div id='field-status-div'>FIELD STATUS\
           <div id='field-status'></div>\
           <div id='field-lastmatch'></div>\
         </div>\
         <div id='current-time'></div>\
       </div>";
  document.getElementById("content").innerHTML = content;

  registerServerUpdate(getStatus);

  globals.clockTimer = setInterval(doClocks, 333);

  /**
   * Retrieves a match status update from the server. Called periodically on a timer.
   */
  function getStatus() {
    var statusCallback = function (response) {
      if (response.status == 5) {
        globals.matchIndex++;
      }
      
      // Jump right to the About tab if all matches are complete.
      if (globals.matchIndex == globals.matchlist.length) {
        showAbout();
        return;
      }
      
      globals.matchlist[globals.matchIndex].status = response.status;
      document.getElementById("match-number").innerHTML =
          "Match " + globals.matchlist[globals.matchIndex].number;
      document.getElementById("match-fraction").innerHTML =
          (globals.matchIndex + 1) + " of " + globals.matchlist.length;
      document.getElementById("red-teams").innerHTML =
          globals.matchlist[globals.matchIndex].red1 + "&nbsp;&nbsp;&nbsp;" +
          globals.matchlist[globals.matchIndex].red2 + "&nbsp;&nbsp;&nbsp;" +
          globals.matchlist[globals.matchIndex].red3;
      document.getElementById("blue-teams").innerHTML =
          globals.matchlist[globals.matchIndex].blue1 + "&nbsp;&nbsp;&nbsp;" +
          globals.matchlist[globals.matchIndex].blue2 + "&nbsp;&nbsp;&nbsp;" +
          globals.matchlist[globals.matchIndex].blue3;
      var matchTime = new Date(globals.matchlist[globals.matchIndex].time * 1000);
      document.getElementById("match-time").innerHTML =
          lz(matchTime.getHours()) + ":" + lz(matchTime.getMinutes());
      document.getElementById("match-status").innerHTML =
          globals.countdownStatusArray[globals.matchlist[globals.matchIndex].status];
      globals.lateness = response.lateness * 1000;
      if (globals.lateness >= 120000) {
        document.getElementById("field-status").innerHTML =
            "Running " + Math.round(globals.lateness / 60000) + " minutes late\n";
      } else if (globals.lateness <= -120000) {
        document.getElementById("field-status").innerHTML =
            "Running " + Math.round(globals.lateness / -60000) + " minutes early\n";
      } else {
        document.getElementById("field-status").innerHTML = "Running on time\n";
      }
      document.getElementById("field-lastmatch").innerHTML =
          "Last match played: " + response.lastMatch;
      globals.currentTab = 1;
      doClocks();
      resizeCountdown();
    }
    doXmlHttp("action.php?action=status&event=" + globals.event + "&team=" + globals.team +
                  "&match=" + globals.matchlist[globals.matchIndex].number,
              statusCallback);
  }

  var blinkCounter = 0;

  /**
   * Update the real-time and countdown clocks.
   */
  function doClocks() {
    var currentTime = new Date();
    currentTime.setTime(currentTime.getTime());
    document.getElementById("current-time").innerHTML =
        "Current Time:&nbsp;&nbsp;&nbsp;" + lz(currentTime.getHours()) + ":" +
        lz(currentTime.getMinutes()) + ":" + lz(currentTime.getSeconds());

    var matchTime = new Date(globals.matchlist[globals.matchIndex].time * 1000);

    // Add an extra second so that the current time and the countdown match up.
    var countdownDiff = matchTime.getTime() + globals.lateness - currentTime.getTime() + 1000;
    
    // Avoid displaying a negative time.
    if (countdownDiff < 0) {
      countdownDiff = 0;
    }

    var countdownTime = new Date(countdownDiff);
    document.getElementById("match-countdown").innerHTML =
        lz(countdownTime.getUTCHours()) + ":" + lz(countdownTime.getUTCMinutes()) + ":" +
        lz(countdownTime.getUTCSeconds());

    // Make the match status blink.
    var statusVisibility;
    switch (globals.matchlist[globals.matchIndex].status) {
      case 0: {
        statusVisibility = "visible";
        break;
      }
      case 1: {
        if ((blinkCounter >= 1) && (blinkCounter <= 3)) {
          statusVisibility = "visible";
        } else if (blinkCounter >= 4) {
          statusVisibility = "hidden";
          blinkCounter = 0;
          break;
        }
        break;
      }
      case 2: {
        if ((blinkCounter >= 1) && (blinkCounter <= 2)) {
          statusVisibility = "visible";
        } else if (blinkCounter >= 3) {
          statusVisibility = "hidden";
          blinkCounter = 0;
          break;
        }
      }
      case 3: {
        if (blinkCounter == 1) {
          statusVisibility = "visible";
        } else if (blinkCounter >= 2) {
          statusVisibility = "hidden";
          blinkCounter = 0;
          break;
        }
      }
      case 4: {
        statusVisibility = "visible";
        break;
      }
    }
    document.getElementById("match-status").style.visibility = statusVisibility;
    blinkCounter++;
  }
}

/**
 * Displays the entire qualification match schedule.
 */
function showSchedule() {
  initTab();
  document.getElementById("schedule-button").style.color = "#999999";
  document.title = "Sundial | Schedule";
  document.getElementById("pagename").innerHTML = "Match Schedule - Team " + globals.team;
  
  var content =
      "<table id='schedule-title'>\
         <tr>\
           <td class='schedule-match-title'>Match #</td>\
           <td class='schedule-time-title'>Time</td>\
           <td class='schedule-red-title'>Red Team 1</td>\
           <td class='schedule-red-title'>Red Team 2</td>\
           <td class='schedule-red-title'>Red Team 3</td>\
           <td class='schedule-blue-title'>Blue Team 1</td>\
           <td class='schedule-blue-title'>Blue Team 2</td>\
           <td class='schedule-blue-title'>Blue Team 3</td>\
           <td class='schedule-status-title'>Status</td>\
         </tr>\
       </table>\
       <div id='schedule-scroll' />";
  document.getElementById("content").innerHTML = content;

  registerServerUpdate(getSchedule);

  /**
   * Retrieves a schedule update from the server. Called periodically on a timer.
   */
  function getSchedule() {
    scheduleCallback = function (response) {
      var matches = response.matches;
      var scheduleScroll = "<table cellspacing='0' id='schedule-table'>";
      for (var i = 0; i < matches.length; i++) {
        matchTime = new Date(matches[i].time * 1000);

        var matchTimeString =
            lz(matchTime.getMonth()+1) + "/" + lz(matchTime.getDate()) + "/" +
            matchTime.getFullYear() + " " + lz(matchTime.getHours()) + ":" +
            lz(matchTime.getMinutes()) + ":" + lz(matchTime.getSeconds());

        var rowBold = "normal";
        var rowColour = (i % 2) ? "#FFFFFF" : "#DDEEFF";
        for (var j = 0; j < globals.matchlist.length; j++) {
          if (globals.matchlist[j].number == matches[i].number) {
            rowColour = "#CCCCCC";
            rowBold = "bold";
            break;
          }
        }

        scheduleScroll +=
            "<tr style='font-weight: " + rowBold + "; background-color: " + rowColour + ";'>\
               <td class='schedule-match-number'>" + matches[i].number + "</td>\
               <td class='schedule-match-time'>" + matchTimeString + "</td>\
               <td class='schedule-team'>" + matches[i].red1 + "</td>\
               <td class='schedule-team'>" + matches[i].red2 + "</td>\
               <td class='schedule-team'>" + matches[i].red3 + "</td>\
               <td class='schedule-team'>" + matches[i].blue1 + "</td>\
               <td class='schedule-team'>" + matches[i].blue2 + "</td>\
               <td class='schedule-team'>" + matches[i].blue3 + "</td>\
               <td class='schedule-status' style='color: " +
                   ((matches[i].status < 5) ? "#990000" : "#666666") + ";'>" +
                   globals.scheduleStatusArray[matches[i].status] + "</td>\
             </tr>";
      }
      scheduleScroll += "</table>";
      document.getElementById("schedule-scroll").innerHTML = scheduleScroll;
      globals.currentTab = 2;
      resizeSchedule();
    }
    doXmlHttp("action.php?action=schedule&event=" + globals.event + "&team=" + globals.team,
              scheduleCallback);
  }
}

/**
 * Displays information about Sundial.
 */
function showAbout() {
  initTab();
  document.getElementById("about-button").style.color = "#999999";
  document.title = "Sundial | About";
  document.getElementById("pagename").innerHTML = "About Sundial";
  
  var aboutMessage = "";
  if (globals.matchIndex == globals.matchlist.length) {
    document.getElementById("countdown-button").style.visibility = "hidden";
    aboutMessage = "Your matches are complete. Thank you for using Sundial.";
  }
  var content =
      "<div style='width: 100%; height: 98%;'>\
         <div id='about-message'>" + aboutMessage + "</div>\
         <div id='about-logo'>sundial <span style='font-size: 35%'>v4.2</span></div>\
         <div id='about-info'>\
           Copyright &copy; 2004 - 2008 Patrick Fairbank.<br />\
           All rights reserved.<br /><br />\
           Questions and comments welcome at <br />\
           sundial [at] patfair [dot] net.\
         </div>\
       </div>";
  document.getElementById("content").innerHTML = content;
  
  registerServerUpdate(null);

  globals.currentTab = 3;
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
  document.getElementById("connection-status").style.bottom = 0 * sizeRatio;
  document.getElementById("connection-status").style.left = 35 * sizeRatio;
  document.getElementById("connection-status").style.fontSize = 10 * sizeRatio;
  document.getElementById("links").style.bottom = -25 * sizeRatio;
  document.getElementById("links").style.fontSize = 15 * sizeRatio;
  document.getElementById("sundial").style.bottom = -25 * sizeRatio;
  document.getElementById("sundial").style.right = 25 * sizeRatio;
  document.getElementById("sundial").style.fontSize = 35 * sizeRatio;

  switch (globals.currentTab) {
    case 1: {
      resizeCountdown();
      break;
    }
    case 2: {
      resizeSchedule();
      break;
    }
    case 3: {
      resizeAbout();
      break;
    }
    default:
  }
}
window.onresize = resize;

/**
 * Resizes the Countdown tab elements to match the browser window size.
 */
function resizeCountdown() {
  document.getElementById("match-fraction").style.fontSize = 14 * sizeRatio;
  document.getElementById("match-fraction").style.right = 5 * sizeRatio;
  document.getElementById("match-fraction").style.top = 5 * sizeRatio;
  document.getElementById("match-number").style.fontSize = 22 * sizeRatio;
  document.getElementById("match-number").style.top = 5 * sizeRatio;
  document.getElementById("red-div").style.fontSize = 10 * sizeRatio;
  document.getElementById("red-div").style.top = 40 * sizeRatio;
  document.getElementById("red-div").style.left = 40 * sizeRatio;
  document.getElementById("red-teams").style.fontSize = 22 * sizeRatio;
  document.getElementById("blue-div").style.fontSize = 10 * sizeRatio;
  document.getElementById("blue-div").style.top = 40 * sizeRatio;
  document.getElementById("blue-div").style.right = 40 * sizeRatio;
  document.getElementById("blue-teams").style.fontSize = 22 * sizeRatio;
  document.getElementById("match-time-div").style.fontSize = 10 * sizeRatio;
  document.getElementById("match-time-div").style.top = 40 * sizeRatio;
  document.getElementById("match-time").style.fontSize = 22 * sizeRatio;
  document.getElementById("match-status-div").style.fontSize = 10 * sizeRatio;
  document.getElementById("match-status-div").style.height = 200 * sizeRatio;
  document.getElementById("match-status-div").style.top = 110 * sizeRatio;
  document.getElementById("match-status-div").style.left = 60 * sizeRatio;
  document.getElementById("match-countdown").style.fontSize = 130 * sizeRatio;
  document.getElementById("match-countdown").style.top = -25 * sizeRatio;
  document.getElementById("match-status").style.fontSize = 35 * sizeRatio;
  document.getElementById("match-status").style.top = -50 * sizeRatio;
  document.getElementById("field-status-div").style.fontSize = 10 * sizeRatio;
  document.getElementById("field-status-div").style.top = 340 * sizeRatio;
  document.getElementById("field-status").style.fontSize = 20 * sizeRatio;
  document.getElementById("field-lastmatch").style.fontSize = 20 * sizeRatio;
  document.getElementById("current-time").style.fontSize = 20 * sizeRatio;
  document.getElementById("current-time").style.top = 430 * sizeRatio;
  showTab();
}

/**
 * Resizes the Schedule tab elements to match the browser window size.
 */
function resizeSchedule() {
  document.getElementById("schedule-title").style.fontSize = 9 * sizeRatio;
  document.getElementById("schedule-scroll").style.height = 445 * sizeRatio;
  document.getElementById("schedule-table").style.fontSize = 10 * sizeRatio;
  showTab();
}

/**
 * Resizes the About tab elements to match the browser window size.
 */
function resizeAbout() {
  document.getElementById("about-message").style.fontSize = 15 * sizeRatio;
  document.getElementById("about-message").style.top = 25 * sizeRatio;
  document.getElementById("about-logo").style.fontSize = 70 * sizeRatio;
  document.getElementById("about-logo").style.top = 80 * sizeRatio;
  document.getElementById("about-logo").style.left = 70 * sizeRatio;
  document.getElementById("about-info").style.fontSize = 10 * sizeRatio;
  document.getElementById("about-info").style.top = 80 * sizeRatio;
  document.getElementById("about-info").style.left = 340 * sizeRatio;
  showTab();
}
