class WordleResultAnalytics {
  /** Title
   * @type {String}
   * */
  title=null;
  /** Progress, percentage
   * @type {Number}
   * */
  value=null;
  constructor(title, value){
    if(
      !title instanceof String ||
      !value instanceof Number
    ){
      throw TypeError();
    }
    this.title=title;
    this.value=value;
  }
  generateElement(){
    const result = document.createElement('div');
    result.classList.add('ggwd-result-analytics-content');

    const name = document.createElement('b');
    name.innerText=this.title;
    name.classList.add('ggwd-result-analytics-name');
    result.appendChild(name);
    
    const bar = document.createElement('div');
    bar.classList.add('ggwd-result-analytics-bar');
    const percentage = document.createElement('div');
    percentage.classList.add('ggwd-result-analytics-percentage');
    percentage.innerText = `${this.value}%`;
    const progress = document.createElement('div');
    progress.classList.add('ggwd-result-analytics-progress');
    progress.style.setProperty("--ggwd-result-progress", `${this.value}%`);
    bar.appendChild(percentage);
    bar.appendChild(progress);
    result.appendChild(bar);

    return result;
  }
}