import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Info as InfoIcon, X } from 'lucide-react';

export function Info({children,label='About this view'}:{children:ReactNode;label?:string}) {
 const [open,setOpen]=useState(false),[pinned,setPinned]=useState(false);
 const [position,setPosition]=useState({top:12,left:12});
 const button=useRef<HTMLButtonElement>(null),popup=useRef<HTMLDivElement>(null),suppressFocus=useRef(false);
 const id=useId();
 function close(restoreFocus=false){
  setOpen(false);setPinned(false);
  if(restoreFocus){suppressFocus.current=true;button.current?.focus();queueMicrotask(()=>{suppressFocus.current=false;});}
 }
 useLayoutEffect(()=>{
  if(!open)return;
  function place(){
   if(!button.current||!popup.current)return;
   const anchor=button.current.getBoundingClientRect(),panel=popup.current.getBoundingClientRect();
   const maxTop=Math.max(12,window.innerHeight-panel.height-12);
   const top=anchor.bottom+8+panel.height<=window.innerHeight-12?anchor.bottom+8:Math.max(12,Math.min(maxTop,anchor.top-panel.height-8));
   const left=Math.max(12,Math.min(anchor.right-panel.width,window.innerWidth-panel.width-12));
   setPosition(prev=>prev.top===top&&prev.left===left?prev:{top,left});
  }
  place();const observer=new ResizeObserver(place);if(popup.current)observer.observe(popup.current);
  window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
  return()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!button.current?.contains(event.target as Node)&&!popup.current?.contains(event.target as Node))close();};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close(true);}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 useEffect(()=>{if(open&&pinned)popup.current?.querySelector<HTMLButtonElement>('.close-info')?.focus();},[open,pinned]);
 return <><button ref={button} type="button" className="info-button" aria-label={label} aria-expanded={open} aria-haspopup="dialog" aria-controls={open?id:undefined} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>{if(!pinned)setOpen(false);}} onFocus={()=>{if(!suppressFocus.current)setOpen(true);}} onBlur={()=>{if(!pinned)setOpen(false);}} onClick={()=>{if(pinned)close(true);else{setOpen(true);setPinned(true);}}}><InfoIcon size={15}/></button>{open&&createPortal(<div id={id} ref={popup} className="info-popover" role="dialog" aria-label={label} style={position}><button type="button" className="close-info" aria-label="Close information" onClick={()=>close(true)}><X size={13}/></button>{children}</div>,document.body)}</>;
}
