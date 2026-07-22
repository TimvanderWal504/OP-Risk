# Plan B — Reisopstelling zonder los kiosk-apparaat

**Hoort bij:** `functioneel-ontwerp-risk.md` §11 · **Status:** startklaar te bouwen

---

## 1. Waarom dit plan, in het kort

Geen nieuw apparaat kopen. De backend blijft altijd thuis draaien op Proxmox; onderweg wordt hij bereikbaar via een publieke HTTPS-URL, en een laptop die je toch al hebt fungeert als TV-scherm. Kosten: €0 aan nieuwe hardware. De ruil: je bent tijdens het spelen afhankelijk van je thuisverbinding en server — dat risico wordt in §5 expliciet beheerd, niet weggemoffeld.

---

## 2. Architectuur

```
[Thuis, Proxmox]                                    [Reislocatie]
┌─────────────────────────┐                          
│ LXC/Docker container     │                          
│  ├─ Postgres (Marten)    │   Tailscale Funnel        ┌──────────────┐
│  └─ .NET API + SignalR   │──────────────────────────▶│ Laptop (TV)   │
│     (serveert ook de      │  https://risk.<tailnet>  │ browser       │
│      React-frontend)      │        .ts.net           │ fullscreen    │
│                           │                          └──────────────┘
│ Tailscale daemon          │                          
└─────────────────────────┘                                  ▲
                                                               │  eigen mobiele data
                                                        ┌──────────────┐  of locatie-wifi
                                                        │ Telefoons (2-7)│
                                                        └──────────────┘
```

Kernpunt: Postgres blijft **uitsluitend intern** bereikbaar binnen de container/het Proxmox-netwerk. Funnel geeft alleen de API-poort een publiek adres, nooit de database rechtstreeks.

---

## 3. Tailscale Funnel opzetten (eenmalig)

