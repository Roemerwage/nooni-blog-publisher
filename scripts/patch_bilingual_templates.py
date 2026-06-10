#!/usr/bin/env python3
"""Patch all 8 Klaviyo templates with NL/EN bilingual content based on $locale."""

import json, ssl, urllib.request, urllib.parse

KEY = "pk_SkzfaG_f694b07e95151a5b5e2294beb8d7a5049a"
HEADERS = {
    "Authorization": f"Klaviyo-API-Key {KEY}",
    "revision": "2024-10-15",
    "Content-Type": "application/json",
}

ctx = ssl._create_unverified_context()

LOGO = "https://d3k81ch9hvuctc.cloudfront.net/company/SkzfaG/images/d66c5a9c-a27e-4632-b879-3ef21ae95c65.png"
SITE = "https://getnooni.com"

LOCALE_CHECK = "person|lookup:'$locale' == 'nl' or person|lookup:'$locale' == 'nl-NL' or person|lookup:'$locale' == 'nl-BE'"

def bi(nl_text, en_text):
    """Wrap text in a bilingual conditional block."""
    return f"{{% if {LOCALE_CHECK} %}}{nl_text}{{% else %}}{en_text}{{% endif %}}"

def shell(body_html, *, lang_tag="{% if " + LOCALE_CHECK + " %}nl{% else %}en{% endif %}"):
    return f"""<!DOCTYPE html>
<html lang="{lang_tag}"><head><meta charset="utf-8"/><meta content="width=device-width,initial-scale=1" name="viewport"/><title>nooni</title></head>
<body style="margin:0;padding:0;background:#ece2da;">
<table cellpadding="0" cellspacing="0" style="background:#ece2da;padding:24px 16px;" width="100%">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" style="max-width:560px;background:#feeddd;border-radius:20px;overflow:hidden;" width="100%">
<tr><td><table cellpadding="0" cellspacing="0" width="100%">
<tr><td align="center" style="padding:36px 40px 24px;background:#feeddd;"><a href="{SITE}" style="text-decoration:none;display:block;text-align:center;">
<img alt="nooni" src="{LOGO}" style="display:inline-block;border:0;height:auto;" width="72"/>
</a></td></tr>
</table></td></tr>
<tr><td style="padding:0 44px 44px;">
{body_html}
</td></tr>
<tr><td><table cellpadding="0" cellspacing="0" width="100%">
<tr><td style="padding:28px 40px;border-top:1px solid #ece2da;background:#feeddd;text-align:center;">
<p style="margin:0 0 6px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#283e30;opacity:.45;">
© 2025 Nooni · Amsterdam · <a href="{SITE}" style="color:#283e30;opacity:.45;text-decoration:none;">getnooni.com</a>
</p>
<p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;">
<a href="{{{{ unsubscribe_url }}}}" style="color:#283e30;opacity:.35;text-decoration:underline;">{bi('Uitschrijven','Unsubscribe')}</a>
&nbsp;·&nbsp;
<a href="{{{{ manage_preferences_url }}}}" style="color:#283e30;opacity:.35;text-decoration:underline;">{bi('Voorkeuren','Preferences')}</a>
</p>
</td></tr>
</table></td></tr>
</table>
</td></tr>
</table></body></html>"""

def p(text, mb="16px", size="15px", color="#283e30", lh="1.75"):
    return f'<p style="margin:0 0 {mb};font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:{size};line-height:{lh};color:{color};">{text}</p>'

def eyebrow(text):
    return f'<p style="margin:0 0 14px;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:.12em;color:#688662;text-transform:uppercase;">{text}</p>'

def h1(text):
    return f'<h1 style="margin:0 0 16px;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-weight:700;font-size:26px;line-height:1.25;color:#283e30;letter-spacing:-.01em;">{text}</h1>'

def divider():
    return '<table cellpadding="0" cellspacing="0" style="margin:28px 0;" width="100%"><tr><td style="border-top:1px solid #ece2da;"></td></tr></table>'

def cta(url, label):
    return f'<table cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td style="background:#283e30;border-radius:10px;"><a href="{url}" style="display:inline-block;padding:13px 32px;color:#fdf7f1;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:.06em;text-transform:uppercase;">{label}</a></td></tr></table>'

def tip_box(label, body):
    return f'<div style="background:#ece2da;border-radius:12px;padding:16px 18px;margin-bottom:10px;"><p style="margin:0 0 4px;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;color:#688662;text-transform:uppercase;">{label}</p><p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:14px;color:#283e30;line-height:1.65;">{body}</p></div>'

