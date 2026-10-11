"""Balance-Simulation 'Arkanum – Die Wächter von Mondfels' (Solo-Prototyp), Regeln v2.
Drei Bot-Strategien: gut (Heuristik), teuer (kauft immer die teuerste Karte), zufall.
"""
import random, statistics, sys
HP1,HP2,HP3=4,6,8

# ---------- Karten ----------
# ops: inf, atk, heal, draw, banish, cleanse(Schatten entfernen), chain_atk (wenn bereits ein Zauber gespielt),
#      atk_per_spell (je anderem Zauber, max), selfdmg, shield, killinf (Einfluss bei Feind-Kill), peek
STARTER = (
    [dict(id="funke", name="Funkenzauber", cost=0, type="Grund", inf=1)] * 7 +
    [dict(id="stab", name="Übungsstab", cost=0, type="Grund", atk=1)] * 3
)

MARKET = [
  # id, name, cost, type, effects (res = Resonanz-Bonus, wenn ≥2 Karten dieses Typs im Zug gespielt), copies
  ("licht",   "Lichtfunke",            2, "Zauber", dict(atk=1, heal=1), 4),
  ("trank",   "Kräutertrank",          3, "Objekt", dict(inf=1, heal=2), 3),
  ("kauz",    "Botenkauz",             4, "Wesen",  dict(draw=1, inf=1), 3),
  ("staub",   "Staubwedelzauber",      4, "Zauber", dict(banish=1, inf=1), 3),
  ("schild",  "Schildbann",            4, "Zauber", dict(atk=1, shield=2), 3),
  ("kristall","Glimmerkristall",       3, "Objekt", dict(inf=2), 4),
  ("kobold",  "Feuerkobold",           3, "Wesen",  dict(atk=2, selfdmg=1), 3),
  ("spiegel", "Spiegel der Weitsicht", 2, "Objekt", dict(inf=1, heal=1, peek=1), 2),
  ("regen",   "Funkenregen",           5, "Zauber", dict(atk=3), 3),
  ("foliant", "Alter Foliant",         5, "Objekt", dict(draw=2), 2),
  ("otter",   "Silberotter",           4, "Wesen",  dict(atk=1, inf=1, heal=1), 3),
  ("laeut",   "Läuterung",             5, "Zauber", dict(cleanse=1), 2),
  ("greif",   "Sturmfeder-Greif",      6, "Wesen",  dict(atk=3, killinf=1), 2),
  ("kessel",  "Goldener Kessel",       5, "Objekt", dict(inf=3), 2),
  ("bann",    "Bannkreis",             7, "Zauber", dict(atk=2, cleanse=1), 2),
  ("phiole",  "Erinnerungsphiole",     5, "Objekt", dict(inf=2, draw=1), 2),
  ("feder",   "Junger Phönix",         6, "Wesen",  dict(heal=3, draw=1, atk=1), 1),
  ("zirkel",  "Sternenzirkel",         6, "Zauber", dict(atk_per_spell=2, atk_cap=6, atk=1), 1),
  ("drache",  "Nachtschwingen-Drache", 7, "Wesen",  dict(atk=4, inf=1), 1),
  ("herz",    "Herz der Akademie",     7, "Objekt", dict(atk=2, inf=2, draw=1), 1),
]

ENEMIES = {
  1: [("irrlicht","Irrlicht-Schemen",HP1,dict(dmg=1),dict(heal=2)),
      ("spinne","Moorspinne",HP1+1,dict(discard=1),dict(inf=1,heal=1)),
      ("kraehe","Fluchkrähe",HP1+1,dict(tax=1),dict(cleanse=1))],
  2: [("wolf","Knochenwolf",HP2,dict(dmg=2),dict(heal=3)),
      ("weber","Fluchweber",HP2,dict(shadow_every=2),dict(cleanse=1,inf=1)),
      ("zehrer","Seelenzehrer",HP2+1,dict(dmg=1,noheal=1),dict(heal=4))],
  3: [("drache","Schattendrache",HP3,dict(dmg=2),dict(cleanse=2)),
      ("hexer","Graue Hexenmeisterin",HP3,dict(dmg=1,discard=1),dict(cleanse=1,heal=3))],
}
WEAK = {"irrlicht":"Zauber","spinne":"Wesen","kraehe":"Objekt","wolf":"Zauber","weber":"Wesen","zehrer":"Objekt","drache":"Zauber","hexer":"Wesen"}
WEAK_BONUS = 1
BOSS = ("fuerst","Der Namenlose Fürst",15,dict(dmg=1,shadow=1),{})

