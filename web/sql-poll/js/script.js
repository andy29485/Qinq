/*
 * Copyright (c) 2016, Andriy Zasypkin.
 *
 * This file is part of Qinq.
 *
 * Qinq(or QINQ) is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * Qinq in distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Qinq. If not, see <http://www.gnu.org/licenses/>.
 */

var player_id   = 0;
var player_name = '';
var timer       = 0;
var state       = 'waiting';
var timer_pid   = -1;
var info_timer  = -1;
var code        = '';

function onLoad() {
  //visible:
  //document.getElementById("id-name").style.display = 'block';

  //not:
  //document.getElementById("id-name").style.display = 'none';

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
  }

  document.getElementById("welcome").style.display      = 'block';
  document.getElementById("timer").style.display        = 'none';
  document.getElementById("question-box").style.display = 'none';
  document.getElementById("vote-box").style.display     = 'none';
  document.getElementById("name-error").style.display   = 'none';
  
  document.getElementById('name-field').focus();

  document.getElementById("name-field").addEventListener("keypress",
      function(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      createPlayer();
    }
  });

  document.getElementById("answer-field").addEventListener("keypress",
      function(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      submitAnswer();
    }
  });

  document.getElementById("answer-field").addEventListener("keyup",
      function(event) {
    event.preventDefault();
    if (event.keyCode == 13) {
      submitAnswer();
    }
  });
}

function getInfo() {
  clearTimeout(info_timer);
  
  var url = "http://"+location.host;
  url += location.pathname+"getinfo.php?code="+code;
  if(player_id == 0) {
    url += "&name="+encodeStr(player_name);
  }
  else {
    url += "&id="+player_id;
  }
  console.log('URL: ' + url);
  data = httpGet(url).split('\n');;
  for(var i = 0;i < data.length;i++){
    if(data[i]) {
      parseData(data[i]);
    }
  }
  info_timer = setTimeout(getInfo, 400);
}

function parseData(data) {
  console.log("GET: "+data);
  
  if(player_id == 0) {
    if((data+"").match(/^\d+$/)) {
      player_id = +data;
    }
    return;
  }
  
  try {
    json = JSON.parse(evt.data);
  }
  catch(err) {
    return;
  }
  
  if(json['uid'] != player_id && player_id != 0) {
    return;
  }
  if(player_id == 0 && 'name' in json
     && json['name'].toLowerCase() != player_name.toLowerCase()) {
    return;
  }
  
  if('time' in json) {
    timer = +json['time']+1; //black magic
    document.getElementById("timer").style.display = 'block';
    document.getElementById("timer").innerHTML     = timer;
    setTimer();
  }
  
  switch(json['action']) {
    case 'creating':
      if(json['created'] == 'true') {
        player_id   = json['id'];
        player_name = json['name'];
        document.getElementById('name').innerHTML          = esc(player_name);
        document.getElementById("welcome").style.display       = 'none';
        document.getElementById("header").style.backgroundColor=json['color'];
      }
      else {
        document.getElementById("welcome").style.display    = 'block';
        document.getElementById("name-error").style.display = 'block';
      }
      break;
    case 'answer':
      document.getElementById("answer-question").innerHTML  =
        esc(json['question']);
      document.getElementById('answer-field').dataset.id    = json['aid'];
      document.getElementById("question-box").style.display = 'block';
      document.getElementById("vote-box").style.display     = 'none';
      document.getElementById("welcome").style.display      = 'none';
      document.getElementById("results-box").style.display  = 'none';
      document.getElementById('answer-field').focus();
      state = 'answering';
      setTimer();
      break;
    case 'vote':
      document.getElementById("timer").style.display        = 'block';
      document.getElementById("vote-box").style.display     = 'block';
      document.getElementById("question-box").style.display = 'none';
      document.getElementById("welcome").style.display      = 'none';
      document.getElementById("results-box").style.display  = 'none';
      document.getElementById("answers").innerHTML          = '';
      document.getElementById("vote-question").innerHTML    =
                                                        esc(json['question']);
      document.getElementById("votes-left-span").innerHTML  = json['votes'];
      if(json['votes'] > 1)
        document.getElementById("votes-left-div").style.display = 'block';
      else
        document.getElementById("votes-left-div").style.display = 'none';
      var element = document.getElementById("answers");
      if('answers' in json) {
        json['answers'].forEach(function(answer) {
          var div = document.createElement("div");
          var span = document.createElement("span");
          var node = document.createTextNode(answer['answer']);
          div.dataset.id = answer['aid'];
          span.id = 'vts-'+answer['aid'];
          div.className = 'vote-option';
          div.setAttribute("onclick", "submitVote(" + answer['aid'] + ")");
          div.appendChild(node);
          div.appendChild(span);
          element.appendChild(div);
        });
      }
      if(json['votes'] > 0){
        state = 'voting';
      }
      break;
    case 'info':
      if(state == 'waiting') {
        document.getElementById("results-box").innerHTML = '';
        var element = document.getElementById("results-box");
        
        if(json['info'] != 'none') {
          if(json['info'] == 'answering') {
  
            var node = document.createTextNode('WAITING FOR PLAYERS:');
            var info_div = document.createElement("div");
            info_div.className = 'message';
            info_div.appendChild(node);
  
            element.appendChild(info_div);
            
          }
          if(json['info'] == 'answering'
           || json['info'] == 'round') {
            var div = document.createElement("div");
            div.id  = 'info';
            json['players'].forEach(function(player) {
              if(player['name'] != player_name) {
                var player_div = document.createElement("div");
                var node = document.createTextNode(player['name']);
                player_div.className = 'player';
                player_div.style.backgroundColor = player['color'];
                player_div.appendChild(node);
                div.appendChild(player_div);
              }
            });
            element.appendChild(div);
          } 
          else if(json['info'] == 'question') {
  
            var div = document.createElement("div");
            div.id = 'answers';
            
            json['answers'].forEach(function(answer) {
              var answer_div_wrap = document.createElement("div");
              answer_div_wrap.className = 'result-answer-wrapper';
              
              var answer_div = document.createElement("div");
              answer_div.className = 'result-answer';
  
              var player_div = document.createElement("div");
              var node = document.createTextNode(answer['player']['name']);
              player_div.className = 'player submitter';
              player_div.style.backgroundColor = answer['player']['color'];
              player_div.appendChild(node);
              answer_div.appendChild(player_div);
  
              var node = document.createTextNode(answer['score']);
              var score_div = document.createElement("div");
              score_div.className = 'score';
              score_div.appendChild(node);
              answer_div.appendChild(score_div);

              var answerVal_div = document.createElement("div");
              if(answer['answer'] && answer['answer'].length > 0 ) {
                var node = document.createTextNode(answer['answer']);
              }
              else {
                var node = document.createTextNode("(Did not Answer)");
                answerVal_div.style.color = "#ff0000";
              }
              answerVal_div.className = 'answer';
              answerVal_div.appendChild(node);
              answer_div.appendChild(answerVal_div);
  
              var votes_div = document.createElement("div");
              votes_div.className = 'votes';
              
              answer['votes'].forEach(function(vote) {
                var node = document.createTextNode(vote['value']);
                var vote_div = document.createElement("div");
                vote_div.style.backgroundColor = vote['color'];
                vote_div.className = 'vote player';
                vote_div.appendChild(node);
                
                
                votes_div.appendChild(vote_div);
              });
              answer_div.appendChild(votes_div);
              answer_div_wrap.appendChild(answer_div);
              div.appendChild(answer_div_wrap);
            });
  
            var node = document.createTextNode(json['question']);
            var question_div = document.createElement("div");
            question_div.className = 'question';
            question_div.appendChild(node);
  
            element.appendChild(question_div);
            element.appendChild(div);
          } 
          document.getElementById("results-box").style.display = 'block';
        }
      }
      break;
    case 'time':
      timer = 0;
      document.getElementById("welcome").style.display      = 'none';
      document.getElementById("timer").style.display        = 'none';
      document.getElementById("question-box").style.display = 'none';
      document.getElementById("vote-box").style.display     = 'none';
      document.getElementById("name-error").style.display   = 'none';
      document.getElementById("timer").innerHTML            = timer;
      state = 'waiting';
      break;
    case 'voting':
      if(json['left'] == 0 || json['left'] == '0') {
        removeElementsByClass('vote-option');
        state = 'waiting';
      }
      else {
        var aid            = +json['aid'];
        var ans_info       = document.getElementById("vts-"+aid);
        ans_info.innerHTML = '&nbsp;(' + json['voted'] + ')';
      }
      break;
    case 'kick':
      ws.close();
      alert('You have been kicked');
      break;
    case 'end':
      ws.close();
      alert('Game has ended');
      break;
    default:
      break;
  }
}


