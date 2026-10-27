# Builds lines.json: every spoken line in the game (unique clips) + which game ids use each clip.
import json, re

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
def two(n):
    if n < 20: return ONES[n]
    return TENS[n//10] + ("-" + ONES[n%10] if n%10 else "")
def indian_words(n):
    if n == 0: return "zero"
    parts = []
    for val, name in ((10**7, "crore"), (10**5, "lakh"), (1000, "thousand"), (100, "hundred")):
        if n >= val:
            parts.append(f"{two(n//val) if n//val < 100 else indian_words(n//val)} {name}")
            n %= val
    if n: parts.append(two(n))
    return " ".join(parts)

def bigger(a, b):
    f = lambda s: int(s.replace(",", ""))
    return a if f(a) > f(b) else b
def fmt_indian(s):
    if len(s) <= 3: return s
    rest, groups = s[:-3], []
    while len(rest) > 2: groups.insert(0, rest[-2:]); rest = rest[:-2]
    if rest: groups.insert(0, rest)
    return ",".join(groups) + "," + s[-3:]
def code_answer(digits, goal):
    d = sorted(digits, reverse=(goal == "biggest"))
    if goal == "smallest" and d[0] == 0:
        k = next(i for i, x in enumerate(d) if x != 0); d[0], d[k] = d[k], d[0]
    return "".join(map(str, d))

L = []   # (clip_id, who, text, [game ids], where)
def add(clip, who, text, ids=None, where=""):
    L.append(dict(clip=clip, who=who, text=text, ids=ids or [clip], where=where))

add("cover_title", "Title", "Pikoo's... Locked-Up Snacks!", where="Cover")
add("s1_narrator", "Narrator", "At the Shellfish Cafe, somebody has locked the snack cupboard... And the café needs to be opened for the day!", where="Story 1")
add("s2_shells", "Mr. Shells", "Someone locked away all the snacks. Who was it?", where="Story 2")
add("s2_pikoo", "Pikoo", "Wasn't me! ...Probably.", where="Story 2")
add("s3_neeli", "Neeli", "There are three locks... that means we have to solve all three levels to open up the snack shelf and to find out WHO locked the snacks.", where="Story 3")
# Lock 1
add("howto_pikoo", "Pikoo", "Seven little pins. Tap the bigger number and a pin pops loose!", where="Lock 1 how-to")
add("instruction", "Neeli", "Tap the bigger number - a pin pops loose.", where="Lock 1 instruction")
add("wrong_1", "Neeli", "Oops! Try Again.", where="All locks, 1st wrong")
add("wrong_2_hint", "Neeli", "Count the digits first. Same length? Then compare the digits from the left until they are different.", where="Lock 1, 2nd wrong")
add("idle", "Neeli", "Take your time - tap the one you think is right.", where="All locks, idle 10 s")
L1 = [(['6,540','48,210'],'Pikoo','Pop! First pin open - easy!'),(['53,924','57,282'],'Neeli','Same length - you checked the front. Good.'),
      (['46,180','46,310'],'Pikoo','Another one loose!'),(['9,990','12,040'],'Neeli','The big 9 did not fool you. Nice.'),
      (['89,999','90,000'],'Pikoo','So close - but you got it!'),(['1,05,789','1,05,698'],'Pikoo','Whoa, a six-digit one - pop!'),
      (['1,20,467','1,20,728'],'Neeli','Last pin. Lock one is open!')]
for i,(nums,who,t) in enumerate(L1,1): add(f"l{i}_correct", who, t, where=f"Lock 1 pin {i} correct")
for i,(nums,who,t) in enumerate(L1,1): add(f"l{i}_hand", "Neeli", f"The bigger one is {bigger(*nums)} - tap it.", where=f"Lock 1 pin {i}, 3rd wrong")
# Shelf scenes
add("l1_done_neeli","Neeli","Bravo!! One lock down.", where="Shelf after lock 1")
add("l1_done_pikoo","Pikoo","Yayy!! Two more to go!", where="Shelf after lock 1")
add("l2_done_neeli","Neeli","Biggest and smallest, every time. One lock left.", where="Shelf after lock 2")
add("l2_done_pikoo","Pikoo","Whoever locked this really cares about snacks, huh...", where="Shelf after lock 2")
# Lock 2
add("l2_howto_pikoo","Pikoo","Make it the BIGGEST!", where="Lock 2 how-to")
add("l2_howto_neeli","Neeli","...and the smallest. This lock wants BOTH.", where="Lock 2 how-to")
HB="Biggest digit in front, then the next biggest."; HS="Smallest digit in front, then the next smallest."; HZ="Smallest digit in front - but 0 cannot lead!"
CODES=[([5,2,8,1],'biggest',0,'Pikoo',HB,'Pikoo','Biggest - nice and tall!'),([5,2,8,1],'smallest',0,'Neeli',HS,'Neeli','And the smallest. Both - that is how it likes it.'),
       ([4,0,7,3],'biggest',0,'Pikoo',HB,'Pikoo','Biggest again!'),([4,0,7,3],'smallest',0,'Neeli',HZ,'Neeli','Smallest - and you kept 0 out of the front. Sharp.'),
       ([6,2,9,5,1],'biggest',0,'Pikoo',HB,'Pikoo','Five shells - biggest, done!'),([6,2,9,5,1],'smallest',0,'Neeli',HS,'Pikoo','Smallest, snug!'),
       ([7,0,4,2,9,1],'biggest',1,'Pikoo',HB,'Neeli','The master code - a whole lakh. Keypad is open!')]
for i,(d,g,m,who,h,fw,ft) in enumerate(CODES,1):
    what = ('BIGGEST (MASTER)' if m else 'BIGGEST') if g=='biggest' else 'SMALLEST'
    add(f"l2_code{i}", who, f"Make the {what} number from these shells: {', '.join(map(str,d))}. Drag them into the windows, then press Enter.", where=f"Lock 2 code {i}")
for i,c in enumerate(CODES,1): add(f"l2_code{i}_correct", c[5], c[6], where=f"Lock 2 code {i} correct")
add("l2_hint_big","Neeli",HB,[f"l2_code{i}_hint" for i in (1,3,5,7)], where="Lock 2 hint (biggest)")
add("l2_hint_small","Neeli",HS,[f"l2_code{i}_hint" for i in (2,6)], where="Lock 2 hint (smallest)")
add("l2_hint_zero","Neeli",HZ,["l2_code4_hint"], where="Lock 2 hint (code 4)")
for i,c in enumerate(CODES,1): add(f"l2_code{i}_hand","Neeli",f"Set it like this - {fmt_indian(code_answer(c[0],c[1]))}. Then press Enter.", where=f"Lock 2 code {i}, 3rd wrong")
# Lock 3
add("l3_howto_neeli","Neeli","This locker has seven shell-shaped bulbs. Arrange each set of numbers in order and one shell-bulb lights up.", where="Lock 3 how-to")
ORD=['asc','asc','asc','desc','desc','asc','desc']
add("l3_instr_asc","Neeli","Arrange the numbers in ascending order (smallest to biggest). Tap them in order - each correct one lights a shell-bulb on the locker.",[f"l3_bulb{i}" for i,o in enumerate(ORD,1) if o=='asc'], where="Lock 3 bulbs 1,2,3,6")
add("l3_instr_desc","Neeli","Arrange the numbers in descending order (biggest to smallest). Tap them in order - each correct one lights a shell-bulb on the locker.",[f"l3_bulb{i}" for i,o in enumerate(ORD,1) if o=='desc'], where="Lock 3 bulbs 4,5,7")
FB3=[('Pikoo','Small to big - first shell-bulb lights up!'),('Neeli','Same digits - but you read past the front. Good.'),('Pikoo','Another shell-bulb glows!'),
     ('Neeli','Now big to small - clean.'),('Pikoo','The lakh ones - in order!'),('Pikoo','Almost there - nearly all lit!'),('Neeli','Last shell-bulb - they all glow now!')]
for i,(w,t) in enumerate(FB3,1): add(f"l3_bulb{i}_correct", w, t, where=f"Lock 3 bulb {i} correct")
add("l3_hint_asc","Neeli","Find the smallest number still out, and tap that next.",[f"l3_bulb{i}_hint" for i,o in enumerate(ORD,1) if o=='asc'], where="Lock 3 hint (ascending)")
add("l3_hint_desc","Neeli","Find the biggest number still out, and tap that next.",[f"l3_bulb{i}_hint" for i,o in enumerate(ORD,1) if o=='desc'], where="Lock 3 hint (descending)")
add("l3_hand","Neeli","This one comes next.",[f"l3_bulb{i}_hand" for i in range(1,8)], where="Lock 3, 3rd wrong")
add("finale_narrator","Narrator","The last shell-bulb lights up - all seven shell-bulbs glow and the locker clicks open; a note flies down.", where="Lock 3 finale")
# Ending
add("end_neeli_read","Neeli","'Snacks arranged and locked. - Pikoo.' It was you, Pikoo!", where="Ending")
add("end_pikoo","Pikoo","OH. Right! I organised them this morning... and locked them... and forgot. Heh.", where="Ending")
add("end_shells","Mr. Shells","The cafe is saved!", where="Ending")
add("end_narrator","Narrator","Bravo! The cafe can finally open. The doors swing open and a happy crowd of sea-creatures walks in for their snacks!", where="Ending")

def spoken(t):
    t = re.sub(r"\d+(?:,\d+)*", lambda m: indian_words(int(m.group().replace(",",""))) if "," in m.group() else ONES[int(m.group())] if len(m.group())==1 else indian_words(int(m.group())), t)
    return t
for l in L: l["spoken_en"] = spoken(l["text"])
json.dump(L, open("lines.json","w"), ensure_ascii=False, indent=1)
tot = sum(len(l["spoken_en"]) for l in L)
from collections import Counter
print("clips", len(L), "game ids", sum(len(l["ids"]) for l in L), "chars", tot)
print(Counter(l["who"] for l in L))
for l in L: print(f'{l["clip"]}|{l["who"]}|{l["text"]}|{len(l["ids"])}|{l["spoken_en"] if l["spoken_en"]!=l["text"] else ""}')
