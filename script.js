import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

env.allowLocalModels = false;

const archives = [
  {id:1,title:"Yahoo! GeoCities",year:"1994",category:"websites",icon:"⌂",description:"A world where millions created personal homepages, digital neighborhoods and strange little corners of the web.",keywords:"personal websites homepage internet communities web 1.0 nostalgic",url:"https://en.wikipedia.org/wiki/Yahoo!_GeoCities"},
  {id:2,title:"Flash Games",year:"1996",category:"technology",icon:"▣",description:"An era of browser games, animations and interactive experiments that disappeared when Flash reached its end.",keywords:"browser games animation adobe flash gaming cartoons newgrounds",url:"https://en.wikipedia.org/wiki/Adobe_Flash"},
  {id:3,title:"MySpace",year:"2003",category:"culture",icon:"♫",description:"Custom profile pages, music discovery and a social internet before everything became algorithmic.",keywords:"social media music profiles friends internet culture social networking",url:"https://en.wikipedia.org/wiki/Myspace"},
  {id:4,title:"Netscape Navigator",year:"1994",category:"technology",icon:"◉",description:"One of the browsers that helped ordinary people discover the World Wide Web.",keywords:"browser web browsing internet software technology history",url:"https://en.wikipedia.org/wiki/Netscape_Navigator"},
  {id:5,title:"Internet Forums",year:"1990s",category:"culture",icon:"▤",description:"Digital gathering places where strangers became communities through conversations and shared interests.",keywords:"online communities discussion forums message boards conversations",url:"https://en.wikipedia.org/wiki/Internet_forum"},
  {id:6,title:"The Early Web",year:"1989",category:"websites",icon:"⌘",description:"The beginning of a connected world, when the first websites transformed how humans shared information.",keywords:"world wide web internet history first website CERN Tim Berners-Lee",url:"https://info.cern.ch/"},
  {id:7,title:"Internet Relay Chat",year:"1988",category:"culture",icon:"⌁",description:"Real-time text communities where people met in channels long before modern group chats.",keywords:"IRC chat rooms instant messaging online communities",url:"https://en.wikipedia.org/wiki/Internet_Relay_Chat"},
  {id:8,title:"Winamp",year:"1997",category:"technology",icon:"♫",description:"A customizable music player remembered for skins, visualizers and the early digital music era.",keywords:"music player software mp3 skins media player",url:"https://en.wikipedia.org/wiki/Winamp"}
];

const grid=document.querySelector("#archiveGrid");
const input=document.querySelector("#searchInput");
const form=document.querySelector("#searchForm");
const button=document.querySelector("#searchBtn");
const count=document.querySelector("#archiveCount");
const info=document.querySelector("#resultsInfo");
const status=document.querySelector("#systemStatus");
let activeFilter="all", extractorPromise=null, embeddings=null;

function render(items){
  grid.replaceChildren();
  count.textContent=`${String(items.length).padStart(2,"0")} DISCOVERIES`;
  if(!items.length){
    const empty=document.createElement("div");empty.className="empty";
    empty.innerHTML="<h3>NO SIGNAL FOUND</h3><p>Try another search to explore the digital graveyard.</p>";
    grid.append(empty);return;
  }
  items.forEach(item=>{
    const card=document.createElement("article");card.className="card";
    const top=document.createElement("div");top.className="card-top";
    const icon=document.createElement("span");icon.className="card-icon";icon.textContent=item.icon;
    const year=document.createElement("span");year.className="card-year";year.textContent=item.year;
    top.append(icon,year);
    const cat=document.createElement("div");cat.className="card-category";cat.textContent=item.category.toUpperCase();
    const title=document.createElement("h3");title.textContent=item.title;
    const desc=document.createElement("p");desc.textContent=item.description;
    const link=document.createElement("a");link.className="card-link";link.textContent="EXPLORE REFERENCE ↗";link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";
    card.append(top,cat,title,desc,link);grid.append(card);
  });
}
function filterArchives(){
  render(activeFilter==="all"?archives:archives.filter(x=>x.category===activeFilter));
  info.textContent="SHOWING THE REMAINS OF THE OLD INTERNET";
}
document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");activeFilter=btn.dataset.filter;input.value="";filterArchives();
}));
function cosine(a,b){let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return dot/(Math.sqrt(aa)*Math.sqrt(bb));}
function keywordSearch(query){
  const words=query.toLowerCase().split(/\s+/).filter(Boolean);
  return archives.map(item=>({item,score:words.reduce((s,w)=>s+(`${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(w)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.item);
}
async function getModel(){
  if(!extractorPromise){
    status.textContent="DOWNLOADING AI MODEL";
    extractorPromise=pipeline("feature-extraction","Xenova/all-MiniLM-L6-v2");
  }
  return extractorPromise;
}
async function runSearch(){
  const query=input.value.trim();
  if(!query){activeFilter="all";document.querySelector('[data-filter="all"]').classList.add("active");filterArchives();return;}
  button.disabled=true;button.textContent="SEARCHING...";info.textContent="AWAKENING THE DIGITAL ARCHIVE...";
  try{
    const model=await getModel();
    status.textContent="OPEN MODEL ACTIVE";
    if(!embeddings){
      embeddings=[];
      for(const item of archives){
        const out=await model(`${item.title}. ${item.description}. ${item.keywords}`,{pooling:"mean",normalize:true});
        embeddings.push(out.data);
      }
    }
    const q=await model(query,{pooling:"mean",normalize:true});
    const ranked=archives.map((item,i)=>({item,score:cosine(q.data,embeddings[i])})).sort((a,b)=>b.score-a.score);
    const results=ranked.filter(x=>x.score>0.12).map(x=>x.item);
    render(results);
    info.textContent=`AI SEMANTIC SEARCH / ${results.length} RELEVANT DISCOVERIES`;
  }catch(err){
    console.error(err);render(keywordSearch(query));
    info.textContent="KEYWORD FALLBACK / AI MODEL COULD NOT LOAD";
    status.textContent="FALLBACK SEARCH ACTIVE";
  }finally{button.disabled=false;button.textContent="EXPLORE ↗";}
}
form.addEventListener("submit",e=>{e.preventDefault();runSearch();});
render(archives);
console.log("LOST.INTERNET ready — open-source semantic search initialized.");
