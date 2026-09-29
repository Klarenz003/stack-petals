// Decorative blooming-button and six-note effects from the original HTML.
export function initBlooms(rootElement) {

/* The Blooming Atelier: decorative petals, six keepsake notes and the fold-out paper book.
   Pure DOM/CSS, so these additions work even when the GSAP CDN is offline. */
(() => {
  'use strict';
  const scope = rootElement || document;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...scope.querySelectorAll('.reason-card')];
  const message = scope.querySelector('#bloom-message');
  const budRow = scope.querySelector('#bloom-buds');
  const book = scope.querySelector('#flower-book');
  const bookToggle = scope.querySelector('#flower-book-toggle');
  const foldAccess = scope.querySelector('#go-to-blooms');
  const icons = {
    flower: `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><g fill="currentColor" opacity=".85"><ellipse cx="20" cy="10.5" rx="6.8" ry="9"/><ellipse cx="29" cy="17" rx="6.8" ry="9" transform="rotate(72 29 17)"/><ellipse cx="25.5" cy="28.5" rx="6.8" ry="9" transform="rotate(144 25.5 28.5)"/><ellipse cx="14.5" cy="28.5" rx="6.8" ry="9" transform="rotate(216 14.5 28.5)"/><ellipse cx="11" cy="17" rx="6.8" ry="9" transform="rotate(288 11 17)"/></g><circle cx="20" cy="20" r="4.2" fill="#e2bb7c" stroke="#fff5d8" stroke-width="1"/></svg>`,
    star: `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 0c2.7 9.5 5 11.8 16 16-11 3-13.3 5.3-16 16C12 21.3 9.7 19 0 16 9.7 12 12 9.5 16 0Z"/></svg>`
  };
  // A single overlay is reused per burst and removed at animation end.
  function burst(el,style='subtle',point) {
    if(reduced.matches || !el) return;
    const box=el.getBoundingClientRect();
    if(!box.width || !box.height) return;
    const origin={x:point?.x ?? box.left+box.width/2,y:point?.y ?? box.top+box.height/2};
    const dialog=el.closest('dialog[open]');
    const host=dialog || document.body;
    const layer=document.createElement('div');
    layer.className='bloom-burst'+(dialog?' bloom-burst--dialog':'');
    layer.setAttribute('aria-hidden','true');
    host.appendChild(layer);
    const count=style==='grand'?24:style==='mini'?6:style==='medium'?12:9;
    for(let i=0;i<count;i++){
      const bit=document.createElement('i');
      const kind=style==='grand'?(i%5===0?'flower':i%4===0?'star':i%6===0?'leaf':'petal'):(i%5===0?'star':i%4===0?'flower':'petal');
      bit.className='bloom-bit bloom-bit--'+kind;
      bit.setAttribute('aria-hidden','true');
      if(kind==='flower' || kind==='star') bit.innerHTML=icons[kind];
      const angle= i*2.399963 + (style==='grand'?.15:.75);
      const range=style==='grand'?65+(i%7)*19:style==='medium'?38+(i%5)*18:style==='mini'?27+(i%3)*11:30+(i%5)*13;
      const fall=style==='grand'?28:14;
      const randomTilt=(i%2===0?1:-1)*((i*17)%22);
      const size=(kind==='flower'?17:kind==='star'?8:kind==='leaf'?13:11)+(i%5)*2;
      bit.style.setProperty('--x',origin.x+'px');bit.style.setProperty('--y',origin.y+'px');
      bit.style.setProperty('--dx',Math.round(Math.cos(angle)*range+randomTilt)+'px');
      bit.style.setProperty('--dy',Math.round(Math.sin(angle)*range+fall)+'px');
      bit.style.setProperty('--size',size+'px');bit.style.setProperty('--spin',((i%2?-1:1)*(130+i*29))+'deg');
      bit.style.setProperty('--dur',(style==='grand'?1220:850)+(i%6)*92+'ms');
      bit.style.setProperty('--delay',(i%4)*23+'ms');
      bit.style.setProperty('--end-scale',(.55+(i%4)*.22).toString());
      bit.addEventListener('animationend',()=>bit.remove(),{once:true});
      layer.appendChild(bit);
    }
    window.setTimeout(()=>layer.remove(),2300);
  }
  // Show handmade flowers in each note corner and keep a tiny six-bloom discovery record.
  const discovered=new Set();
  function progress() {
    if(!message) return;
    const n=discovered.size;
    message.textContent=n===6?'Your little garden is in full bloom ✿':n===0?'A little garden awaits · 0 of 6 flowers discovered':n+' of 6 flowers discovered · keep blooming';
    message.parentElement?.classList.toggle('is-complete',n===6);
    cards.forEach((card,i)=>card.classList.toggle('reason-card--discovered',discovered.has(i)));
    [...budRow.children].forEach((bud,i)=>bud.classList.toggle('is-picked',discovered.has(i)));
  }
  cards.forEach((card,i)=>{
    const front=card.querySelector('.reason-card__front');
    if(front){const mark=document.createElement('span');mark.className='floral-card-bud';mark.innerHTML=icons.flower;mark.setAttribute('aria-hidden','true');front.appendChild(mark)}
    const bud=document.createElement('span');bud.className='bloom-bud';bud.innerHTML=icons.flower;budRow?.appendChild(bud);
    card.addEventListener('click',()=>{
      const isOpen=card.getAttribute('aria-pressed')==='true';
      if(isOpen){discovered.add(i); progress();burst(card,discovered.size===6?'grand':'medium')}
      else burst(card,'mini');
    });
  });
  progress();
  // Dynamic occasion choices and gallery dots are covered by delegated bubbling events.
  scope.addEventListener('click', e=>{
    const target=e.target.closest?.('button');if(!target)return;
    if(target.matches('.reason-card'))return;
    if(target.matches('#seal-button,#open-button')){burst(target,'grand',e.detail?{x:e.clientX,y:e.clientY}:undefined);return;}
    if(target.matches('.occasion-choice')){discovered.clear();progress();burst(target,'medium');return;}
    if(target.matches('#last-button')){burst(target,'grand');return;}
    if(target.matches('#flower-book-toggle,#go-to-blooms')){burst(target,'medium');return;}
    if(target.matches('#memory-prev,#memory-next,.memory-dot,#gift360-button,#gift-spin-toggle,#gift-reset-view,#share-shop-button')){burst(target,'subtle');return;}
    if(target.matches('#music-toggle'))burst(target,'mini');
  }, true);
  // The final surprise gets its own gentle floating petals above the open modal.
  const surprise=scope.querySelector('#surprise-dialog');
  if(surprise){
    const finalBloom=new MutationObserver(()=>{
      if(surprise.open) window.setTimeout(()=>burst(scope.querySelector('#surprise-heading'),'medium'),100);
    });
    finalBloom.observe(surprise,{attributes:true,attributeFilter:['open']});
  }
  // 3D panels now wait for the center paper to finish arriving before unfolding.
  function setBook(open){book?.classList.toggle('is-unfolded',open);bookToggle?.setAttribute('aria-pressed',String(open));book?.querySelectorAll('.flower-leaf').forEach(wing=>{wing.setAttribute('aria-hidden',String(!open)); wing.inert=!open});if(bookToggle)bookToggle.textContent=open?'✿   Fold the flower pages':'✿   Unfold the flower pages'}
  setBook(false);
  bookToggle?.addEventListener('click',()=>setBook(!book.classList.contains('is-unfolded')));
  foldAccess?.addEventListener('click',()=>scope.querySelector('#reasons-section')?.scrollIntoView({behavior:reduced.matches?'auto':'smooth'}));
  scope.addEventListener('stackpetals:letter-enter',()=>{
    window.setTimeout(()=>setBook(true),reduced.matches?0:180);
  });
  if(!reduced.matches && window.matchMedia('(hover:hover) and (pointer:fine)').matches && book){
    let dragging=false,startX=0,startY=0,rx=0,ry=0;
    book.addEventListener('pointerdown',e=>{
      if(e.target.closest('button,a')||e.button!==0)return;
      dragging=true;startX=e.clientX;startY=e.clientY;book.classList.add('is-dragging');
      book.setPointerCapture?.(e.pointerId);
    });
    book.addEventListener('pointermove',e=>{
      if(!dragging)return;
      ry=Math.max(-11,Math.min(11,(e.clientX-startX)*.12));
      rx=Math.max(-8,Math.min(8,(startY-e.clientY)*.10));
      book.style.setProperty('--book-rx',rx+'deg');book.style.setProperty('--book-ry',ry+'deg');
    });
    const stop=()=>{if(!dragging)return;dragging=false;book.classList.remove('is-dragging');book.style.setProperty('--book-rx','0deg');book.style.setProperty('--book-ry','0deg')};
    book.addEventListener('pointerup',stop);book.addEventListener('pointercancel',stop);book.addEventListener('lostpointercapture',stop);
  }
})();

}