1. **HTTPS-certificaten aanzetten** in de Tailscale-admin-console voor je tailnet (vereist voor Funnel; regelt automatisch Let's Encrypt-certificaten voor je `*.ts.net`-domein).
2. **Funnel toestaan in de tailnet-policy** (ACL-bestand) — dit staat standaard uit en moet je expliciet aanzetten voor de node die de backend host.
3. **Funnel starten op de Proxmox-host/container:**
   ```
   tailscale funnel --bg 5000
   ```
   (poort 5000 = waar je .NET API op luistert). Dit geeft een stabiele URL als `https://<hostname>.<tailnet-naam>.ts.net`.
4. **Verifiëren vanaf een netwerk dat niet je thuisnetwerk is** (bijv. mobiele data, 4G/5G uit) dat de URL écht van buitenaf bereikbaar is — dit is de test die het onderscheidt van "werkt alleen op mijn eigen wifi".

---

## 4. Beveiliging — checklist vóór je live gaat

Een publieke endpoint vraagt iets meer aandacht dan een puur lokale opstelling. Voor dit hobbyproject hoeft dat niet zwaar te zijn, maar deze punten wil je wel afvinken:

- [ ] **Rate limiting** op de join-/lobby-endpoints (ASP.NET Core's ingebouwde rate-limiting middleware, bijv. een fixed-window-limiter per IP op `/api/game/join` en verwante routes). Voorkomt dat iemand de 6-tekens gamecode kan brute-forcen of de boel kan spammen.
- [ ] **Alleen de API-poort funnelen**, expliciet controleren dat Postgres niet ergens op een publiek interface bindt (standaard-Docker-compose bindt Postgres alleen intern binnen het compose-netwerk — niet aanpassen naar `0.0.0.0` op de hostmachine).
- [ ] **Funnel alleen actief tijdens speelmomenten.** `tailscale funnel` weer uitzetten (`tailscale funnel --bg 5000 off` of via de admin-console) als je niet aan het spelen bent, beperkt het venster waarin de URL live staat. Praktisch: aan bij vertrek, uit bij thuiskomst — of gewoon aan laten als het je niet stoort, de rate limiting vangt het meeste af.
- [ ] **Gamecode blijft de enige toegangsdrempel** — met 6 alfanumerieke tekens (36⁶ ≈ 2,1 miljard combinaties) in combinatie met rate limiting is bruteforcen binnen een speelsessie onpraktisch. Geen extra login nodig voor dit doel.

---

## 5. Betrouwbaarheid — het echte risico van dit plan, en hoe je het beheert

Dit is het punt waarop Plan B eerlijk moet zijn: als je thuisserver of -internet uitvalt tijdens de reis, is er geen lokaal alternatief. Concrete mitigaties:

- **Auto-restart altijd aan:** `restart: unless-stopped` op alle containers (staat al in de compose van eerder), zodat een stroomdip of reboot van de Proxmox-host de game-container vanzelf weer opstart.
- **Proxmox-host zelf auto-boot na stroomuitval** — controleer de BIOS/UEFI-instelling "Restore on AC power loss" op de fysieke machine, zodat een korte stroomstoring thuis niet betekent dat je hele host plat blijft liggen tot je terug bent.
- **UPS voor de Proxmox-host**, als je die nog niet hebt — vangt korte stroomonderbrekingen op zonder dat de host zelfs maar herstart. Gezien je bestaande homelab-investering is dit een kleine, herbruikbare toevoeging.
- **Noodtoegang vanaf onderweg:** zorg dat je eigen telefoon Tailscale geïnstalleerd heeft en toegang heeft tot je tailnet (dit hoeft alleen voor jóu als beheerder, niet voor je medespelers). Daarmee kun je onderweg via SSH bij de Proxmox-host/container als er iets misgaat, zonder dat je iemand thuis hoeft te bellen.
- **Health-check vóór je gaat spelen:** een simpel GET-endpoint (`/health`) dat je kort voor het spel even opent op je telefoon om te bevestigen dat alles bereikbaar is, vóórdat je medespelers hun telefoon pakken.
- **Aanvaard de restrestrisico expliciet:** mocht je thuisinternet écht down zijn tijdens de reis, is er in dit plan geen lokaal vangnet. Voor een hobbyproject is dat een redelijke afweging tegenover €0 hardwarekosten — vermeld dit gewoon vooraf even aan je medespelers ("werkt het niet, dan spelen we een avondje iets anders") in plaats van het te laten verrassen.

---

## 6. Laptop als TV-scherm

- Laptop aansluiten op de TV van de locatie via HDMI (kabel + eventueel USB-C/Thunderbolt-adapter meenemen — vooraf checken welke poort je laptop heeft).
- Browser fullscreen (F11) naar de Funnel-URL.
- Geen kiosk-software, geen AP-configuratie nodig — dit is gewoon een browser die een website opent, want de aanpak uit Plan A (hostapd/dnsmasq voor een eigen wifi-netwerk) is hier niet nodig: telefoons hoeven niet met een lokaal netwerk te verbinden, ze gaan direct naar de Funnel-URL via hun eigen mobiele data of de locatie-wifi (client isolation is hier irrelevant, want er is geen lokaal verkeer nodig — alles gaat via internet naar huis).

---

## 7. Deploy- en testchecklist

**Eenmalig, ruim vóór vertrek:**
1. Backend + Postgres als docker-compose in een LXC/container op Proxmox, met `restart: unless-stopped`.
2. Tailscale + Funnel opzetten zoals §3.
3. Rate limiting toevoegen (§4) vóórdat je de URL met wie dan ook deelt.
4. Volledige testpartij spelen met de Funnel-URL, expliciet vanaf mobiele data (niet thuiswifi) om de "reis-conditie" na te bootsen.

**Direct vóór vertrek:**
5. HDMI-kabel + eventuele adapter inpakken.
6. `/health`-check vanaf mobiele data.
7. Funnel aanzetten (indien je 'm standaard uit laat staan, zie §4).

**Tijdens de reis:**
8. Tailscale-app op je eigen telefoon paraat houden voor noodtoegang.

---

## 8. Wat dit plan bewust niet doet

- Geen lokale wifi-hotspot/AP-opzet (dat is Plan A — bewaar die aanpak, mocht er later alsnog een geschikt Pi-apparaat binnen budget komen).
- Geen "plan C" voor als thuisinternet volledig uitvalt tijdens de reis — zie §5, bewust risico geaccepteerd gezien de kosteneis.
