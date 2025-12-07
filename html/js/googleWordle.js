class GoogleWordle {
  search="";
  goodSearch=true;
  searchResult=[];
  constructor(json) {
    if(!json) return;
    this.search=json.search_parameters.q;
    if(json.search_information.organic_results_state !== "Results for exact spelling"){
      this.goodSearch=false;
    }
    let searchResultJson;
    searchResultJson = json.recipes_results;
    if(searchResultJson instanceof Array){
      searchResultJson.forEach(e=>{
        this.searchResult.push(GoogleSearchResult.fromRecipeResults(e));
      });
    }
    searchResultJson = (json.local_results||{}).places;
    if(searchResultJson instanceof Array){
      searchResultJson.forEach(e=>{
        this.searchResult.push(GoogleSearchResult.fromLocalResults(e));
      });
    }
    searchResultJson = json.knowledge_graph;
    if(searchResultJson instanceof Object){
      this.searchResult.push(GoogleSearchResult.fromKnowledgeGraph(searchResultJson));
    }
    searchResultJson = json.related_questions;
    if(searchResultJson instanceof Array){
      searchResultJson.forEach(e=>{
        this.searchResult.push(GoogleSearchResult.fromQuestions(e));
      });
    }
    searchResultJson = json.organic_results;
    if(searchResultJson instanceof Array){
      searchResultJson.forEach(e=>{
        this.searchResult.push(GoogleSearchResult.fromOrganicResults(e));
      });
    }
  }
  static l=Object.freeze({
    o: {
      l: ()=>{document.querySelectorAll('.ggwd-secret-hidden').forEach(e=>e.click());}
    }
  });
  toJson(){
    return JSON.stringify(this);
  }
  static fromJson(json){
    let res=new GoogleWordle();
    res.search=json.search ?? res.search;
    res.goodSearch=json.goodSearch ?? res.goodSearch;
    const result=json.searchResult;
    if(result instanceof Array){
      result.forEach(e=>{
        res.searchResult.push(GoogleSearchResult.of(e));
      });
    }
    return res;
  }
  generateSearchBarElement(){
    let result=document.createElement('div');
    result.classList.add('ggwd-search-bar');
    result.innerHTML=`
    <img src="googleWordle.png" class="ggwd-search-bar-search-img">
    `
    let contentText=document.createElement('a');
    contentText.classList.add('ggwd-search-bar-content-text');
    contentText.textContent=this.search;
    let content=document.createElement('div');
    content.classList.add('ggwd-search-bar-content');
    content.appendChild(contentText);
    result.prepend(content);
    return result;
  }
}

let stats = {
  guessed: 0,
  discovered: 0,
  tips: 0,
  titles: 0,
  shown: 0
}
function statsIncrease(stateName, num=1){
  stats[stateName]+=num;
  const display = document.getElementById(`ggwd-stats-${stateName}`);
  if(display){
    display.innerText=stats[stateName];
  }
}

let guessButton=null;
let guessInput=null;
let searchResultList=null;
let historyList=null;
let wordleData=null;
let searchContainer=null;

function findResult(component){
  if(component.classList.contains("ggwd-secret-word")){
    while(!component.classList.contains("ggwd-search-result")){
      if(!component.parentElement) return null;
      component=component.parentElement;
    }
    return component;
  }
  return null;
}
function discoverOnResult(res, num){
  if(res){
    const discovered = Number(res.getAttribute("discovered-word-count"))+num;
    const all = Number(res.getAttribute("hidden-word-count"));
    res.setAttribute("discovered-word-count", String(discovered));
    stateDisplay=res.querySelector(".ggwd-result-state")
    if(stateDisplay){
      stateDisplay.innerText=`${discovered}/${all}`;
    }
    if(discovered*10 >= all*7){
      res.querySelector('.ggwd-search-title').classList.remove('ggwd-secret-hidden');
      statsIncrease('titles');
    }
  }
}

let guessedTimes=0, guessedWords={};
/**
 * Guess the word
 * @param {String} word 
 */
