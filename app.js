// Declaring DOM Elements
const form = document.getElementById("search-form");
let input = document.getElementById("search-input");
const resultCards = document.getElementById("resultCards")
const textInputs = document.getElementsByClassName("inputText");
const searchStatus = document.getElementById("searchStatus");
const resultsStatus = document.getElementById("resultsStatus");
const submitButton = document.getElementById("submitButton");
let filterButton = document.getElementById("filterButton")
let resetFilterButton = document.getElementById("resetFilter")
// let yearFilterButton = document.getElementById("yearFilterButton")
let minRating = document.getElementById("ratingFrom");
let maxRating = document.getElementById("ratingTo");
let minRelease = document.getElementById("yearFrom");
let maxRelease = document.getElementById("yearTo");
const sortOptions = document.getElementsByClassName("sortOption");

// Declaring additional variables
let numberOfPages = 1;
let titlesList = [];
let titlesToRender = [];
let allTitles = [];
let titlesCounter = 0;

/* ****************************************************
*********** HANDLING SUBMIT SEARCHING FORM ***********
**************************************************** */
//Cleaning input field when clicked
for (i=0; i<textInputs.length; i++){
    textInputs[i].addEventListener("click",function(){
        this.value = ""
    })
}

// Handle submit event
form.addEventListener('submit', function(event){
    input = document.getElementById("search-input").value;
    event.preventDefault();       
    fetchData()
});

// Handle scrolling to bottom of the page
window.onscroll = function() {
    var scrollingHeight = document.documentElement.offsetHeight - document.documentElement.clientHeight - 1;
    if (document.body.scrollTop > scrollingHeight || document.documentElement.scrollTop > scrollingHeight) {
          console.log("scrolled")
          titlesCounter += 12;
          render12Titles(titlesCounter);
  }}

// Handle filter buttons
filterButton.addEventListener("click", ()=>filterResults());
resetFilterButton.addEventListener("click", ()=>resetFilter());

// Handle sorting buttons
for (i=0; i<sortOptions.length; i++){
    let param = sortOptions[i].value
    sortOptions[i].addEventListener("change", () => sortTitles(param))
}

/* ****************************************************
*********** FUNCTIONS ***********
**************************************************** */
// Call for inputed title
async function fetchData() {
    clearResults();
    searchStatus.style.display = "block";
    submitButton.setAttribute("value", "Searching...")
    submitButton.setAttribute("disabled", true)
    const searchRes = await fetch(`http://www.omdbapi.com/?apikey=4fbc76b5&type=series&s=${input}`)
    const searchJSON = await searchRes.json();
    numberOfPages = await Math.ceil(0.1*searchJSON.totalResults)

    //Catch wrong title
    if (searchJSON.Response === "False"){        
        resultsStatus.innerHTML = "There are no TV Series with that title. Try something different.";
    }

    else{
    //Fetch to every page that exists
    for (i=1; i<numberOfPages+1; i++){            
        const pageRes = await fetch(`http://www.omdbapi.com/?apikey=4fbc76b5&type=series&s=${input}&page=${i}`)
        const pageJSON = await pageRes.json();
        for(n=0; n<pageJSON.Search.length; n++){
            await titlesList.push(pageJSON.Search[n]);  //Adding records from current page to array            
        }}
    
    //Fetch to every title
    for (let title of titlesList){
            if (title){
                const titleRes = await fetch(`http://www.omdbapi.com/?apikey=4fbc76b5&t=${title.Title}&plot=full`)
                const titleJSON = await titleRes.json();
                await allTitles.push(titleJSON)
            }
        }
    titlesToRender = await allTitles.slice()
    await renderFirst12Titles();
    }
    await submitButton.setAttribute("value", "SEARCH")
    await submitButton.removeAttribute("disabled")
    searchStatus.style.display = await "none";
}

// Clear variables when user submited another title
function clearResults(){
    titlesCounter = 0;
    titlesList = [];
    allTitles = [];
    resultCards.innerHTML = "";
    resultsStatus.innerHTML = "";
    for (i=0; i<sortOptions.length; i++){
        sortOptions[i].checked = false;
    }}

// Loop to render 12 cards
function renderFirst12Titles(){
    titlesCounter = 0;
    resultCards.innerHTML = "";
    resultsStatus.innerHTML = "";
    render12Titles(titlesCounter);
}
function render12Titles(counter){
    console.log("rendering")
    for (i=counter; i<counter+12; i++){
        if(!titlesToRender[i]){
            resultsStatus.innerHTML = "There are no more results to show.";
            break;
        }                 
        pushCard(titlesToRender[i])        
    }
    counter += 12
}

// Render single card function
function pushCard(title){
    checkTitle(title)
    var div = document.createElement("DIV");
    var divText = `
    <h3 class="cardTitle">${title.Title}</h3>
    <img src="${title.Poster}" class="cardCover">
    <p class="cardText"><b>Release date:</b> ${title.Released}</p>
    <p class="cardText"><b>Runtime:</b> ${title.Runtime}</p>`

    if (title.Ratings.length > 0){
        divText += `<p class="cardText"><b>Ratings:</b> `
        for (j=0; j<title.Ratings.length; j++){
            divText += `${title.Ratings[j].Source}: ${title.Ratings[j].Value}</br>`
        }
        divText += `</p>`
    }

    divText += `  
    <p class="cardText"><b>Description:</b> ${title.Plot}</p>`;

    
    if(title.Awards != "N/A"){
        divText += `<img src="award.png" class="awardImage">`
    }

    div.className = "resultCard"
    div.innerHTML = divText;
    resultCards.appendChild(div)
}

function checkTitle(title){
    title.Plot = title.Plot.substr(0, 96)
    title.Plot += "..."

    if(title.Released === "N/A"){
        title.Released = "Unknown."
    }
    if(title.Runtime === "N/A"){
        title.Runtime = "Unknown."
    }
    if(title.Plot === "N/A..."){
        title.Plot = "No description."
    } 
    if(title.Poster === "N/A"){
        title.Poster = "defaultcover.webp"
    }

}

// SORTING AND FILTER FUNCTIONS

function filterResults(){
    titlesToRender = allTitles.filter(filter)
    renderFirst12Titles();
}

function resetFilter(){
    titlesToRender = allTitles.slice()
    renderFirst12Titles()
}
function filter(title){
    return title.imdbRating > minRating.value 
        && title.imdbRating < maxRating.value
        && title.Year.substr(0, 4) > minRelease.value
        && title.Year.substr(0, 4) < maxRelease.value;
}

function sortTitles(param){
    if(param === "Title"){
        titlesToRender.sort(compareTitle)
    }
    else if(param === "Released"){
        titlesToRender.sort(compareDate)
    }
    else{
        titlesToRender.sort((a,b)=>{return b[param] - a[param]})
    }
    renderFirst12Titles();
}

function compareTitle(a, b){
    if(a.Title > b.Title){
        return 1;
    }
    else {
        return -1;
    }
}

function compareDate(a, b){
    if(Date.parse(a.Released) < Date.parse(b.Released)){
        return 1;
    }
    else {
        return -1;
    }
}
// If any data is missing, there should be displayed an information