# Hups! — Vercel-versio 28

102 pientä taitopeliä. Versio 23: 10 sekunnin vastausaika, muistitehtävien uusinta, liikkuvat pallot ja kohteet, yllätysilmapallo, numeropallot, kaverichatti ja voittajan voltti.
Tämä on erillinen vientipaketti Verceliin. Nykyinen ChatGPT Sites -peli säilyy ennallaan.

## 1. Vie GitHubiin

Pura ZIP koneella. Avaa tyhjä MAMV-Studio/hups-repositorio ja paina
**uploading an existing file**. Vedä tämän hakemiston SISÄLTÖ latausalueelle
(app, public, server, supabase, tests sekä juuritason tiedostot).
Älä lataa ZIP-tiedostoa sellaisenaan äläkä ylimääräistä hups-vercel-kansiota.
package.json ja package-lock.json kuuluvat repositorion juureen. Vahvista **Commit changes**.

## 2. Luo Hupsin tietokanta

Luo Supabaseen uusi projekti nimellä Hups. Käytä Hupsin omia asetuksia.
Avaa SQL Editor ja suorita supabase/setup.sql-tiedoston koko sisältö.
Se luo huoneiden tallennuksen sekä estää selainten suoran pääsyn pelihuoneiden tietoihin.
Koodi käyttää tietokantaa vain Vercelin palvelimelta. Pelaajan oma tunniste ei palaudu muille pelaajille.

## 3. Tuo Verceliin

Vercel > Add New > Project > Import MAMV-Studio/hups.
Project name: hups (tai vapaa nimi). Framework: Next.js. Root Directory: ./.
Node.js: 22.x. Build Command: npm run build. Install Command: npm ci.
Output Directory: oletus. Lisää Environment Variables -kohtaan:

| Nimi | Arvo |
| --- | --- |
| SUPABASE_URL | Hups-projektin Project URL |
| SUPABASE_SECRET_KEY | Hups-projektin secret API key (sb_secret_...) |

Avaimet löytyvät Supabasen projektin Connect-valikosta / Settings > API Keys.
Secret key kuuluu vain Vercelin palvelinasetuksiin. Älä lisää sitä GitHubiin,
NEXT_PUBLIC_-alkuiseen muuttujaan, kuvakaappaukseen tai keskusteluun.
Laita asetukset Production- ja tarvittaessa Preview-ympäristöihin.
Paina Deploy. Jos lisäät muuttujat vasta käyttöönoton jälkeen, tee Redeploy.

## 4. Tarkista molemmilla laitteilla

1. Avaa uusi Vercel-osoite puhelimella ja pelaa yksi oma kierros.
2. Luo kaveripeli ja liity toisella laitteella samalla uudella osoitteella.
3. Aloita peli ja tarkista molempien pisteet tehtävien jälkeen.
4. Pelaa loppuun, ehdota uutta kierrosta ja hyväksy toisella laitteella.
5. Tarkista, että sama nelinumeroinen koodi säilyy ja pisteet alkavat nollasta.

Aiemman palvelun kesken olevat huoneet eivät siirry uuteen tietokantaan.
Luo ensimmäinen kaveripeli Vercelissä uudella koodilla. Pelaajat eivät tarvitse ChatGPT-tunnuksia.

## Päivitykset

Vercel julkaisee jatkossa tähän GitHub-repositorioon viedyt päivitykset automaattisesti.
ChatGPT Sites -pelin muokkaaminen ei yksin päivitä tätä erillistä repositoriota.
Uusissa päivityksissä käytetään jatkossa tämän Vercel-version lähdekoodia.

## Paikallinen kehitys

Node.js 22.13 tai uudempi. Kopioi .env.example nimelle .env.local ja täytä oman
Hups-projektin tiedot. npm ci, npm run dev. npm run build tekee tuotantokäännöksen.
npm test tarkistaa tehtävät, pisteytyksen, pelihuoneet ja tietokantasovittimen.

## Toteutus ja tarkistus

Next.js App Router + React. Vinext/Cloudflare Workers -riippuvuudet poistettu.
Kaveripelin tilat säilyvät Supabasen Postgres-tietokannassa, eivät Vercelin
palvelimen muistissa. Rinnakkaiset pistepäivitykset käyttävät revision tarkistusta,
jotta toisen pelaajan päivitys ei katoa. Huonekoodi kierrätetään vasta 24 tunnin jälkeen.
Käyttöliittymän versio 28, yhteispeliprotokolla 20. Katso PAIVITYS-26.txt.

Tuotantokäännös ja mukana olevat testit tarkistettu. Todellinen Supabase-yhteys
ja kahden puhelimen käyttöönotto tarkistetaan, kun omat palveluasetukset on lisätty.
Rekisteröitymistä, voittotilastoja ja ylläpitäjän tehtävävalintaa ei ole tässä viennissä lisätty.

Lähteet käyttöönotolle:
- https://vercel.com/docs/git
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
