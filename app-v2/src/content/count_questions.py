import json

with open('annex1-sl.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 80)
print("PREGLED ŠTEVILA VPRAŠANJ PO LEKCIJAH")
print("=" * 80)

total = 0
needs_expansion = []

for lesson in data:
    num_questions = len(lesson.get('quizQuestions', []))
    total += num_questions
    status = "✓" if num_questions >= 15 else "✗"
    
    print(f"{status} Lekcija {lesson['id']}: {num_questions:2d} vprašanj - {lesson['title'][:60]}")
    
    if num_questions < 15:
        needs_expansion.append({
            'id': lesson['id'],
            'current': num_questions,
            'needed': 15 - num_questions,
            'title': lesson['title']
        })

print("=" * 80)
print(f"SKUPAJ: {total} vprašanj v {len(data)} lekcijah")
print(f"Potrebno razširiti: {len(needs_expansion)} lekcij")
print("=" * 80)

if needs_expansion:
    print("\nLEKCIJE, KI POTREBUJEJO DODATNA VPRAŠANJA:")
    for item in needs_expansion:
        print(f"  • Lekcija {item['id']}: Dodaj še {item['needed']} vprašanj ({item['current']} -> 15)")