OMEN_BASE = (["fluestern"]*4 + ["stich"]*4 + ["kaelte"]*2 + ["verwirr"]*2 + ["finster"]*2 + ["pause"]*2)
OMEN_FX = dict(fluestern=dict(shadow=1), stich=dict(dmg=1), kaelte=dict(dmg=2),
               verwirr=dict(discard=1), finster=dict(shadow=1,dmg=1), pause={})

DIFF = {
  "leicht": dict(orte=[4,5,5], omen_per_ort=[1,1,1], hp_mod=0,  boss_hp=13, omen_swap=("kaelte","pause"), life=12),
  "normal": dict(orte=[4,5,5], omen_per_ort=[1,1,2], hp_mod=0,  boss_hp=16, omen_swap=None, life=10),
  "schwer": dict(orte=[4,4,5], omen_per_ort=[1,1,2], hp_mod=1,  boss_hp=16, omen_swap=None, life=10),
}
MAX_TURNS = 40
FEAT = dict(altar=True, choice=False, orte=False, regen=True, fluch=False)  # v2: Altar + Regeneration aktiv; Rest = getestete Alternativen
ALTAR_COST = 4
ALTAR_ONCE = True
TEUER_NOTFALL = True   # schematischer Bot nutzt den Altar nur im Notfall
REGEN = 2

WUT_AFTER = 3   # nach so vielen Zügen im Spiel: Feind macht +1 Schaden (Wut)
CARRY = 2       # bis zu 2 Einfluss dürfen in den nächsten Zug mitgenommen werden
STUN_SHADOW = 1


VALUE = {"licht": 1.9, "trank": 1.24, "kauz": 2.11, "staub": 2.42, "schild": 2.34, "kristall": 1.48, "kobold": 1.94, "spiegel": 1.29, "regen": 3.25, "foliant": 2.87, "otter": 2.3, "laeut": 3.36, "greif": 3.6, "kessel": 2.49, "bann": 3.72, "phiole": 3.02, "feder": 3.16, "zirkel": 3.72, "drache": 3.74, "herz": 3.69}

CHOICE_CARDS = [
  ("wandel", "Wandelkristall", 3, "Objekt", dict(opts=[dict(inf=2), dict(atk=2)]), 4),
  ("rune",   "Schutzrune",     4, "Zauber", dict(opts=[dict(atk=1, shield=3), dict(cleanse=1)]), 3),
  ("otter2", "Silberotter",    4, "Wesen",  dict(opts=[dict(atk=2, heal=1), dict(inf=2, heal=1)]), 3),
]
def market_def():
    if not FEAT["choice"]: return MARKET
    m=[x for x in MARKET if x[0] not in ("kristall","schild","otter")]
    return m+CHOICE_CARDS
VALUE.update({"wandel":1.6,"rune":2.6,"otter2":2.4,"fluch":0})
ORT_BONUS = ["Zauber","Wesen","Objekt"]   # Bibliothek: Zauber -1 Kosten · Gewächshaus: Wesen +1 Leben · Sternwarte: Objekte +1 Einfluss

