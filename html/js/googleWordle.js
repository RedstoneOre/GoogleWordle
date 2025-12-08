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
  shown: 0,
  green: 0,
  nonDupe: 0,
  reset: ()=>{
    statsIncrease('guessed', -stats.guessed);
    statsIncrease('discovered', -stats.discovered);
    statsIncrease('tips', -stats.tips);
    statsIncrease('titles', -stats.titles);
    statsIncrease('shown', -stats.shown);
    statsIncrease('green', -stats.green);
    statsIncrease('nonDupe', -stats.nonDupe);
  }
}
function statsIncrease(stateName, num=1){
  stats[stateName]+=num;
  Array.from(document.getElementsByClassName(`ggwd-stats-${stateName}`)).forEach(display=>{
    if(display){
      display.innerText=stats[stateName];
    }
  });
}

let guessButton=null;
let guessInput=null;
let gameStartInput = null;
let searchResultList=null;
let searchLeft=null;
let searchRight=null;
let historyList=null;
let wordleData=null;
let searchContainer=null;
let startGameFrame=null;
let resultPage=null;
let resultAnalyticsContainer=null;
let resultMessage=null;

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
  const scrollGuessHistory=()=>{
    const historyListOuter = historyList.parentElement;
    const onBottom = historyListOuter.scrollTop+historyListOuter.clientHeight>=historyList.clientHeight-10;
    if(onBottom){
      historyListOuter.scrollTo({
        top: historyList.clientHeight
      });
    }
  };
  if(guessedWords.hasOwnProperty(word)){
    statsIncrease("guessed");
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
      scrollGuessHistory();
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
        statsIncrease('green');
      } else {
        newRecord.querySelector('.ggwd-guess-history-word').classList.add('ggwd-guess-history-fail');
      }
      statsIncrease('nonDupe');
      historyList.appendChild(newRecord);
      scrollGuessHistory();
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
  gameStartInput=document.getElementById("ggwd-game-input");
  searchResultList=document.querySelector('.ggwd-search-result-list');
  searchLeft = document.querySelector('.ggwd-search-left');
  searchRight = document.querySelector('.ggwd-search-left');
  historyList=document.querySelector('.ggwd-guess-history-list');
  copySuccess=document.querySelector('.ggwd-search-copy-success');
  copyFail=document.querySelector('.ggwd-search-copy-fail');
  searchContainer=document.querySelector('.ggwd-search');
  startGameFrame=document.getElementById("ggwd-start-game-frame");
  resultPage=document.querySelector('.ggwd-result-page');
  resultAnalyticsContainer=document.querySelector('.ggwd-result-analytics');
  resultMessage=document.querySelector('.ggwd-result-message');
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
      discoverOnResult(res, 1);
      statsIncrease("tips");
      statsIncrease("shown");
      checkFinish();
    }
  })
  // document.getElementById("ggwd-start-game-frame").src="https://google.com";
});

function copyWordleData(resultScreen=false) {
  const failToCopy=()=>{
    if(resultScreen){
      resultMessage.innerText='Failed to Copy!';
      resultMessage.animate([
          { fontSize: '0px', color: 'var(--google-red)' },
          { fontSize: '36px' },
          { fontSize: '0px', color: 'var(--google-red)' }
        ], {
          duration: 1000
        });
    } else {
      if(copyFail instanceof HTMLAnchorElement){
        copyFail.animate([
          { fontSize: '0px' },
          { fontSize: '12px' },
          { fontSize: '0px' }
        ], {
          duration: 1000
        });
      } else {
        alert('FAILED to copy!');
      }
    }
  }
  if(wordleData instanceof GoogleWordle){
    navigator.clipboard.writeText(b64Encode(wordleData.toJson())).then(()=>{
      if(resultScreen){
        resultMessage.innerText='Copied Successfully!';
        resultMessage.animate([
            { fontSize: '0px', color: 'var(--google-green)' },
            { fontSize: '12px' },
            { fontSize: '0px', color: 'var(--google-green)' }
          ], {
            duration: 1000
          });
      } else {
        if(copySuccess instanceof HTMLAnchorElement){
          copySuccess.animate([
            { fontSize: '0px' },
            { fontSize: '12px' },
            { fontSize: '0px' }
          ], {
            duration: 1000
          });
        }
      }
    }).catch(()=>{
      failToCopy();
    });
  } else {
    failToCopy();
  }
}

