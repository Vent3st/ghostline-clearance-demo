#!/usr/bin/env python3
"""
Generate the hackathon demo's fictional subject corpus.

Purpose
    Build `data/subjects/<slug>/person.v1-broad.json` for all 30 demo subjects with
    richly populated, internally consistent records. Every value is INVENTED. No
    field is copied from any real source; this script reads no external data.

    The network is designed, not random. In `lib/graph.ts` a node id is
    `a:<addressHash>`, `t:<phoneNumber>` and `p:<entityId>`, and the graph keeps
    only nodes that bridge two or more anchors. So subjects are connected by:
      * a shared family-home `addressHash`,
      * a shared family landline `phoneNumber`,
      * a shared prior address between two families (former roommates),
      * `relativesSummary[].entityId` pointing at ANOTHER SUBJECT's `entityId`,
        which merges the two into a single person node.
    Cities are drawn only from the `CITY_ADJ` keys in `lib/report.ts`, so the
    critical-adjacency section resolves real sites for every subject.

Usage
    python3 scripts/generate_sample_data.py [--dry-run]

Safety
    Refuses to overwrite any file that is not marked `"_mock": true`. A file
    without that marker is left alone and reported, so this can never write over
    real data.

Dependencies
    Python 3.9+, standard library only.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import random
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "subjects"

# --- roster -----------------------------------------------------------------
# (slug, alias, nick, codename, initials) — aliases/codenames match the console.
ROSTER = [
    ("demo-marcus-reyes",   "Marcus Reyes",    "Cash",    "GL-4A1",  "MR"),
    ("demo-elena-marlowe",  "Elena Marlowe",   "Lark",    "GL-4A2",  "EM"),
    ("demo-trevor-osborne", "Trevor Osborne",  "Ozzy",    "GL-4A3",  "TO"),
    ("avery-okafor",        "Avery Okafor",    "Echo",    "GL-965B", "AO"),
    ("cameron-sorensen",    "Cameron Sorensen","Aster",   "GL-3A1C", "CS"),
    ("devon-brandt",        "Devon Brandt",    "Mesa",    "GL-76CA", "DB"),
    ("devon-holloway",      "Devon Holloway",  "Cobalt",  "GL-DA8E", "DH"),
    ("drew-ferro",          "Drew Ferro",      "Ridge",   "GL-E83C", "DF"),
    ("elliot-cardoza",      "Elliot Cardoza",  "Ember",   "GL-0F3A", "EC"),
    ("elliot-winslow",      "Elliot Winslow",  "Onyx",    "GL-BE0F", "EW"),
    ("frankie-amara",       "Frankie Amara",   "Cove",    "GL-DF64", "FA"),
    ("hayden-amara",        "Hayden Amara",    "Harbor",  "GL-5938", "HA"),
    ("hayden-ferro",        "Hayden Ferro",    "Tally",   "GL-2752", "HF"),
    ("hayden-okafor",       "Hayden Okafor",   "Echo",    "GL-A4DF", "HO"),
    ("jordan-calloway",     "Jordan Calloway", "Harbor",  "GL-973F", "JC"),
    ("jordan-ferro",        "Jordan Ferro",    "Vesper",  "GL-E252", "JF"),
    ("jordan-sorensen",     "Jordan Sorensen", "Ridge",   "GL-97B6", "JS"),
    ("kit-amara",           "Kit Amara",       "Drift",   "GL-954E", "KA"),
    ("lane-delacroix",      "Lane Delacroix",  "Halcyon", "GL-45E3", "LD"),
    ("lane-nakamura",       "Lane Nakamura",   "Mesa",    "GL-779F", "LN"),
    ("lane-nakamura-77b5",  "Lane Nakamura",   "Onyx",    "GL-77B5", "LN"),
    ("marlow-amara",        "Marlow Amara",    "Ember",   "GL-A622", "MA"),
    ("marlow-ferro",        "Marlow Ferro",    "Cobalt",  "GL-D826", "MF"),
    ("marlow-holloway",     "Marlow Holloway", "Echo",    "GL-F120", "MH"),
    ("parker-sorensen",     "Parker Sorensen", "Cipher",  "GL-BCF8", "PS"),
    ("quinn-winslow",       "Quinn Winslow",   "Halcyon", "GL-057D", "QW"),
    ("reese-brandt",        "Reese Brandt",    "Mesa",    "GL-8304", "RB"),
    ("riley-rivas",         "Riley Rivas",     "Ghost",   "GL-E335", "RR"),
    ("skyler-brandt",       "Skyler Brandt",   "Halcyon", "GL-3DF6", "SB"),
    ("wren-sabin",          "Wren Sabin",      "Harbor",  "GL-4653", "WS"),
]

# --- geography: only CITY_ADJ keys, so adjacency always resolves -------------
CITIES = {
    "austin":     ("Austin", "TX", ["78703", "78702", "78745"],
                   ["Rainey St", "E 6th St", "S Congress Ave", "Barton Springs Rd"]),
    "round rock": ("Round Rock", "TX", ["78664", "78681"],
                   ["Sunrise Rd", "Gattis School Rd", "Mays St"]),
    "el paso":    ("El Paso", "TX", ["79912", "79936"],
                   ["Mesa St", "Montana Ave", "Airway Blvd"]),
    "arlington":  ("Arlington", "VA", ["22201", "22203"],
                   ["Wilson Blvd", "Clarendon Blvd", "N Glebe Rd"]),
    "bethesda":   ("Bethesda", "MD", ["20814", "20817"],
                   ["Old Georgetown Rd", "Wisconsin Ave", "Bradley Blvd"]),
    "norfolk":    ("Norfolk", "VA", ["23510", "23518"],
                   ["Granby St", "Hampton Blvd", "Colley Ave"]),
    "houston":    ("Houston", "TX", ["77002", "77007"],
                   ["Westheimer Rd", "Washington Ave", "Kirby Dr"]),
}

# family -> (home city key, second city key, profession key, surname)
FAMILIES = {
    "Amara":     ("el paso",   "austin",     "military",           [("frankie-amara", "sibling"), ("hayden-amara", "sibling"), ("kit-amara", "child"), ("marlow-amara", "parent")]),
    "Ferro":     ("norfolk",   "arlington",  "defense_dod",        [("drew-ferro", "parent"), ("hayden-ferro", "sibling"), ("jordan-ferro", "sibling"), ("marlow-ferro", "child")]),
    "Brandt":    ("arlington", "bethesda",   "government",         [("devon-brandt", "parent"), ("reese-brandt", "sibling"), ("skyler-brandt", "child")]),
    "Sorensen":  ("austin",    "round rock", "it_cyber",           [("cameron-sorensen", "parent"), ("jordan-sorensen", "sibling"), ("parker-sorensen", "child")]),
    "Okafor":    ("bethesda",  "norfolk",    "healthcare_rn",      [("avery-okafor", "parent"), ("hayden-okafor", "child")]),
    "Nakamura":  ("houston",   "austin",     "aviation",           [("lane-nakamura", "parent"), ("lane-nakamura-77b5", "child")]),
    "Winslow":   ("round rock","austin",     "real_estate",        [("elliot-winslow", "parent"), ("quinn-winslow", "child")]),
    "Holloway":  ("austin",    "houston",    "legal",              [("devon-holloway", "parent"), ("marlow-holloway", "child")]),
    "Cardoza":   ("houston",   "round rock", "plumbing",           [("elliot-cardoza", "parent")]),
    "Calloway":  ("arlington", "norfolk",    "hedge_fund",         [("jordan-calloway", "parent")]),
    "Delacroix": ("norfolk",   "bethesda",   "aviation",           [("lane-delacroix", "parent")]),
    "Rivas":     ("el paso",   "houston",    "military",           [("riley-rivas", "parent")]),
    "Sabin":     ("bethesda",  "arlington",  "government",         [("wren-sabin", "parent")]),
    "Reyes":     ("austin",    "houston",    "financial_broker",   [("demo-marcus-reyes", "parent")]),
    "Marlowe":   ("austin",    "round rock", "investment_adviser", [("demo-elena-marlowe", "parent")]),
    "Osborne":   ("austin",    "round rock", "real_estate",        [("demo-trevor-osborne", "parent")]),
}

# Cross-family bridges: pairs of subjects who shared a prior address (roommates).
ROOMMATES = [
    ("demo-marcus-reyes", "cameron-sorensen", "austin"),
    ("demo-elena-marlowe", "elliot-winslow", "round rock"),
    ("demo-trevor-osborne", "devon-holloway", "austin"),
    ("hayden-amara", "riley-rivas", "el paso"),
    ("drew-ferro", "lane-delacroix", "norfolk"),
    ("devon-brandt", "jordan-calloway", "arlington"),
    ("avery-okafor", "wren-sabin", "bethesda"),
    ("lane-nakamura", "elliot-cardoza", "houston"),
    ("jordan-sorensen", "quinn-winslow", "austin"),
    ("marlow-ferro", "skyler-brandt", "arlington"),
]

CARRIERS = [("Verizon Wireless", "Wireless"), ("AT&T Mobility", "Wireless"),
            ("T-Mobile USA", "Wireless"), ("Google Fi", "Wireless"),
            ("Comcast Phone", "LandLine"), ("Bandwidth.com", "VOIP"),
            ("Spectrum Voice", "LandLine")]

MAIL = ["example.com", "example.net", "example.org"]

# profession per subject — mirrors lib/licensing.ts OVERRIDE
ROLE_BY_SLUG = {
    "demo-marcus-reyes": "financial_broker", "demo-elena-marlowe": "investment_adviser",
    "demo-trevor-osborne": "real_estate",
    "frankie-amara": "military", "hayden-amara": "defense_dod", "kit-amara": "it_cyber",
    "marlow-amara": "government", "drew-ferro": "military", "hayden-ferro": "aviation",
    "jordan-ferro": "defense_dod", "marlow-ferro": "it_cyber", "devon-brandt": "government",
    "reese-brandt": "defense_dod", "skyler-brandt": "legal", "cameron-sorensen": "it_cyber",
    "jordan-sorensen": "investment_adviser", "parker-sorensen": "it_cyber",
    "avery-okafor": "healthcare_rn", "hayden-okafor": "government",
    "lane-nakamura": "aviation", "lane-nakamura-77b5": "plumbing",
    "elliot-winslow": "real_estate", "quinn-winslow": "financial_broker",
    "devon-holloway": "legal", "marlow-holloway": "real_estate",
    "elliot-cardoza": "plumbing", "jordan-calloway": "hedge_fund",
    "lane-delacroix": "aviation", "riley-rivas": "military", "wren-sabin": "government",
}

# Invented employers per profession. Several are shared across subjects on purpose:
# a shared employer is a coworker bridge, and `ReportNode.kind` already allows "org".
EMPLOYERS = {
    "military":           [("U.S. Army — Fort Bliss Garrison", "Logistics NCO"), ("Bliss Range Support Group", "Operations Sergeant"), ("Rio Grande Defense Logistics", "Movement Coordinator")],
    "defense_dod":        [("Northgate Defense Systems", "Program Analyst"), ("Potomac Integration Group", "Systems Engineer"), ("Tidewater Naval Support LLC", "Configuration Manager")],
    "it_cyber":           [("Meridian Cloud Security", "Security Engineer"), ("Lattice Data Systems", "Platform Engineer"), ("Redline Threat Labs", "Detection Engineer")],
    "government":         [("IRS Austin Submission Processing Center", "Program Specialist"), ("General Services Administration — Region 11", "Contract Specialist"), ("Bethesda Federal Records Office", "Records Analyst")],
    "legal":              [("Marsh & Ruiz LLP", "Associate Counsel"), ("Colley Avenue Legal Group", "Litigation Associate"), ("Congress Avenue Title Partners", "Closing Attorney")],
    "investment_adviser": [("Barton Creek Advisors", "Portfolio Adviser"), ("Windrose Capital Partners", "Client Adviser"), ("Sunrise Wealth Group", "Financial Planner")],
    "financial_broker":   [("Windrose Capital Partners", "Registered Representative"), ("Pecan Street Securities", "Broker"), ("Hill Country Brokerage", "Associate Broker")],
    "hedge_fund":         [("Clarendon Alpha Management", "Research Analyst"), ("Potomac Quant Partners", "Portfolio Analyst")],
    "real_estate":        [("Gattis Road Realty", "Managing Broker"), ("Sunrise Wealth Group", "Commercial Agent"), ("Barton Springs Property Co.", "Listing Agent")],
    "healthcare_rn":      [("Bethesda Regional Medical Center", "Registered Nurse"), ("Walter Reed Contract Nursing Pool", "Charge Nurse")],
    "aviation":           [("Gulf Coast Air Services", "Line Captain"), ("Hampton Roads Rotor Works", "A&P Mechanic"), ("Bergstrom Flight Support", "Dispatch Supervisor")],
    "plumbing":           [("Tanner Mechanical Services", "Master Plumber"), ("Kirby Drive Mechanical", "Service Lead")],
}

# Distinct pull dates so no card reads "undated". Demo trio pulled today.
PULL_DATES = ["2026-06-19", "2026-06-20", "2026-06-24", "2026-07-15", "2026-07-24",
              "2026-08-02", "2026-08-11", "2026-08-19", "2026-09-04", "2026-09-12",
              "2026-09-18", "2026-09-29"]

BY_SLUG = {r[0]: r for r in ROSTER}
FAM_OF = {s: fam for fam, (_, _, _, members) in FAMILIES.items() for s, _ in members}
ROLE_OF = {s: FAMILIES[FAM_OF[s]][2] for s in BY_SLUG}


def eid(slug: str) -> str:
    _, _, _, code, ini = BY_SLUG[slug]
    return f"E-{ini}-{code.split('-')[1]}"


def addr(city_key: str, rnd: random.Random, hash_id: str, first_y: int, last_y: int) -> dict:
    city, state, zips, streets = CITIES[city_key]
    num = rnd.randint(100, 8999)
    street = rnd.choice(streets)
    return {
        "addressHash": hash_id,
        "fullAddress": f"{num} {street}, {city}, {state} {rnd.choice(zips)}",
        "houseNumber": str(num),
        "street": street,
        "city": city,
        "state": state,
        "zip": rnd.choice(zips),
        "firstReportedDate": f"{rnd.randint(1,12)}/1/{first_y}",
        "lastReportedDate": f"{rnd.randint(1,12)}/1/{last_y}",
        "isDeliverable": True,
        "isPublic": True,
    }


def phone(rnd: random.Random, area: str, forced: str | None = None) -> dict:
    carrier, ptype = rnd.choice(CARRIERS)
    num = forced or f"({area}) 555-{rnd.randint(100, 999):04d}"
    return {"phoneNumber": num, "company": carrier, "phoneType": ptype,
            "isConnected": rnd.random() > 0.2, "isPublic": True}


AREA = {"austin": "512", "round rock": "512", "el paso": "915", "arlington": "703",
        "bethesda": "301", "norfolk": "757", "houston": "713"}

REL_KIND = {"parent": ("Child", "ac"), "child": ("Parent", "ac"),
            "sibling": ("Sibling", "ab"), "spouse": ("Spouse", "aa")}


def build() -> dict[str, dict]:
    docs: dict[str, dict] = {}
    # shared household + landline per family
    fam_home = {f: f"A-{f[:3].upper()}-HOME" for f in FAMILIES}
    fam_line: dict[str, str] = {}
    for fam, (home, _, _, _) in FAMILIES.items():
        r = random.Random(f"line:{fam}")
        fam_line[fam] = f"({AREA[home]}) 555-{r.randint(1000, 9999)}"
    # shared roommate addresses
    room_hash = {}
    for a, b, city in ROOMMATES:
        room_hash[(a, b)] = f"A-RM-{BY_SLUG[a][4]}{BY_SLUG[b][4]}"

    for slug, alias, nick, code, ini in ROSTER:
        rnd = random.Random(f"subject:{slug}")
        fam = FAM_OF[slug]
        home, second, role, members = FAMILIES[fam]
        first, last = alias.split(" ", 1)
        role_in_fam = dict(members)[slug]
        age = {"parent": rnd.randint(44, 58), "sibling": rnd.randint(33, 46),
               "child": rnd.randint(22, 32)}[role_in_fam]

        addresses = [
            addr(home, rnd, fam_home[fam], 2026 - (age - 20), 2026),            # family home
            addr(home, rnd, f"A-{ini}-1", 2026 - (age - 24), 2026 - (age - 30)),  # own place
            addr(second, rnd, f"A-{ini}-2", 2026 - (age - 18), 2026 - (age - 23)),  # earlier metro
        ]
        for (a, b, city), h in zip(ROOMMATES, [room_hash[(x, y)] for x, y, _ in ROOMMATES]):
            if slug in (a, b):
                addresses.append(addr(city, rnd, h, 2026 - (age - 21), 2026 - (age - 25)))

        phones = [phone(rnd, AREA[home]), phone(rnd, AREA[home], fam_line[fam])]
        if rnd.random() > 0.4:
            phones.append(phone(rnd, AREA[second]))

        emails = [f"{first[0].lower()}.{last.split()[-1].lower()}@{rnd.choice(MAIL)}",
                  f"{first.lower()}{rnd.randint(11,99)}@{rnd.choice(MAIL)}"]
        if rnd.random() > 0.5:
            emails.append(f"{nick.lower()}.{last.split()[-1].lower()}@{rnd.choice(MAIL)}")

        rels = []
        for other, other_role in members:               # family -> real bridges
            if other == slug:
                continue
            o_alias = BY_SLUG[other][1]
            o_first, o_last = o_alias.split(" ", 1)
            kind, level = REL_KIND[other_role if other_role != role_in_fam else "sibling"]
            rels.append({
                "entityId": eid(other), "firstName": o_first, "middleName": "",
                "lastName": o_last, "suffix": "", "relativeType": kind,
                "relativeLevel": level, "score": rnd.randint(180, 260),
                "sharedHouseholdIds": [fam_home[fam]],
                "city": CITIES[FAMILIES[FAM_OF[other]][0]][0],
                "state": CITIES[FAMILIES[FAM_OF[other]][0]][1], "isDeceased": False,
            })
        for a, b, _ in ROOMMATES:                        # roommate -> cross-family bridge
            other = b if slug == a else a if slug == b else None
            if not other:
                continue
            o_first, o_last = BY_SLUG[other][1].split(" ", 1)
            rels.append({
                "entityId": eid(other), "firstName": o_first, "middleName": "",
                "lastName": o_last, "suffix": "", "relativeType": "Associate",
                "relativeLevel": "ab", "score": rnd.randint(120, 170),
                "sharedHouseholdIds": [room_hash[(a, b)]],
                "city": CITIES[FAMILIES[FAM_OF[other]][0]][0],
                "state": CITIES[FAMILIES[FAM_OF[other]][0]][1], "isDeceased": False,
            })
        # one external relative for texture (not a subject in the set)
        rels.append({
            "entityId": f"R-{ini}-EX", "firstName": rnd.choice(
                ["Nadia", "Curtis", "Imani", "Leo", "Rosa", "Dmitri", "Aiko", "Beth"]),
            "middleName": "", "lastName": last.split()[-1], "suffix": "",
            "relativeType": rnd.choice(["Aunt/Uncle", "Cousin", "In-Law"]),
            "relativeLevel": "ad", "score": rnd.randint(80, 130),
            "sharedHouseholdIds": [], "city": CITIES[home][0], "state": CITIES[home][1],
            "isDeceased": False,
        })

        akas = [{"firstName": first, "middleName": "", "lastName": last}]
        if role_in_fam != "child" and rnd.random() > 0.5:
            akas.append({"firstName": first, "middleName": nick, "lastName": last})

        associates = []
        for other in rnd.sample([s for s in BY_SLUG if FAM_OF[s] != fam], 2):
            o_first, o_last = BY_SLUG[other][1].split(" ", 1)
            associates.append({"firstName": o_first, "middleName": "", "lastName": o_last})

        role = ROLE_BY_SLUG[slug]
        pool = EMPLOYERS[role]
        n_emp = 2 if age < 35 else 3
        start = rnd.randrange(len(pool))
        picks = [pool[(start + k) % len(pool)] for k in range(min(n_emp, len(pool)))]
        employers, year = [], 2026
        for k, (co, title) in enumerate(picks):
            to_y = year
            from_y = max(2026 - (age - 20), to_y - rnd.randint(2, 6))
            employers.append({
                "company": co, "title": title,
                "city": CITIES[home][0], "state": CITIES[home][1],
                "fromDate": f"{rnd.randint(1,12)}/1/{from_y}",
                "toDate": "present" if k == 0 else f"{rnd.randint(1,12)}/1/{to_y}",
                "isCurrent": k == 0,
            })
            year = from_y
        pulled = ("2026-09-29" if slug.startswith("demo-")
                  else PULL_DATES[rnd.randrange(len(PULL_DATES))])

        docs[slug] = {
            "persons": [{
                "entityId": eid(slug), "fullName": alias,
                "name": {"firstName": first, "middleName": "", "lastName": last, "suffix": ""},
                "age": age, "dob": f"{rnd.randint(1,12)}/XX/{2026 - age}",
                "addresses": addresses, "phoneNumbers": phones, "emailAddresses": emails,
                "relativesSummary": rels, "akas": akas, "associatesSummary": associates,
                "employers": employers, "occupation": picks[0][1],
                "indicators": [], "isPublic": True, "sparseFlag": False,
            }],
            "requestId": f"DEMO-{eid(slug)}", "requestType": "Person",
            "requestTime": f"{pulled}T09:00:00.000000", "isError": False,
            "_mock": True,
            "_note": ("FICTIONAL demo identity — invented, not a real person. Generated by "
                      "scripts/generate_sample_data.py for illustration only."),
        }
    return docs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    docs = build()
    wrote, skipped = 0, []
    for slug, doc in docs.items():
        d = OUT / slug
        f = d / "person.v1-broad.json"
        if f.exists():
            try:
                if json.loads(f.read_text()).get("_mock") is not True:
                    skipped.append(slug)          # guard: never touch non-mock data
                    continue
            except Exception:
                skipped.append(slug)
                continue
        if args.dry_run:
            wrote += 1
            continue
        d.mkdir(parents=True, exist_ok=True)
        f.write_text(json.dumps(doc, indent=2) + "\n")
        wrote += 1

    print(f"{'would write' if args.dry_run else 'wrote'} {wrote} subjects into {OUT}")
    if skipped:
        print(f"SKIPPED (not _mock, left untouched): {', '.join(skipped)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