class Game:
    def __init__(s, diff, policy, rng):
        s.d = DIFF[diff]; s.policy = policy; s.r = rng
        s.deck = [dict(c) for c in STARTER]; s.r.shuffle(s.deck)
        s.discard=[]; s.hand=[]
        s.life=s.d["life"]; s.maxlife=s.d["life"]
        s.ort=0; s.shadow=0
        pile=[]
        for cid,name,cost,typ,fx,n in market_def():
            for _ in range(n): pile.append(dict(id=cid,name=name,cost=cost,type=typ,**fx))
        s.r.shuffle(pile); s.mpile=pile; s.market=[s.mpile.pop() for _ in range(6)]
        omen=list(OMEN_BASE)
        if FEAT["fluch"]:
            omen[omen.index("verwirr")]="fluch"; omen[omen.index("verwirr")]="fluch"; omen[omen.index("stich")]="fluch"
        if s.d["omen_swap"]:
            a,b=s.d["omen_swap"]; omen[omen.index(a)]=b; omen[omen.index(a)]=b
        s.omen_all=omen; s.omen=list(omen); s.r.shuffle(s.omen)
        en=[]
        en += s.r.sample(ENEMIES[1],2); en += s.r.sample(ENEMIES[2],2); en += s.r.sample(ENEMIES[3],1)
        s.equeue=[dict(id=e[0],name=e[1],hp=e[2]+s.d["hp_mod"],dmg=0,fx=e[3],rew=e[4],age=0,weak=WEAK.get(e[0]),act=(1 if i<2 else 2)) for i,e in enumerate(en)]
        s.boss=dict(id=BOSS[0],name=BOSS[1],hp=s.d["boss_hp"],dmg=0,fx=BOSS[3],rew={},age=0,weak=None)
        s.saved=0
        s.active=[s.equeue.pop(0), s.equeue.pop(0)]
        s.turn=0; s.stuns=0; s.curses_added=0; s.peeked=False; s.shield=0; s.tax=0; s.noheal=False
        s.draw(5)

    def draw(s,n):
        for _ in range(n):
            if not s.deck:
                if not s.discard: return
                s.deck=s.discard; s.discard=[]; s.r.shuffle(s.deck)
            s.hand.append(s.deck.pop())

    def hurt(s,n):
        if n<=0: return
        n2=max(0,n-s.shield); s.shield=max(0,s.shield-n); s.life-=n2
        if s.life<=0:
            s.stuns+=1; s.add_shadow(STUN_SHADOW); s.life=s.maxlife
            # betäubt: halbe Hand abwerfen
            k=len(s.hand)//2
            for _ in range(k): s.discard.append(s.hand.pop(s.r.randrange(len(s.hand))))

    def add_shadow(s,n):
        if s.ort>=len(s.d["orte"]): s.lost=True; return
        s.shadow+=n
        while s.shadow>=s.d["orte"][s.ort]:
            s.shadow-=s.d["orte"][s.ort]; s.ort+=1
            if s.ort>=len(s.d["orte"]): s.lost=True; return

    def worst_card_idx(s):
        # für Abwerfen: Startkarten zuerst
        order=sorted(range(len(s.hand)),key=lambda i:(s.hand[i]["cost"], s.hand[i]["id"]!="funke"))
        return order[0]

    def run(s):
        s.lost=False
        while s.turn<MAX_TURNS:
            s.turn+=1; s.tax=0; s.noheal=False
            # 1. Omen
            for _ in range(s.d["omen_per_ort"][min(s.ort,2)]):
                if not s.omen:
                    s.omen=list(s.omen_all); s.r.shuffle(s.omen); s.add_shadow(1)
                    if s.lost: return False
                o=s.omen.pop()
                if o=="fluch":
                    s.discard.append(dict(id="fluch",name="Fluch",cost=0,type="Fluch",selfdmg=1)); s.curses_added+=1; continue
                fx=OMEN_FX[o]
                if s.peeked and o in("kaelte","finster","stich"): pass  # vereinfachte Wirkung des Spiegels: s.u.
                s.add_shadow(fx.get("shadow",0)); s.hurt(fx.get("dmg",0))
                for _ in range(fx.get("discard",0)):
                    if s.hand: s.discard.append(s.hand.pop(s.worst_card_idx()))
                if s.lost: return False
            s.peeked=False
            # 2. Feinde
            fighters=list(s.active)
            if not s.active and not s.equeue and s.boss: fighters=[s.boss]
            for e in fighters:
                f=e["fx"]; e["age"]+=1
                s.hurt(f.get("dmg",0) + (1 if e["age"]>WUT_AFTER else 0))
                if f.get("shadow"): s.add_shadow(f["shadow"])
                if f.get("shadow_every") and s.turn%f["shadow_every"]==0: s.add_shadow(1)
                for _ in range(f.get("discard",0)):
                    if s.hand: s.discard.append(s.hand.pop(s.worst_card_idx()))
                s.tax+=f.get("tax",0)
                if f.get("noheal"): s.noheal=True
                if s.lost: return False
            s.shield=0   # Schild wirkt bis einschließlich Feind-Phase des nächsten Zugs
            # 3. Aktionen
            inf=s.saved; s.saved=0; atk=0; spells=0; killinf=0; played=[]
            perspell=[]
            i=0
            # Ziehkarten zuerst spielen
            s.hand.sort(key=lambda c: -(c.get("draw",0)))
            while s.hand:
                c=s.hand.pop(0); played.append(c)
                if c.get("opts"):
                    if c["type"]=="Zauber": spells+=1
                    continue
                if FEAT["orte"]:
                    if s.ort==1 and c["type"]=="Wesen" and not s.noheal: s.life=min(s.maxlife,s.life+1)
                    if s.ort==2 and c["type"]=="Objekt": inf+=1
                if c.get("choice"):
                    opt = c["choice"][0] if (s.life<=s.maxlife-3 and not s.noheal) else c["choice"][1]
                    c2=dict(c); c2.update(opt); fx=c2
                else: fx=c
                inf+=fx.get("inf",0); atk+=fx.get("atk",0)
                if c["type"]=="Zauber":
                    if spells>0: atk+=fx.get("chain_atk",0)
                    spells+=1
                if fx.get("heal") and not s.noheal: s.life=min(s.maxlife,s.life+fx["heal"])
                if fx.get("selfdmg"): s.hurt(fx["selfdmg"])
                s.shield+=fx.get("shield",0)
                if fx.get("draw"): s.draw(fx["draw"]); s.hand.sort(key=lambda c: -(c.get("draw",0)))
                if fx.get("cleanse"): s.shadow=max(0,s.shadow-fx["cleanse"])
                if fx.get("peek"): s.peeked=True; s.peek(fx["peek"])
                killinf+=fx.get("killinf",0)
                if fx.get("atk_per_spell"): perspell.append(fx)
                if fx.get("banish"): s.do_banish(played)
            counts={}
            for c in played: counts[c["type"]]=counts.get(c["type"],0)+1
            for c in played:
                r=c.get("res")
                if r and counts.get(c["type"],0)>=2:
                    inf+=r.get("inf",0); atk+=r.get("atk",0); s.shield+=r.get("shield",0)
                    if r.get("heal") and not s.noheal: s.life=min(s.maxlife,s.life+r["heal"])
            for fx in perspell:
                atk+=min(fx["atk_cap"], fx["atk_per_spell"]*(spells-1))
            for c in played:
                if c.get("opts"):
                    o=s.choose(c, inf, atk, played)
                    inf+=o.get("inf",0); atk+=o.get("atk",0); s.shield+=o.get("shield",0)
                    if o.get("heal") and not s.noheal: s.life=min(s.maxlife,s.life+o["heal"])
                    if o.get("cleanse"): s.shadow=max(0,s.shadow-o["cleanse"])
            # Schwäche-Treffer: jede Karte des Schwäche-Typs = +1 Schaden gegen diesen Feind
            killed=[]
            for e in list(s.active):
                n=sum(1 for c in played if c["type"]==e.get("weak"))*WEAK_BONUS
                if n and e in s.active:
                    e["dmg"]+=n; e["hit"]=s.turn
                    if e["dmg"]>=e["hp"]:
                        e["dmg"]=e["hp"]; s.active.remove(e); killed.append(e)
                        if s.equeue: s.active.append(s.equeue.pop(0))
            killed+=s.attack(atk)
            if killed and killinf: inf+=killinf
            for e in killed:
                rw=e["rew"]; inf+=rw.get("inf",0)
                if not s.noheal: s.life=min(s.maxlife,s.life+rw.get("heal",0))
                s.shadow=max(0,s.shadow-rw.get("cleanse",0))
            if s.lost: return False
            if s.boss is None: return True
            if FEAT["altar"]:
                cap=s.d["orte"][min(s.ort,2)]
                uses=0
                if s.policy=="gut":
                    while inf>=ALTAR_COST and s.shadow>0 and s.shadow>=cap-2 and not (ALTAR_ONCE and uses):
                        inf-=ALTAR_COST; s.shadow-=1; uses+=1
                elif s.policy=="teuer" and TEUER_NOTFALL:
                    if inf>=ALTAR_COST and s.shadow>=cap-1: inf-=ALTAR_COST; s.shadow-=1
                elif s.policy=="zufall":
                    if inf>=ALTAR_COST and s.shadow>0 and s.r.random()<0.3: inf-=ALTAR_COST; s.shadow-=1
            s.buy(inf)
            # 4. Aufräumen
            if FEAT["regen"]:
                for e in s.active:
                    if e.get("act",1)>=2 and e.get("hit")!=s.turn: e["dmg"]=max(0,e["dmg"]-REGEN)
            s.discard+=played; s.draw(5)
            if s.mpile and s.market: s.market.pop(0); s.market.append(s.mpile.pop())  # Markt-Rotation
            if not s.active and not s.equeue and s.boss is None: return True
        return False

    def cost(s,c):
        k=c["cost"]
        if FEAT["orte"] and s.ort==0 and c["type"]=="Zauber": k=max(0,k-1)
        return k

    def choose(s,c,inf,atk,played):
        opts=c["opts"]
        if s.policy=="teuer": return opts[0]
        if s.policy=="zufall": return s.r.choice(opts)
        cap=s.d["orte"][min(s.ort,2)]
        weak={}
        for e in s.active: weak[id(e)]=sum(1 for x in played if x["type"]==e.get("weak"))
        rem=[e["hp"]-e["dmg"]-weak[id(e)] for e in s.active] or [ (s.boss["hp"]-s.boss["dmg"]) if s.boss else 99 ]
        def best_buy(budget):
            aff=[m for m in s.market if s.cost(m)+s.tax<=budget]
            return max([s.card_score(m) for m in aff], default=0)
        def val(o):
            v=0
            a=o.get("atk",0)
            if a:
                need=[r-atk for r in rem if r-atk>0]
                if need and min(need)<=a: v+=3.0
                elif not need: v+=0.1*a
                else: v+=0.7*a
            i=o.get("inf",0)
            if i: v+= 1.4*(best_buy(inf+i)-best_buy(inf)) + 0.15*i
            if o.get("cleanse"): v+= 3.0 if s.shadow>=cap-2 else (1.0 if s.shadow>0 else 0)
            sh=o.get("shield",0)
            if sh: v+= (0.9 if s.life<=4 else 0.25)*sh
            h=o.get("heal",0)
            if h: v+= (0.5 if s.life<=s.maxlife-3 else 0.05)*h
            return v
        return max(opts,key=val)

    def peek(s,n=1):
        top=[s.omen.pop() for _ in range(min(n,len(s.omen)))]
        # schädliche Omen werden abgeworfen (kommen erst nach dem Neumischen zurück)
        for o in reversed(top):
            if o=="pause": s.omen.append(o)

    def do_banish(s,played):
        allc=s.hand+s.discard
        for target in ("fluch","funke"):
            for pool in (s.hand,s.discard):
                for c in pool:
                    if c["id"]==target and (s.policy!="zufall" or s.r.random()<0.5):
                        pool.remove(c); return

    def attack(s,atk):
        killed=[]
        targets=s.active
        while atk>0 and (s.active or s.boss):
            if not s.active:
                if s.equeue: s.active.append(s.equeue.pop(0)); continue
                b=s.boss; take=min(atk,b["hp"]-b["dmg"]); b["dmg"]+=take; atk-=take
                if b["dmg"]>=b["hp"]: s.boss=None
                break
            if s.policy=="zufall":
                e=s.r.choice(s.active)
            else:
                killable=[e for e in s.active if e["hp"]-e["dmg"]<=atk]
                if killable: e=max(killable,key=lambda e:(sum(e["fx"].values()), e["hp"]))
                else: e=min(s.active,key=lambda e:e["hp"]-e["dmg"])
            take=min(atk,e["hp"]-e["dmg"]); e["dmg"]+=take; atk-=take; e["hit"]=s.turn
            if e["dmg"]>=e["hp"]:
                s.active.remove(e); killed.append(e)
                if s.equeue: s.active.append(s.equeue.pop(0))
            elif s.policy!="zufall" and atk==0: break
        if not s.active and not s.equeue and s.boss and s.boss["hp"]<=s.boss["dmg"]: s.boss=None
        return killed

    def card_score(s,c):
        v=VALUE[c["id"]]
        early = s.turn<=5
        if c["id"]=="staub":
            v+= 0.15*sum(1 for x in s.deck+s.discard+s.hand if x["id"]=="funke")
            v+= 0.6*sum(1 for x in s.deck+s.discard+s.hand if x["id"]=="fluch")
        if FEAT["orte"] and c["type"]==ORT_BONUS[min(s.ort,2)]: v+=0.35
        if FEAT["altar"] and c.get("inf"): v+=0.1*c["inf"]
        if c["id"] in("laeut","bann"):
            cap=s.d["orte"][min(s.ort,len(s.d["orte"])-1)]
            v+= 0.8*max(0, s.shadow-(cap-3)) + 0.4*s.ort
        if c["id"] in("trank","otter","feder","schild") and s.life<s.maxlife*0.6: v+=0.8
        if early and (c.get("inf") or c.get("draw")): v+=0.4
        need=[e.get("weak") for e in s.active+s.equeue[:1]]
        v+=0.45*need.count(c["type"])
        same=sum(1 for x in s.deck+s.discard+s.hand if x["type"]==c["type"])
        v+=0.05*min(same,6)
        return v

    def buy(s,inf):
        bought=0
        while True:
            tax = s.tax if bought==0 else 0
            aff=[c for c in s.market if s.cost(c)+tax<=inf]
            if not aff: break
            if s.policy=="zufall":
                if s.r.random()<0.25: break
                c=s.r.choice(aff)
            elif s.policy=="teuer":
                c=max(aff,key=lambda c:c["cost"])  # schematisch: Listenpreis
            else:
                c=max(aff,key=s.card_score)
                best_all=max(s.market,key=s.card_score)
                # Sparen: wenn eine deutlich bessere Karte nur knapp zu teuer ist
                if (s.cost(best_all)+tax>inf and s.cost(best_all)+tax-inf<=CARRY and bought==0
                        and s.card_score(best_all)-s.card_score(c)>=1.0):
                    break
                if s.card_score(c)<1.3 and s.turn>6: break
            inf-=s.cost(c)+tax; bought+=1
            s.market.remove(c); s.discard.append(c)
            if s.mpile: s.market.append(s.mpile.pop())
        s.saved=min(CARRY,inf)

def run(diff,policy,n=3000,seed=1):
    r=random.Random(seed); wins=0; turns=[]; stuns=[]
    for i in range(n):
        g=Game(diff,policy,r); w=g.run(); wins+=w
        if w: turns.append(g.turn)
        stuns.append(g.stuns)
    return wins/n, (statistics.mean(turns) if turns else 0), statistics.mean(stuns)

if __name__=="__main__":
    for d in ("leicht","normal","schwer"):
        for p in ("gut","teuer","zufall"):
            w,t,st=run(d,p)
            print(f"{d:7} {p:6} Sieg {w*100:5.1f}%  Ø Züge bis Sieg {t:4.1f}  Ø Betäubungen {st:.2f}")
