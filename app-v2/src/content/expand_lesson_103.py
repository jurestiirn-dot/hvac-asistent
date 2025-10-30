import json
import re

# Lekcija 103 - potrebuje 10 dodatnih vprašanj
lesson_103_questions = [
    {
        "question": "Koliko delcev velikosti 0,5 mikrometra ali več je dovoljenih v razredu C pri delovanju?",
        "options": [
            "3.520 delcev na kubični meter",
            "352.000 delcev na kubični meter",
            "3.520.000 delcev na kubični meter",
            "35.200.000 delcev na kubični meter"
        ],
        "correctAnswerIndex": 2,
        "explanation": "Razred C pri delovanju dovoljuje največ 3.520.000 delcev velikosti 0,5 mikrometra ali več na kubični meter zraka. To je 1000-krat več kot pri mirovanju, kar odraža vpliv prisotnosti osebja in proizvodne dejavnosti.",
        "hint": "3,52 milijona - pri delovanju je dovoljenih veliko več delcev kot pri mirovanju."
    },
    {
        "question": "Katero mednarodno klasifikacijo ustreza razred D pri mirovanju?",
        "options": [
            "ISO 5",
            "ISO 6",
            "ISO 7",
            "ISO 8"
        ],
        "correctAnswerIndex": 3,
        "explanation": "Razred D pri mirovanju ustreza mednarodni klasifikaciji ISO 8, kar pomeni največ 3.520.000 delcev velikosti 0,5 mikrometra ali več na kubični meter. To je najnižji nivo nadzora med GMP razredi.",
        "hint": "Najnižji razred - najvišja ISO številka (8)."
    },
    {
        "question": "Kaj pomeni 'izokinetično vzorčenje' pri merjenju delcev?",
        "options": [
            "Vzorčenje pri konstantni temperaturi",
            "Vzorčenje s hitrostjo, ki ustreza hitrosti zraka",
            "Vzorčenje samo pri mirovanju",
            "Vzorčenje z visoko hitrostjo"
        ],
        "correctAnswerIndex": 1,
        "explanation": "Izokinetično vzorčenje pomeni, da hitrost vsesa zraka v merilno napravo ustreza hitrosti okoliškega zraka. To zagotavlja reprezentativno vzorčenje brez motenja naravnega toka delcev in brez artefaktov zaradi turbulenc.",
        "hint": "Enaka hitrost - merilna naprava 'sledi' hitrosti zraka."
    },
    {
        "question": "Zakaj razred D pri delovanju nima določene meje za delce?",
        "options": [
            "Ker ni pomemben",
            "Ker je spremljanje dovolj, brez specifičnih mej, glede na manj kritično naravo prostorov",
            "Ker je nemogoče meriti",
            "Ker je vedno čist"
        ],
        "correctAnswerIndex": 1,
        "explanation": "Razred D je namenjen manj kritičnim podpornim operacijam, kjer je pomembno spremljanje trendov, vendar specifične meje pri delovanju niso določene. Vendar mora biti raven delcev primerna za vrsto opravljanega dela.",
        "hint": "Manj kritični prostori - pomembnejše je spremljanje trendov kot stroge meje."
    },
    {
        "question": "Kako dolgo mora trajati vzorčenje za zajem enega kubičnega metra zraka pri pretoku vzorčenja 28,3 litra na minuto?",
        "options": [
            "Približno 5 minut",
            "Približno 15 minut",
            "Približno 35 minut",
            "Približno 60 minut"
        ],
        "correctAnswerIndex": 2,
        "explanation": "Pri pretoku 28,3 litra na minuto (kar je 1 kubična stopinja na minuto) je potrebnih približno 35 minut za vzorčenje 1.000 litrov (1 kubični meter). To je tipičen čas vzorčenja za klasifikacijo prostorov.",
        "hint": "Več kot pol ure - potrebno je zajeti 1000 litrov zraka."
    },
    {
        "question": "Katere delce je TEŽJE ujeti z HEPA filtri zaradi njihovega naključnega gibanja?",
        "options": [
            "Delce večje od 5 mikrometrov",
            "Delce okoli 0,3 mikrometra (MPPS)",
            "Delce manjše od 0,1 mikrometra",
            "Vse velikosti enako"
        ],
        "correctAnswerIndex": 1,
        "explanation": "Delci okoli 0,3 mikrometra (najbolj prodorna velikost - MPPS) so najteže ujeti, ker so preveliki za učinkovito Brownovo gibanje, hkrati pa premajhni za učinkovito prestrezanje ali vztrajnost. To je kritična velikost za preskušanje filtrov.",
        "hint": "Srednja velikost (0,3 mikrometra) - prehod med majhnimi in velikimi delci."
    },
    {
        "question": "Kaj pomeni 'razvrščanje pri delovanju' (in operation)?",
        "options": [
            "Meritev med vzdrževanjem prostorov",
            "Meritev med običajno proizvodnjo s prisotnostjo osebja in dejavnostmi",
            "Meritev med čiščenjem prostorov",
            "Meritev ponoči brez osebja"
        ],
        "correctAnswerIndex": 1,
        "explanation": "'In operation' (pri delovanju) pomeni, da se meritev izvaja med normalno proizvodno dejavnostjo s prisotnim osebjem, deluječo opremo in vsemi tipičnimi aktivnostmi. To predstavlja najslabše običajne pogoje delovanja.",
        "hint": "Običajni delovni pogoji - ljudje, oprema, aktivnosti."
    },
    {
        "question": "Koliko znaša RAZLIKA med dovoljenim številom delcev 0,5 mikrometra v razredu B pri mirovanju in pri delovanju?",
        "options": [
            "Enako število",
            "10-krat več pri delovanju",
            "100-krat več pri delovanju",
            "Približno 100-krat več pri delovanju (3.520 vs 352.000)"
        ],
        "correctAnswerIndex": 3,
        "explanation": "Razred B dovoljuje 3.520 delcev pri mirovanju in 352.000 delcev pri delovanju (velikost 0,5 mikrometra), kar je približno 100-krat več. Ta drastična razlika odraža vpliv prisotnosti osebja in dejavnosti.",
        "hint": "Stokrat več - prisotnost ljudi močno poveča število delcev."
    },
    {
        "question": "Zakaj se meri obe velikosti delcev (0,5 in 5,0 mikrometra)?",
        "options": [
            "Samo zaradi tradicije",
            "0,5 mikrometra meri splošno čistost, 5,0 mikrometra pa večje delce, ki bolj verjetno nosijo mikroorganizme",
            "Ker sta ti velikosti najlažje izmeriti",
            "Ker so drugi delci nepomembni"
        ],
        "correctAnswerIndex": 1,
        "explanation": "Delci velikosti 0,5 mikrometra so splošen indikator delčne kontaminacije, medtem ko delci 5,0 mikrometra ali večji z večjo verjetnostjo prenašajo mikroorganizme in predstavljajo neposredno mikrobiološko tveganje. Zato je njihov nadzor še bolj strog v razredih A in B.",
        "hint": "Majhni delci = splošna čistost, veliki delci = mikrobiološko tveganje."
    },
    {
        "question": "Kako pogosto se mora izvajati ponovno razvrščanje čistih prostorov?",
        "options": [
            "Samo enkrat ob začetku",
            "Vsaj enkrat letno ali po večjih spremembah",
            "Vsak mesec",
            "Samo če pride do težav"
        ],
        "correctAnswerIndex": 1,
        "explanation": "Ponovno razvrščanje (re-klasifikacija) se mora izvajati vsaj enkrat letno v skladu z dobro inženirsko prakso in po vsakršnih večjih spremembah sistema (oprema, postopki, vzdrževanje). To zagotavlja, da prostor še vedno izpolnjuje zahteve.",
        "hint": "Letno preverjanje - kot redni tehnični pregled avtomobila."
    }
]

# Preberi JSON datoteko
with open('annex1-sl.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Najdi lekcijo 103 in dodaj nova vprašanja
for lesson in data:
    if lesson['id'] == 103:
        print(f"Trenutno število vprašanj za lekcijo 103: {len(lesson['quizQuestions'])}")
        lesson['quizQuestions'].extend(lesson_103_questions)
        print(f"Novo število vprašanj: {len(lesson['quizQuestions'])}")
        break

# Shrani posodobljen JSON
with open('annex1-sl.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n✓ Lekcija 103 posodobljena - dodanih 10 vprašanj!")
