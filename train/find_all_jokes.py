import os
import glob
import json
import re
from datetime import datetime

# ==============================================================================
# SCAN ALL CHATS EVER EXPORTED FOR EVERY JOKE / HUMOROUS INTERACTION
# Sources:
# 1. all_chats_clean.txt (104,392 WhatsApp-formatted lines from Signal + Insta)
# 2. All 161 Instagram message_*.json threads in your_instagram_activity
# 3. All 8 threads in approved/
# ==============================================================================

OUTPUT_JSON = "/home/aryan/Projects/finetune/final/all_jokes_ever.json"
OUTPUT_TXT  = "/home/aryan/Projects/finetune/final/all_jokes_ever.txt"

LAUGH_EMOJIS = {'😂', '🤣', '💀', '😭', '😆'}
LAUGH_WORDS = {
    'lmao', 'lmfao', 'ded', 'dead', 'hahaha', 'ahahah', 'hahah', 'ahahha',
    'hehe', 'xd', 'pagal hai kya', 'shut up', 'stfu', 'kya bakwas', 
    'bhai kya bolra', 'bruh', 'stop', 'cry aa raha', 'ro dunga', 'marr gaya',
    'good one', 'comedy', 'mast tha', 'epic', 'joke'
}

def fix_encoding(text):
    if not text:
        return ''
    try:
        return text.encode('latin-1').decode('utf-8')
    except Exception:
        return text

def is_noise(t):
    tl = t.strip().lower()
    if not tl or len(tl) <= 1:
        return True
    if any(k in tl for k in ['sent an attachment', 'liked a message', 'reacted', 'audio call', 'video call', 'omitted']):
        return True
    return False

def check_laughter(text):
    tl = text.lower()
    if any(e in text for e in LAUGH_EMOJIS):
        return True
    # Match laughing words
    for w in LAUGH_WORDS:
        if re.search(r'\b' + re.escape(w) + r'\b', tl):
            return True
    if re.search(r'(ha|he|lol|lmao|xd){2,}', tl):
        return True
    return False

all_jokes = []
seen_punchlines = set()

# ── Source 1: Instagram Inbox & Approved JSONs ──────────────────────────────
print("Scanning Instagram threads (including emoji reactions)...")
json_files = glob.glob('/home/aryan/Projects/finetune/data/your_instagram_activity/messages/inbox/*/message_*.json')
json_files += glob.glob('/home/aryan/Projects/finetune/data/approved/*/message_*.json')
json_files = list(set(json_files))

for jf in json_files:
    try:
        with open(jf, 'r', encoding='utf-8') as f:
            d = json.load(f)
        title = fix_encoding(d.get('title', 'Unknown'))
        raw_msgs = d.get('messages', [])
        if not raw_msgs:
            continue

        msgs = []
        for m in raw_msgs:
            s = fix_encoding(m.get('sender_name', ''))
            c = fix_encoding(m.get('content', ''))
            ts = m.get('timestamp_ms', 0) / 1000.0
            reactions = [fix_encoding(r.get('reaction', '')) for r in m.get('reactions', [])]
            if is_noise(c) or m.get('photos') or m.get('videos') or m.get('audio_files') or m.get('share'):
                continue
            msgs.append({
                'sender': 'Aryan' if 'aryan' in s.lower() else s,
                'text': c,
                'timestamp': ts,
                'reactions': reactions
            })

        # Instagram messages are reverse chronological -> sort forward
        msgs.sort(key=lambda x: x['timestamp'])

        for i in range(len(msgs)):
            m = msgs[i]
            if m['sender'] != 'Aryan':
                continue

            punchline = m['text'].strip()
            if len(punchline.split()) < 2 or len(punchline.split()) > 100:
                continue

            # Check Signal 1: Laugh Reaction on Aryan's message
            has_laugh_reaction = any(r in LAUGH_EMOJIS for r in m['reactions'])
            
            # Check Signal 2: Friend laughed immediately in next 1-2 messages
            has_laugh_reply = False
            laughter_trigger = ""
            for k in range(i + 1, min(i + 3, len(msgs))):
                next_m = msgs[k]
                if next_m['sender'] != 'Aryan':
                    if (next_m['timestamp'] - m['timestamp']) > 300:
                        break
                    if check_laughter(next_m['text']):
                        has_laugh_reply = True
                        laughter_trigger = next_m['text']
                        break

            if has_laugh_reaction or has_laugh_reply:
                key = punchline.lower()
                if key in seen_punchlines:
                    continue
                seen_punchlines.add(key)

                # Prior context up to 3 turns
                ctx = []
                for j in range(max(0, i - 3), i):
                    if (m['timestamp'] - msgs[j]['timestamp']) < 3600:
                        ctx.append(f"{msgs[j]['sender']}: {msgs[j]['text']}")

                all_jokes.append({
                    'source': f'Instagram ({title})',
                    'setup': " | ".join(ctx) if ctx else "No preceding context",
                    'punchline': punchline,
                    'proof': 'Laugh reaction on text' if has_laugh_reaction else f'Friend replied: "{laughter_trigger}"'
                })
    except Exception:
        pass

