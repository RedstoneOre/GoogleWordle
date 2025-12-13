class GoogleSearchResult {
  /**@type String*/
  title=""
  /**@type String*/
  snippet=""
  /**@type String*/
  snippetExtension=""
  /**@type String*/
  about=""
  static Types=Object.freeze({recipe:"recipe", organic:"organic", localResult: "localResult", knowledgeGraph: "knowledgeGraph", question: "question"});
  type=GoogleSearchResult.Types.organic;
  static fromOrganicResults(json){
    let res=new GoogleSearchResult();
    res.title=json.title ?? "";
    res.snippet=json.snippet ?? "";
    const snippetExtensionList=((json.rich_snippet||{}).bottom||{}).extensions;
    if(snippetExtensionList instanceof Array){
      res.snippetExtension=snippetExtensionList.join("\n");
    }
    res.about=((json.about_this_result||{}).source||{}).description ?? "";
    if(
      typeof(res.title) !== "string" ||
      typeof(res.snippet) !== "string" ||
      typeof(res.snippetExtension) !== "string" ||
      typeof(res.about) !== "string"
    ){
      throw new TypeError("Construct Google search result from json failed");
    }
    res.type=this.Types.organic;
    return res;
  }
  static fromRecipeResults(json){
    let res=new GoogleSearchResult();
    res.title=json.title ?? "";
    res.about=json.source ?? "";
    const ingredients=json.ingredients;
    if(ingredients instanceof Array){
      res.snippet=ingredients.join("\n");
    }
    if(
      typeof(res.title) !== "string" ||
      typeof(res.snippet) !== "string" ||
      typeof(res.snippetExtension) !== "string" ||
      typeof(res.about) !== "string"
    ){
      throw new TypeError("Construct Google search result from json failed");
    }
    res.type=this.Types.recipe;
    return res;
  }
  static fromLocalResults(json){
    let res=new GoogleSearchResult();
    res.title=json.title ?? "";
    if(
      typeof(res.title) !== "string" ||
      typeof(res.snippet) !== "string" ||
      typeof(res.snippetExtension) !== "string" ||
      typeof(res.about) !== "string"
    ){
      throw new TypeError("Construct Google search result from json failed");
    }
    res.type=this.Types.localResult;
    return res;
  }
  static fromKnowledgeGraph(json){
    let res=new GoogleSearchResult();
    res.title=json.title ?? "";
    res.about=(json.source||{}).name ?? "";
    res.snippet=json.description ?? "";
    if(
      typeof(res.title) !== "string" ||
      typeof(res.snippet) !== "string" ||
      typeof(res.snippetExtension) !== "string" ||
      typeof(res.about) !== "string"
    ){
      throw new TypeError("Construct Google search result from json failed");
    }
    res.type=this.Types.knowledgeGraph;
    return res;
  }
  static fromQuestions(json){
    let res=new GoogleSearchResult();
    res.title=json.title ?? "";
    res.snippet=json.question ?? "";
    res.snippetExtension=json.snippet ?? "";
    if(
      typeof(res.title) !== "string" ||
      typeof(res.snippet) !== "string" ||
      typeof(res.snippetExtension) !== "string" ||
      typeof(res.about) !== "string"
    ){
      throw new TypeError("Construct Google search result from json failed");
    }
    res.type=this.Types.question;
    return res;
  }
  static of(json){
    let res=new GoogleSearchResult();
    res.title=json.title ?? res.title;
    res.snippet=json.snippet ?? res.snippet;
    res.snippetExtension=json.snippetExtension ?? res.snippetExtension;
    res.about=json.about ?? res.about;
    res.type=json.type ?? res.type;
    if(
      typeof(res.title) !== "string" ||
      typeof(res.snippet) !== "string" ||
      typeof(res.snippetExtension) !== "string" ||
      typeof(res.about) !== "string" ||
      !this.Types.hasOwnProperty(res.type)
    ){
      throw new TypeError(`Construct Google search result from saved data failed: ${JSON.stringify(res)}`);
    }
    return res;
  }

  static tokenize(str) {
    const isWordChar = ch => /[A-Za-z\-_]/.test(ch);

    let result = [];
    let buf = [];
    let bufIsWord = null;

    for (const ch of str) {
        const curIsWord = isWordChar(ch);

        if (buf.length === 0) {
            buf.push(ch);
            bufIsWord = curIsWord;
        } else if (curIsWord === bufIsWord) {
            buf.push(ch);
        } else {
            result.push({
                isWord: bufIsWord,
                token: buf.join("")
            });
            buf = [ch];
            bufIsWord = curIsWord;
        }
    }

    // 收尾
    if (buf.length > 0) {
        result.push({
            isWord: bufIsWord,
            token: buf.join("")
        });
    }

    return result;
  }

  static preservedWords={
    "a":0,"an":0,"the":0,"-": 0,
    "i":0,"me":0,"my":0,"myself":0,"we":0,"us":0,"our":0,"ourselves":0,
    "you":0,"your":0,"yours":0,"yourself":0,"yourselves":0,
    "he":0,"him":0,"his":0,"himself":0,"she":0,"her":0,"herself":0,
    "it":0,"its":"0","itself":0,"they":0,"them":"0","their":0,"themselves":0,
    "of":0,"for":0,"in":0,"at":0,"on":0,"to":0,"as":0,
    "and":0,"or":0,"not":0,
    "am":0,"is":0,"are":0,"was":0,"were":0,"will":0,"would":0,
    "etc":0,"aka":0,"defenestrate":67
  };
  /** Generate a word list HTML element
   * @param {String} text 
   */
  static generateWordList(text, wordListClass=null){
    let wordList = document.createElement('div');
    if(wordListClass) wordList.classList.add(wordListClass);
    text.split('\n').forEach(text=>{
      GoogleSearchResult.tokenize(text).forEach(e=>{
        if(e.isWord){
          const text=e.token;
          let newWord = document.createElement('a');
          newWord.innerText=text;
          const eLower = text.toLowerCase();
          newWord.setAttribute('word', eLower);
          if(!GoogleSearchResult.preservedWords.hasOwnProperty(eLower)){
            newWord.classList.add('ggwd-secret-word');
            newWord.classList.add('ggwd-secret-hidden');
          }
          wordList.appendChild(newWord);
        } else {
          wordList.appendChild(document.createTextNode(e.token));
        }
      });
      wordList.appendChild(document.createElement('br'));
    });
    return wordList;
  }

  generateElement(){
    let element=document.createElement('div');
    element.classList.add('ggwd-search-result');
    element.innerHTML=`
    <div class="ggwd-search-title-line">
      <div class="ggwd-search-title-image"></div>
      <div class="ggwd-search-title-text">
        <div class="ggwd-search-title ggwd-secret-title"></div>
        <div class="ggwd-search-title-info"></div>
      </div>
    </div>
    <div class="ggwd-search-result-theme"></div>
    <div class="ggwd-search-result-content ggwd-search-result-content-major"></div>
    <div class="ggwd-search-result-content ggwd-search-result-content-minor"></div>
    <div class="ggwd-search-result-about">
      <div class="ggwd-title ggwd-search-logo" translate="no">
        <a class="ggwd-title-blue">G</a>
        <a class="ggwd-title-red">O</a>
        <a class="ggwd-title-yellow">O</a>
        <a class="ggwd-title-blue">G</a>
        <div class="ggwd-title-tiny">
          <a class="ggwd-title-green">L</a>
          <a class="ggwd-title-red">E</a>
          WORD
        </div>
        <a>L</a>
        <a>E</a>
      </div>
      <a class="ggwd-result-type" translate="yes"></a>
      <a class="ggwd-result-state"></a>
    </div>`;
    element.querySelector('.ggwd-search-title').innerText=this.title;
    element.querySelector('.ggwd-search-title').classList.add('ggwd-secret-hidden');
    element.querySelector('.ggwd-search-title-info').appendChild(GoogleSearchResult.generateWordList(this.about));
    element.querySelector('.ggwd-search-result-theme').appendChild(GoogleSearchResult.generateWordList(this.title));
    element.querySelector('.ggwd-search-result-content-major').appendChild(GoogleSearchResult.generateWordList(this.snippet));
    element.querySelector('.ggwd-search-result-content-minor').appendChild(GoogleSearchResult.generateWordList(this.snippetExtension));
    element.querySelector('.ggwd-result-type').textContent=this.type;
    element.setAttribute('hidden-word-count', element.querySelectorAll('.ggwd-secret-word.ggwd-secret-hidden').length);
    element.setAttribute('discovered-word-count', '0');
    discoverOnResult(element, 0);
    return element;
  }
}