/**
 * Start the game
 * @param {GoogleWordle} json 
 */
function startGame(googleWordle){
  startGameFrame.classList.remove('ggwd-search-start-google-page-shown');
  console.log(googleWordle);
  wordleData=googleWordle;
  searchContainer.prepend(wordleData.generateSearchBarElement());
  try{
    const searchBarElement=wordleData.generateSearchBarElement();
    searchBarElement.classList.add('ggwd-result-search-bar');
    document.querySelector('.ggwd-result-content').prepend(searchBarElement);
  }catch(e){}
  let hiddenCnt=0, resultElement;
  wordleData.searchResult.forEach(e=>{
    resultElement=e.generateElement();
    searchLeft.appendChild(resultElement);
    hiddenCnt+=Number(resultElement.getAttribute('hidden-word-count'));
  });
  searchContainer.setAttribute('hidden-word-count', String(hiddenCnt));
  if(gameStartInput instanceof HTMLElement){
    if(gameStartInput instanceof HTMLTextAreaElement){
      gameStartInput.value='';
    }
    gameStartInput.style.display='none';
  }
}

function checkFinish(){
  if(stats.shown >= Number(searchContainer.getAttribute('hidden-word-count'))){
    resultPage.classList.add('ggwd-result-page-shown');
    resultAnalyticsContainer.appendChild(new WordleResultAnalytics("Guessed Words/Total:", stats.discovered*100/stats.shown).generateElement());
    resultAnalyticsContainer.appendChild(new WordleResultAnalytics("Green/Total:", stats.green*100/stats.guessed).generateElement());
    resultAnalyticsContainer.appendChild(new WordleResultAnalytics("Non-Dupe/Total:", stats.nonDupe*100/stats.guessed).generateElement());
    try {
      const doConfetti=()=>{
        confetti({angle: -90, spread: 90, startVelocity: 30, shapes: ['square', confetti.shapeFromText({text: 'W'})],particleCount: 30, ticks: 300, origin: { x: Math.random(), y: 0 }})
      }
      const intervalTask=setInterval(doConfetti, 100);
      setTimeout(()=>clearInterval(intervalTask), 3000);
    }catch (e){}
  }
}
function reset(){
  if(startGameFrame instanceof HTMLElement){
    startGameFrame.classList.add('ggwd-search-start-google-page-shown');
  }
  if(searchLeft instanceof HTMLElement){
    searchLeft.innerHTML='';
  }
  if(searchRight instanceof HTMLElement){
    searchRight.innerHTML='';
  }
  if(searchContainer instanceof HTMLElement){
    searchContainer.removeAttribute('hidden-word-count');
    const searchBar = searchContainer.querySelector('.ggwd-search-bar');
    if(searchBar){
      searchBar.remove();
    }
  }
  stats.reset();
  if(gameStartInput instanceof HTMLElement){
    gameStartInput.style.removeProperty('display');
  }
  if(resultPage instanceof HTMLElement){
    resultPage.classList.remove('ggwd-result-page-shown');
  }
  if(historyList instanceof HTMLElement){
    historyList.innerHTML='';
  }
  guessedTimes=0;
  guessedWords={};
  if(resultAnalyticsContainer instanceof HTMLElement){
    resultAnalyticsContainer.innerHTML='';
  }
  if(resultPage instanceof HTMLElement){
    const searchBar = resultPage.querySelector('.ggwd-search-bar');
    if(searchBar){
      searchBar.remove();
    }
  }
  wordleData=null;
}