def sign_off():
    return p('– Bas<br/><span style="opacity:.6;font-size:13px;">Founder, Nooni</span>', mb="0")

def stat_box(icon, label_nl, label_en, val_nl, val_en, bg, text_color):
    label = bi(label_nl, label_en)
    val = bi(val_nl, val_en)
    return f'<td style="text-align:center;padding:16px 8px;background:{bg};border-radius:12px;vertical-align:top;" width="32%"><p style="margin:0 0 4px;font-size:18px;">{icon}</p><p style="margin:0 0 2px;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;color:{text_color};letter-spacing:.1em;text-transform:uppercase;">{label}</p><p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:12px;color:#283e30;">{val}</p></td>'


# ─────────────────────────────────────────────
# Template bodies
# ─────────────────────────────────────────────

def body_welcome():
    morning = stat_box("☕", "Ochtend", "Morning", "Energie &amp; focus", "Energy &amp; focus", "#E4CFBB", "#866748")
    afternoon = stat_box("🍵", "Middag", "Afternoon", "Vitaliteit", "Vitality", "#688662", "#fdf7f1")
    evening = stat_box("🍫", "Avond", "Evening", "Slaap &amp; herstel", "Sleep &amp; recovery", "#274472", "#fdf7f1")
    return (
        eyebrow(bi("Welkom", "Welcome"))
        + h1(bi("Je bent er.", "You're in.") + "{% if first_name %} {{ first_name }}.{% endif %}")
        + p(bi("Welkom bij nooni. Je bent in goed gezelschap.", "Welcome to nooni. You're in good company."))
        + p(bi("We maken functionele paddenstoelenmixen die je dagelijkse routine upgraden — zonder tierelantijntjes, zonder vulmiddel.", "We make functional mushroom blends that upgrade your daily routine — no nonsense, no fillers."))
        + divider()
        + f'<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;" width="100%"><tr>{morning}<td width="4%"></td>{afternoon}<td width="4%"></td>{evening}</tr></table>'
        + tip_box(bi("Eerste keer?", "First time?"), bi("Probeer de Welcome Kit — alle drie de blends. 37% korting als abonnement.", "Try the Welcome Kit — all three blends. 37% off as a subscription."))
        + cta(SITE, "Shop getnooni.com")
        + divider()
        + sign_off()
    )

def body_post_purchase_1():
    return (
        eyebrow(bi("Bestelling bevestigd", "Order confirmed"))
        + h1(bi("Bedankt.", "Thank you.") + "{% if first_name %} {{ first_name }}.{% endif %}")
        + p(bi("Je bestelling is ontvangen. We gaan meteen aan de slag.", "Your order is in. We're on it."))
        + p(bi("Je ontvangt een track &amp; trace zodra het pakket onderweg is.", "You'll get a tracking link as soon as your package is on its way."))
        + divider()
        + tip_box(bi("Tip voor dag één", "Tip for day one"), bi("Vervang je gewone koffie door je nooni blend. Geef het 7 dagen — je voelt het verschil.", "Swap your regular coffee for your nooni blend. Give it 7 days — you'll feel the difference."))
        + cta(SITE, bi("Bekijk je bestelling", "View your order"))
        + divider()
        + sign_off()
    )

def body_post_purchase_2():
    tip1_label = bi("Elke dag", "Every day")
    tip1_body = bi("Consistentie werkt beter dan dosis. Eén kopje per dag, elke dag.", "Consistency beats dosage. One cup a day, every day.")
    tip2_label = bi("Het systeem", "The system")
    tip2_body = bi("Coffee of Matcha in de ochtend. Cacao 's avonds — ondersteunt diepe slaap.", "Coffee or Matcha in the morning. Cacao in the evening — supports deep sleep.")
    return (
        eyebrow(bi("Dag 3", "Day 3"))
        + h1(bi("Zo haal je het meeste uit nooni.", "How to get the most out of nooni."))
        + p(bi("{% if first_name %}{{ first_name }}, hoe{% else %}Hoe{% endif %} gaat het? Dit maakt écht het verschil:", "{% if first_name %}{{ first_name }}, how{% else %}How{% endif %} are you getting on? This is what really makes the difference:"))
        + tip_box(tip1_label, tip1_body)
        + tip_box(tip2_label, tip2_body)
        + divider()
        + p(bi("Wat je kunt verwachten:", "What to expect:"), mb="8px", size="13px")
        + p(bi("Week 1–2: je merkt meer focus. Week 3–4: energie stabieler. Maand 2+: het echte verschil.", "Week 1–2: you notice more focus. Week 3–4: steadier energy. Month 2+: the real difference."), size="13px", color="#555")
        + divider()
        + p(bi("Vragen? Reply op deze mail — we lezen alles.", "Questions? Reply to this email — we read everything."))
        + sign_off()
    )

