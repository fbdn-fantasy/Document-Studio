'use strict';
(()=>{const P=FTEPro;for(const name of ['Physics','Chemistry','Mathematics','Medical','Teachers'])P.tab(name);
// Earlier builds had one Science ribbon; keep any third-party commands reachable.
if(ribbons.Science){for(const b of [...ribbons.Science.children])ribbons.Physics.append(b);ribbons.Science.remove();delete ribbons.Science;}
for(const b of [...tabs.children])if(b.textContent==='Science')b.remove();
for(const name of ['File','Home','Insert','Design','Layout','Physics','Chemistry','Mathematics','Medical','Teachers','References','Review','Tools','View','Writing']){const b=[...tabs.children].find(b=>b.textContent===name);if(b)tabs.append(b);}
if(currentTab==='Science'){currentTab='Physics';Object.entries(ribbons).forEach(([n,r])=>r.hidden=n!==currentTab);}
P.applyPreferences();})();
