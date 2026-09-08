import { useState } from "react";
export function useToast() {
  return {
    toast: (props: any) => {
      const msg = props.title? `${props.title}: ${props.description||''}` : JSON.stringify(props);
      console.log(msg);
      // حاول تستخدم toast لو موجود
      const el = document.createElement('div');
      el.textContent = msg;
      el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a25;color:white;padding:12px 16px;border-radius:12px;z-index:9999;font-size:12px;border:1px solid rgba(255,255,255,0.1);max-width:90%;';
      document.body.appendChild(el);
      setTimeout(()=> el.remove(), 3000);
    }
  };
}