function spectate() {
  player_name = 'spectator';
  code        = document.getElementById('code-field').value;
  sendData({'action':'create user', 'name':''});
  getInfo();
}

function createPlayer() {
  player_name = document.getElementById('name-field').value.trim();
  code        = document.getElementById('code-field').value;
  sendData({'action':'create user', 'name':player_name});
  getInfo();
}

function submitAnswer() {
  document.getElementById("welcome").style.display      = 'none';
  document.getElementById("vote-box").style.display     = 'none';

  var answer = document.getElementById('answer-field').value;
  var aid = document.getElementById('answer-field').dataset.id;
  if(aid == undefined || !answer.trim()) {
    return null;
  }
  var data = {'action':'send answer', 'id':aid, 'answer':answer}
  sendData(data);
  document.getElementById("question-box").style.display = 'none';
  document.getElementById("welcome").style.display      = 'none';

  document.getElementById('answer-field').value         = '';
  state = 'waiting';
}

function submitVote(aid) {
  sendData({'action':'vote', 'id':player_id.toString(), 'aid':aid.toString()});
}

function sendData(data) {
  console.log('SEND: '+JSON.stringify(data));
  if(player_id != 0) {
    data['uid'] = player_id;
  }
  
  var hr = new XMLHttpRequest();
  
  var url = "http://"+location.host;
  url += location.pathname+"senddata.php?code="+code+"&id=0";
  
  var vars = "message="+encodeStr(JSON.stringify(data));
  
  hr.open("POST", url, true);
  hr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  hr.send(vars);
}

function removeElementsByClass(className){
  var elements = document.getElementsByClassName(className);
  while(elements.length > 0){
    elements[0].parentNode.removeChild(elements[0]);
  }
}

function esc(html) {
  var text = document.createTextNode(html);
  var div = document.createElement('div');
  div.appendChild(text);
  return div.innerHTML;
}

function httpGet(theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false); // false for synchronous request
  xmlHttp.send();
  return xmlHttp.responseText;
}

function setTimer() {
  window.clearTimeout(timer_pid);
  timer = +timer - 1;//potentially black magic?
  document.getElementById("timer").innerHTML = timer;
  
  if(timer > 0) {
    timer_pid = window.setTimeout(setTimer, 1000);
    document.getElementById("timer").style.display = 'block';
  }
  else {
    document.getElementById("timer").style.display = 'none';
  }
}

function encodeStr(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}