print(f"Total jokes found in Instagram JSON files: {len(all_jokes)}")

# ── Source 2: all_chats_clean.txt (Signal + Parsed Chats) ───────────────────
print("Scanning clean combined text chats (Signal & WhatsApp logs)...")
line_re = re.compile(r'(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2})\s-\s([^:]+):\s(.+)')

with open('/home/aryan/Projects/finetune/final/all_chats_clean.txt', 'r', encoding='utf-8') as f:
    chat_lines = f.readlines()

parsed_chat = []
for l in chat_lines:
    m = line_re.match(l.strip())
    if m:
        sender = m.group(3).strip()
        text = m.group(4).strip()
        if not is_noise(text):
            parsed_chat.append({
                'sender': 'Aryan' if 'aryan' in sender.lower() else sender,
                'text': text
            })

for i in range(len(parsed_chat) - 1):
    curr = parsed_chat[i]
    if curr['sender'] != 'Aryan':
        continue

    punchline = curr['text'].strip()
    if len(punchline.split()) < 2 or len(punchline.split()) > 100:
        continue

    # Look at the next message from friend
    next_m = parsed_chat[i + 1]
    if next_m['sender'] != 'Aryan' and check_laughter(next_m['text']):
        key = punchline.lower()
        if key in seen_punchlines:
            continue
        seen_punchlines.add(key)

        ctx = []
        for j in range(max(0, i - 2), i):
            ctx.append(f"{parsed_chat[j]['sender']}: {parsed_chat[j]['text']}")

        all_jokes.append({
            'source': f'Chat log with {next_m["sender"]}',
            'setup': " | ".join(ctx) if ctx else "No preceding context",
            'punchline': punchline,
            'proof': f'Friend replied: "{next_m["text"]}"'
        })

print(f"Total jokes found across ALL chats: {len(all_jokes)}")

# Save JSON
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(all_jokes, f, indent=2, ensure_ascii=False)

# Save human-readable TXT
with open(OUTPUT_TXT, 'w', encoding='utf-8') as f:
    f.write(f"=== ALL JOKES EVER EXTRACTED FROM ARYAN'S CHATS ({len(all_jokes)} TOTAL) ===\n\n")
    for idx, j in enumerate(all_jokes, 1):
        f.write(f"[{idx}] Source: {j['source']}\n")
        f.write(f"     Setup    : {j['setup']}\n")
        f.write(f"     Aryan    : \"{j['punchline']}\"\n")
        f.write(f"     Reaction : {j['proof']}\n\n")

print(f"Saved JSON to {OUTPUT_JSON}")
print(f"Saved human-readable text to {OUTPUT_TXT}")
