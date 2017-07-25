function GetId(id)
{
  return document.getElementById(id);
}
var i=false; // La variable i nous dit si la bulle est visible ou non

function move(e) {
  if(i) {  // Si la bulle est visible, on calcul en temps reel sa position ideale
    if (navigator.appName!="Microsoft Internet Explorer") { // Si on est pas sous IE
      GetId("curseur").style.left=e.pageX + 5+"px";
      GetId("curseur").style.top=e.pageY + 10+"px";
    }
    else { // Modif proposé par TeDeum, merci à  lui
      if(document.documentElement.clientWidth>0) {
	GetId("curseur").style.left=20+event.x+document.documentElement.scrollLeft+"px";
	GetId("curseur").style.top=10+event.y+document.documentElement.scrollTop+"px";
      } else {
	GetId("curseur").style.left=20+event.x+document.body.scrollLeft+"px";
	GetId("curseur").style.top=10+event.y+document.body.scrollTop+"px";
      }
    }
  }
}

function montre(text) {
  if(i==false) {
    GetId("curseur").style.visibility="visible";
    GetId("curseur").innerHTML = text;
    i=true;
  }
}

function cache() {
  if(i==true) {
    GetId("curseur").style.visibility="hidden";
    i=false;
  }
}

function loadJSON(url,callback) {   

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', (url), true); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(JSON.parse(xobj.responseText));
    }
  };
  xobj.send(null);  
 }


loadJSON("lda.json", function(data) {
  loadJSON("mapping.json",function(mapping){
    //rename the topics with the initial indexes
    // then merge topics by couple in fusions
    // then change indexes to avoid gap
    
    var setNameInfo = function(names,map){

      var visCircle;
      console.log(map);
      
      Object.keys(names).forEach(function(id){
	var visID = String(map[+id]);
	console.log(id, visID)
	visCircle = document.getElementById('lda-topic'+visID);
	visCircle.addEventListener("mouseover", function(){
	  var topicName = names[id];
	  montre(topicName);
	},false);
	
	visCircle.addEventListener("mouseout", function(){
	  cache();
	},false);

      });
      document.onmousemove=move;
    }

    var getFusionned = function(d,fusions){
      
      fusions.forEach(function(fusion){

	var terms = d["token.table"].Term;
	var topics = d["token.table"].Topic;
	var freqs = d["token.table"].Freq;
	
	var currentTerm;
	var indexes;
	var lastIndex = 0;
	var targetIndex = -1;
	var source = fusion[1];
	var target = fusion[0];

	var i = 0;
	var l = terms.length;
	
	while(i<l){
	  var sourceIndex = -1;
	  var targetIndex = -1;
	  currentTerm = terms[i];

	  while(i<l && terms[i] == currentTerm){

	    if(topics[i] == target){
	      targetIndex = i;
	      if(sourceIndex != -1){
		freqs[targetIndex] +=freqs[sourceIndex];
		terms.splice(sourceIndex,1);
		topics.splice(sourceIndex,1);
		freqs.splice(sourceIndex,1);
		i--;
		l--;
	      }
	    }
	    
	    if(topics[i] == source){
	      sourceIndex = i;
	      topics[i] = target;
	      if(targetIndex != -1){
		freqs[targetIndex] += freqs[sourceIndex];
		terms.splice(sourceIndex,1);
		topics.splice(sourceIndex,1);
		freqs.splice(sourceIndex,1);
		i--;
		l--;
	      }
	    }
	    i++;
	  }
	}

	//tinfo
	var tinfo = d["tinfo"];
	var aSource = tinfo.Category.indexOf("Topic"+source);
	var bSource = tinfo.Category.lastIndexOf("Topic"+source);
	var aTarget = tinfo.Category.indexOf("Topic"+target);
	var bTarget = tinfo.Category.lastIndexOf("Topic"+target);

	var indexesToDel = [];
	
	for(var i=aSource; i<=bSource;i++){
	  var term = tinfo.Term[i];
	  var targetIndex = tinfo.Term.indexOf(term,aTarget);

	  if(targetIndex<= bTarget){
	    tinfo.Freq[targetIndex] = tinfo.Freq[targetIndex] + tinfo.Freq[i];
	    tinfo.Total[targetIndex] = tinfo.Total[targetIndex] + tinfo.Total[i];
	    tinfo.loglift[targetIndex] = Math.log(Math.exp(tinfo.loglift[targetIndex]) + Math.exp(tinfo.loglift[i]));
	    tinfo.logprob[targetIndex] = Math.log(Math.exp(tinfo.logprob[targetIndex]) + Math.exp(tinfo.logprob[i]));
	    indexesToDel.push(i);
	  }

	  tinfo.Category[i] = "Topic"+target;
	}

	indexesToDel.sort().reverse();

	for(var i=0;i<indexesToDel.length;i++){
	  var index = indexesToDel[i];
	  tinfo.Term.splice(index,1);
	  tinfo.Freq.splice(index,1);
	  tinfo.Total.splice(index,1);
	  tinfo.loglift.splice(index,1);
	  tinfo.logprob.splice(index,1);
	  tinfo.Category.splice(index,1);
	}
	

	// mdsDat
	var indexToDel = d["mdsDat"].topics.indexOf(source);
	var indexToInc = d["mdsDat"].topics.indexOf(target);
	d["mdsDat"].topics.splice(indexToDel,1)
	d["mdsDat"].x.splice(indexToDel,1)
	d["mdsDat"].y.splice(indexToDel,1)
	d["mdsDat"].Freq[indexToInc] += d["mdsDat"].Freq[indexToDel];
	d["mdsDat"].Freq.splice(indexToDel,1)
	d["mdsDat"].cluster.splice(indexToDel,1);

	d["topic.order"].splice(d["topic.order"].indexOf(source),1);
	
      })

      //re-index topics
      var deletedTopics = [];
      var topicsMap ={};
      var topics = d["topic.order"].slice().sort(function(a,b){ return a-b;});

      for(var i=0;i<topics.length;i++){
	topicsMap[topics[i]] = i+1;
      }

      d["token.table"].Topic.forEach(function(topic,index){
	d["token.table"].Topic[index] = topicsMap[topic];
      })
      d["tinfo"].Category.forEach(function(topicName,index){
	if(topicName != "Default"){
	  var topic = +topicName.substring(5);
	  d["tinfo"].Category[index] = "Topic"+topicsMap[topic];
	}
      });

      d["topic.order"] = d["topic.order"].map(function(topic){
	return topicsMap[topic];
      })
      d["mdsDat"].topics = d["topic.order"].slice().sort(function(a,b){ return a-b;});

      return topicsMap;
    }

    var topicsMap = getFusionned(data,mapping.fusions);
    
    data.tinfo.Term.forEach(function(term,i){
      if(term=="panamapaper");
      //      console.log(term,data.tinfo.Category[i],data.tinfo.Freq[i])
    })

    data["token.table"].Term.forEach(function(term,i){
      if(term=="panamapaper");
      //    console.log(term,data["token.table"].Topic[i],data["token.table"].Freq[i])
    })
    
    var vis = new LDAvis("#lda", data);

    setTimeout(function(){
      setNameInfo(mapping.names,topicsMap);
    },1000)
  })
});