def body_post_purchase_3():
    return (
        eyebrow(bi("14 dagen", "14 days"))
        + h1(bi("Hoe voel jij je?", "How do you feel?"))
        + p(bi("{% if first_name %}{{ first_name }}, twee{% else %}Twee{% endif %} weken nooni. We zijn benieuwd.",
               "{% if first_name %}{{ first_name }}, two{% else %}Two{% endif %} weeks of nooni. We're curious."))
        + p(bi("Een review duurt 60 seconden en helpt anderen een eerlijke keuze maken.",
               "A review takes 60 seconds and helps others make an honest decision."))
        + divider()
        + cta(SITE + "/pages/reviews", bi("Schrijf een review", "Write a review"))
        + divider()
        + p(bi("Heb je alle drie de blends al geprobeerd?", "Have you tried all three blends yet?"))
        + tip_box(bi("Compleet pakket", "The full set"),
                  bi("Coffee, Matcha &amp; Cacao. Elk een ander moment — samen een systeem. 37% korting als abonnement.",
                     "Coffee, Matcha &amp; Cacao. Each for a different moment — together a system. 37% off as a subscription."))
        + cta(SITE, "Shop getnooni.com")
        + divider()
        + sign_off()
    )

def body_winback():
    quote_block = (
        '<div style="background:#ece2da;border-radius:12px;padding:16px 18px;margin-bottom:10px;">'
        '<p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:14px;color:#283e30;line-height:1.65;font-style:italic;">'
        '"Coffee without the 2pm crash." &nbsp; "Wind down. You\'ve earned it."'
        '</p></div>'
    )
    return (
        eyebrow(bi("We missen je", "We miss you"))
        + h1(bi("{% if first_name %}{{ first_name }}, we{% else %}We{% endif %} missen je.",
                "{% if first_name %}{{ first_name }}, we{% else %}We{% endif %} miss you."))
        + p(bi("Het is even stil geweest.", "It's been quiet for a while."))
        + p(bi("Als het aan drukte lag — of als je gewoon vergat — dit is het moment om opnieuw te beginnen.",
               "Whether life got busy or you just forgot — this is the moment to start again."))
        + quote_block
        + p(bi("4.8/5 op Trustpilot. Gemaakt in Amsterdam. Nog steeds.", "4.8/5 on Trustpilot. Made in Amsterdam. Still."), size="13px", color="#666")
        + divider()
        + tip_box(bi("37% korting — niet voor altijd.", "37% off — not forever."),
                  bi("Zet je bestelling om naar een abonnement en bespaar elke maand.",
                     "Switch your order to a subscription and save every month."))
        + cta(SITE, bi("Begin opnieuw", "Start again"))
        + divider()
        + sign_off()
    )

def body_browse_abandonment():
    review_block = (
        '<div style="background:#ece2da;border-radius:12px;padding:16px 18px;margin-bottom:10px;">'
        '<p style="margin:0 0 4px;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;color:#688662;letter-spacing:.1em;text-transform:uppercase;">Verified buyer</p>'
        + p(bi('"Na twee weken voelde ik het verschil in mijn focus. Geen middagdip meer."',
               '"After two weeks I felt the difference in my focus. No more afternoon slump."'), mb="0")
        + '</div>'
        + '<div style="background:#ece2da;border-radius:12px;padding:16px 18px;margin-bottom:10px;">'
        '<p style="margin:0 0 4px;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;color:#688662;letter-spacing:.1em;text-transform:uppercase;">Verified buyer</p>'
        + p(bi('"Eindelijk een koffie die ik lekker vind én die iets doet."',
               '"Finally a coffee I enjoy that actually does something."'), mb="0")
        + '</div>'
    )
    return (
        eyebrow(bi("Je keek er al naar", "You already looked"))
        + h1(bi("Je liet iets achter.", "You left something behind."))
        + p(bi("{% if first_name %}{{ first_name }}, je{% else %}Je{% endif %} bekeek {{ event.ProductName }}. Het staat nog klaar.",
               "{% if first_name %}{{ first_name }}, you{% else %}You{% endif %} checked out {{ event.ProductName }}. It's still waiting."))
        + divider()
        + review_block
        + divider()
        + tip_box(bi("Actieve aanbieding", "Active offer"),
                  bi("37% korting — alleen bij abonnement. Dubbel geëxtraheerd. 100% vruchtlichamen.",
                     "37% off — subscription only. Dual extracted. 100% fruiting bodies."))
        + cta(SITE + "/collections/all", bi("Bekijk {{ event.ProductName }}", "View {{ event.ProductName }}"))
        + divider()
        + sign_off()
    )