function guess(word){
  if(!(wordleData instanceof GoogleWordle) || !word.match(/^[a-zA-Z0-9\-_]+$/)) return false;
  word=word.toLowerCase();
  if(guessedWords.hasOwnProperty(word)){
    if(historyList instanceof HTMLDivElement){
      let newRecord = document.createElement('div');
      newRecord.classList.add('ggwd-guess-history');
      newRecord.innerHTML=`
        <div class="ggwd-guess-history-attempt"></div>
        <div class="ggwd-guess-history-word ggwd-guess-history-duplicated"></div>
        <div class="ggwd-guess-history-discovered">DUPE</div>`
      newRecord.querySelector('.ggwd-guess-history-attempt').innerText=String(++guessedTimes);
      newRecord.querySelector('.ggwd-guess-history-word').innerText=word;
      historyList.appendChild(newRecord);
    }
    return true;
  }
  guessedWords[word]=1;
  let cnt=0;
  if(searchResultList instanceof HTMLDivElement){
    statsIncrease("guessed");
    searchResultList.querySelectorAll(".ggwd-search-result").forEach(res =>{
      res.querySelectorAll('.ggwd-secret-word.ggwd-secret-hidden').forEach(e=>{
        if(e.getAttribute('word')===word){
          e.classList.remove('ggwd-secret-hidden');
          ++cnt;
          discoverOnResult(res,1);
        }
      });
    });
    if(historyList instanceof HTMLDivElement){
      let newRecord = document.createElement('div');
      newRecord.classList.add('ggwd-guess-history');
      newRecord.innerHTML=`
        <div class="ggwd-guess-history-attempt"></div>
        <div class="ggwd-guess-history-word"></div>
        <div class="ggwd-guess-history-discovered"></div>`
      newRecord.querySelector('.ggwd-guess-history-attempt').innerText=String(++guessedTimes);
      newRecord.querySelector('.ggwd-guess-history-word').innerText=word;
      newRecord.querySelector('.ggwd-guess-history-discovered').innerText=String(cnt);
      if(cnt>0){
        newRecord.querySelector('.ggwd-guess-history-word').classList.add('ggwd-guess-history-success');
      } else {
        newRecord.querySelector('.ggwd-guess-history-word').classList.add('ggwd-guess-history-fail');
      }

      const historyListOuter = historyList.parentElement;
      const onBottom = historyListOuter.scrollTop+historyListOuter.clientHeight>=historyList.clientHeight-10;
      historyList.appendChild(newRecord);
      console.log(onBottom);
      if(onBottom){
        historyListOuter.scrollTo({
          top: historyList.clientHeight
        });
      }
    }
  }
  statsIncrease("discovered", cnt);
  statsIncrease("shown", cnt);
  checkFinish();
  return true;
}

let copySuccess=null;
let copyFail=null;
document.addEventListener("DOMContentLoaded",()=>{
  guessInput=document.getElementById('ggwd-guess');
  guessButton=document.getElementById('ggwd-guess-button');
  searchResultList=document.querySelector('.ggwd-search-result-list');
  historyList=document.querySelector('.ggwd-guess-history-list');
  copySuccess=document.querySelector('.ggwd-search-copy-success');
  copyFail=document.querySelector('.ggwd-search-copy-fail');
  searchContainer=document.querySelector('.ggwd-search');
  guessButton.addEventListener('click',()=>{
    if(guess(guessInput.value.trim())){
      guessInput.value='';
    }
  });
  guessInput.addEventListener('keydown',e=>{
    if(e.key==='Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey){
      e.preventDefault();
      guessButton.click();
    }
  });
  document.getElementById("ggwd-game-input").addEventListener("input", event=>{
    const json = JSON.parse(b64Decode(event.target.value));
    startGame(GoogleWordle.fromJson(json));
    event.target.remove();
  });
  let titleControlTimeout=null;
  titleControlTimeout=setInterval(()=>{
    const r=document.getElementById('page-title').innerText;
    const target="Goog-le";
    if(r.length > target.length){
      document.getElementById('page-title').innerText=r.substring(0,r.length-3)+r.substring(r.length-2);
    } else {
      document.getElementById('page-title').innerText=target;
      setTimeout(()=>{document.getElementById('page-title').innerText='Google';},1000);
      clearInterval(titleControlTimeout);
    }
  }, 300);
  searchResultList.addEventListener('click', event => {
    const target = event.target;
    if(target.classList.contains('ggwd-secret-word') && target.classList.contains('ggwd-secret-hidden')){
      target.classList.remove('ggwd-secret-hidden');
      const res = findResult(target);
      console.log(res);
      discoverOnResult(res, 1);
      statsIncrease("tips");
      statsIncrease("shown");
      checkFinish();
    }
  })
  // document.getElementById("ggwd-start-game-frame").src="https://google.com";
});

function copyWordleData() {
  if(wordleData instanceof GoogleWordle){
    navigator.clipboard.writeText(b64Encode(wordleData.toJson())).then(()=>{
      if(copySuccess instanceof HTMLAnchorElement){
        copySuccess.animate([
          { fontSize: '0px' },
          { fontSize: '12px' },
          { fontSize: '0px' }
        ], {
          duration: 1000
        });
      }
    }).catch(()=>{
      alert('FAILED to copy!');
    });
  } else {
    alert('FAILED to copy!');
  }
}

/**
 * Start the game
 * @param {GoogleWordle} json 
 */
function startGame(googleWordle){
  const searchLeft = document.querySelector('.ggwd-search-left');
  searchLeft.innerHTML='';
  console.log(googleWordle);
  wordleData=googleWordle;
  searchContainer.prepend(wordleData.generateSearchBarElement());
  let hiddenCnt=0, resultElement;
  wordleData.searchResult.forEach(e=>{
    resultElement=e.generateElement();
    searchLeft.appendChild(resultElement);
    hiddenCnt+=Number(resultElement.getAttribute('hidden-word-count'));
  });
  searchContainer.setAttribute('hidden-word-count', String(hiddenCnt));
  const gameStartInput = document.getElementById("ggwd-game-input");
  if(gameStartInput instanceof HTMLElement){
    gameStartInput.remove();
  }
}

function checkFinish(){
  if(stats.shown >= Number(searchContainer.getAttribute('hidden-word-count'))){
    alert('Congrats!');
  }
}