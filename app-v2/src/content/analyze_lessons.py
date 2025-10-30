import json

with open('annex1-sl.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 100)
print("PREGLED LEKCIJ IN VIZUALIZACIJ")
print("=" * 100)

for lesson in data:
    print(f"\nID {lesson['id']}: {lesson['title']}")
    print(f"  Slug: {lesson['slug']}")
    print(f"  VisualComponent: {lesson.get('visualComponent', 'N/A')}")
    print(f"  Tema: {lesson['annexReference']}")
    
print("\n" + "=" * 100)