def body_subscription_upsell():
    return (
        eyebrow(bi("Voor jou", "For you"))
        + h1(bi("37% korting. Altijd.", "37% off. Always."))
        + p(bi("{% if first_name %}{{ first_name }}, je{% else %}Je{% endif %} hebt nooni geprobeerd. Nu is de vraag: wil je het elke dag?",
               "{% if first_name %}{{ first_name }}, you've{% else %}You've{% endif %} tried nooni. Now the question is: do you want it every day?"))
        + p(bi("Met een abonnement krijg je dezelfde blend — automatisch, elke maand — voor 37% minder.",
               "With a subscription you get the same blend — automatically, every month — for 37% less."))
        + divider()
        + tip_box(bi("Wat je krijgt", "What you get"),
                  bi("Dezelfde hoge kwaliteit. Geen zorgen over nabestellen. Pauzeer of stop altijd — geen verrassingen.",
                     "The same high quality. No worrying about reordering. Pause or cancel anytime — no surprises."))
        + p(bi('"Consistentie werkt beter dan dosis." Een abonnement maakt dat makkelijk.',
               '"Consistency beats dosage." A subscription makes that easy.'), size="14px", color="#555")
        + cta(SITE + "/collections/subscriptions", bi("Zet om naar abonnement", "Switch to subscription"))
        + divider()
        + sign_off()
    )

def body_replenishment():
    return (
        eyebrow(bi("Bijna op?", "Running low?"))
        + h1(bi("Tijd om bij te bestellen.", "Time to reorder.") + "{% if first_name %} {{ first_name }}.{% endif %}")
        + p(bi("Een maand geleden startte je met nooni. De gemiddelde pouch is nu bijna op.",
               "You started nooni about a month ago. The average pouch is nearly empty by now."))
        + p(bi("Mis de overgang niet — de meeste mensen merken pas na 4+ weken het echte verschil.",
               "Don't miss the transition — most people only notice the real difference after 4+ weeks."))
        + divider()
        + tip_box(bi("Stop niet net als het goed begint.", "Don't stop just as it starts working."),
                  bi("Maand twee is waar mensen het echt voelen. De slimste keuze: zet je bestelling om naar een abonnement. Je bespaart 37% en hoeft er nooit meer aan te denken.",
                     "Month two is where people really feel it. The smartest move: switch to a subscription. You save 37% and never have to think about it again."))
        + cta(SITE + "/collections/subscriptions", bi("Opnieuw bestellen", "Reorder now"))
        + divider()
        + sign_off()
    )


TEMPLATES = {
    "R2D6gu": ("Welcome — Je bent er / You're in", body_welcome()),
    "Wh2esD": ("Post-Purchase 1 — Bestelling bevestigd / Order confirmed", body_post_purchase_1()),
    "QP7jzN": ("Post-Purchase 2 — Dag 3 / Day 3", body_post_purchase_2()),
    "XYNRBJ": ("Post-Purchase 3 — Review request dag 14", body_post_purchase_3()),
    "TLW3Y9": ("Winback — We missen je / We miss you", body_winback()),
    "XmMNZ7": ("Browse Abandonment — Je liet iets achter", body_browse_abandonment()),
    "Sc3Vak": ("Subscription Upsell — 37% korting / 37% off", body_subscription_upsell()),
    "V9SDyF": ("Replenishment — Tijd om bij te bestellen / Time to reorder", body_replenishment()),
}

def patch_template(tid, name, html):
    payload = json.dumps({
        "data": {
            "type": "template",
            "id": tid,
            "attributes": {
                "name": name,
                "html": html,
            }
        }
    }).encode()
    req = urllib.request.Request(
        f"https://a.klaviyo.com/api/templates/{tid}/",
        data=payload,
        headers=HEADERS,
        method="PATCH",
    )
    with urllib.request.urlopen(req, context=ctx) as r:
        return json.loads(r.read())

if __name__ == "__main__":
    for tid, (name, body) in TEMPLATES.items():
        html = shell(body)
        print(f"Patching {tid} — {name} ...", end=" ", flush=True)
        result = patch_template(tid, name, html)
        if "data" in result:
            print("✓")
        else:
            print(f"ERROR: {result}")
