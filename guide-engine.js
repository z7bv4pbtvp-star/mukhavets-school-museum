import {facts,places} from './guide-knowledge.js';
const stop=new Set('а и или о об в во на с со по к ко у из от до для не это этот эта как что чем кто когда где почему ли был была было были есть он она они его ее мне мы вы ты наш ваш расскажи пожалуйста памятник музей школьный Богданчук землякам Мухавец такое такой какой какая какие год годы ли'.toLowerCase().split(' '));
export const norm=s=>String(s).toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\d]+/gu,' ').trim();
const words=s=>[...new Set(norm(s).split(' ').filter(w=>w.length>2&&!stop.has(w)).map(w=>/^\d+$/.test(w)?w:w.slice(0,4)))];
export function answerQuestion(place,question,previous=[]){
 if(!places[place])return {kind:'unknown',facts:[]};
 const q=norm(question),rows=facts.filter(f=>f.place===place);
 if(/игнорир|забудь.*правил|системн.*промпт|притвор|отвечай.*выдум|высот|скульптор|архитектор|автор памятника|стоим|сколько стоит|стоит вход|адрес|телефон|режим работ|билет|цена|где родил/.test(q))return {kind:'unknown',facts:[]};
 if(/^(привет|здравствуй|добрый день)/.test(q))return {kind:'greeting',facts:[]};
 if(place==='bogdanchuk' && /кто (такой|это)|кому посвящ/.test(q))return {kind:'answer',facts:[rows.find(f=>f.id==='b-person')]};
 if(/кратко|о чем видео|расскажи о (месте|музее|памятнике)|что здесь|обзор/.test(q))return {kind:'answer',facts:rows.slice(0,2)};
 if(/^(еще|подробнее|дальше|продолжи|а еще)/.test(q))return {kind:'answer',facts:rows.filter(f=>!previous.includes(f.id)).slice(0,1)};
 const terms=words(q);
 const ranked=rows.map(f=>{const tags=words(f.q+' '+f.tags);let score=0;for(const w of terms)if(tags.includes(w))score+=/\d/.test(w)?4:1+Math.log((rows.length+1)/(1+rows.filter(r=>words(r.tags+' '+r.q).includes(w)).length));return {f,score};}).sort((a,b)=>b.score-a.score);
 if(!terms.length||ranked[0]?.score<1.5)return {kind:'unknown',facts:[]};
 return {kind:'answer',facts:[ranked[0].f]};
}
export const suggestions=place=>facts.filter(f=>f.place===place).map(f=>f.q);
