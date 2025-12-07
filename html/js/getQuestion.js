function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return str;
  const d = document.createElement('div');
  d.innerHTML = str;
  return d.textContent;
}
async function getQuestion(){
  return decodeHtmlEntities(
    (await
    (await fetch('https://opentdb.com/api.php?amount=1')).json())
    .results[0].question);
}